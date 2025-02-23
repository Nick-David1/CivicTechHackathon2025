const express = require('express');
const { OpenAI } = require('openai');
const { spawn } = require('child_process');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/analyze', async (req, res) => {
  const { imageBase64, lat, lng } = req.body;

  if (!imageBase64 || !lat || !lng) {
    return res.status(400).json({ error: 'imageBase64, lat, and lng are required' });
  }

  try {
    const pythonProcess = spawn('python3', [
      __dirname + '/../scripts/analyze.py',
      imageBase64,
      lat,
      lng
    ]);

    let data = '';
    let error = '';

    pythonProcess.stdout.on('data', (chunk) => {
      data += chunk.toString();
    });

    pythonProcess.stderr.on('data', (chunk) => {
      error += chunk.toString();
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      return res.status(500).json({ error: 'Failed to start analysis process' });
    });

    pythonProcess.on('close', async (code) => {
      console.log('Python process closed with code:', code);
      if (code !== 0) {
        console.error('Python process exited with code:', code);
        console.error('Python error output:', error);
        return res.status(500).json({
          error: 'Image analysis failed',
          pythonError: error
        });
      }

      try {
        // Log the raw data from Python process
        console.log('Raw Python output:', data);
        if (!data) {
          throw new Error('No data received from Python script');
        }

        // Find the first occurrence of '{'
        const jsonStart = data.indexOf('{');
        if (jsonStart === -1) {
          throw new Error('No JSON data found in python output');
        }
        const jsonString = data.slice(jsonStart);

        const analysisResult = JSON.parse(jsonString);
        // Check if the result contains an error key
        if (analysisResult.error) {
          console.error('Python script error:', analysisResult.error);
          return res.status(500).json({ error: analysisResult.error });
        }

        // Build the message content as a string
        const userMessage = `Location: ${analysisResult.air_quality.city}
Tree Coverage: ${analysisResult.tree_cover_percent.toFixed(2)}%
Trees: ${analysisResult.num_trees}
AQI: ${analysisResult.air_quality.current.pollution.aqius}
Main Pollutant: ${analysisResult.air_quality.current.pollution.mainus}
Temp: ${analysisResult.air_quality.current.weather.tp}°C
Humidity: ${analysisResult.air_quality.current.weather.hu}%
Wind: ${analysisResult.air_quality.current.weather.ws} m/s

Based on the actual tree coverage percentage (${analysisResult.tree_cover_percent.toFixed(2)}%) and tree count (${analysisResult.num_trees}), provide 3 quick, one-sentence bullet point recommendations to improve environmental quality. Focus on actionable, specific suggestions.`;

        // Log the message that will be sent to OpenAI
        console.log('Message sent to OpenAI:', userMessage);

        const gptResponse = await openai.chat.completions.create({
          model: "gpt-4-turbo",
          messages: [
            {
              role: "system",
              content: "You are an environmental expert. Provide exactly 3 concise, one-sentence bullet point recommendations based on tree coverage and count. Start with 'Based on the actual tree coverage percentage and tree count:' and use this format: • [recommendation]"
            },
            {
              role: "user",
              content: userMessage
            }
          ],
          max_tokens: 10000
        });

        res.json({
          ...analysisResult,
          analysis: gptResponse.choices[0].message.content
        });
      } catch (parseError) {
        console.error('Error processing analysis results:', parseError);
        console.error('Raw Python output:', data);
        res.status(500).json({ error: 'Error processing analysis results' });
      }
    });
  } catch (error) {
    console.error("Error during analysis:", error);
    res.status(500).json({ error: "Error during analysis" });
  }
});

module.exports = router;