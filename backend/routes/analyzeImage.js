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
      if (code !== 0) {
        console.error('Python process exited with code:', code);
        console.error('Python error output:', error);
        return res.status(500).json({ 
          error: 'Image analysis failed',
          pythonError: error 
        });
      }

      try {
        // Add validation for empty data
        if (!data) {
          throw new Error('No data received from Python script');
        }
        
        const analysisResult = JSON.parse(data);
        const gptResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "Analyze this satellite image and provide insights about the green space and tree coverage."
            },
            {
              role: "user",
              content: `data:image/jpeg;base64,${imageBase64}`
            }
          ],
          max_tokens: 10000
        });

        res.json({
          ...analysisResult,
          analysis: gptResponse.choices[0].message.content
        });
      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
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