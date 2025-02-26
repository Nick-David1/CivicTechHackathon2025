const express = require('express');
const { spawn } = require('child_process');
const router = express.Router();

function generateRecommendations(treeCoverPercent, numTrees) {
    const recommendations = [];
    
    if (treeCoverPercent < 20) {
        recommendations.push("• Consider planting more trees to increase green coverage");
        recommendations.push("• Implement community tree planting programs");
        recommendations.push("• Create urban green spaces in vacant lots");
    } else if (treeCoverPercent < 40) {
        recommendations.push("• Maintain existing trees and plant more in sparse areas");
        recommendations.push("• Implement tree preservation policies");
        recommendations.push("• Encourage residents to plant trees in their yards");
    } else {
        recommendations.push("• Continue maintaining healthy tree coverage");
        recommendations.push("• Monitor tree health and replace aging trees");
        recommendations.push("• Educate community about the benefits of trees");
    }

    if (numTrees < 10) {
        recommendations.push("• Focus on increasing tree density in the area");
    }

    return "Based on the actual tree coverage percentage and tree count:\n" + 
        recommendations.slice(0, 3).join("\n");
}

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
        if (analysisResult.error) {
            console.error('Python script error:', analysisResult.error);
            return res.status(500).json({ error: analysisResult.error });
        }

        // Generate local recommendations
        const recommendations = generateRecommendations(
            analysisResult.tree_cover_percent,
            analysisResult.num_trees
        );

        res.json({
            ...analysisResult,
            analysis: recommendations
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