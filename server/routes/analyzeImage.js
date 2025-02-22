const express = require('express');
const axios = require('axios');
const { getDB } = require('../db'); // Make sure this file exports getDB
const { spawn } = require('child_process');
const router = express.Router();

router.post('/', async (req, res) => {
  const { lat, long, satelliteUrl } = req.body;
  if (!lat || !long || !satelliteUrl) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }
  try {
    // Download the satellite image from the provided URL
    const response = await axios.get(satelliteUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');
    const imageBase64 = imageBuffer.toString('base64');

    // Save the image in MongoDB (save additional metadata as needed)
    const db = await getDB();
    const imageCollection = db.collection('images');
    const savedImageResult = await imageCollection.insertOne({
      lat,
      long,
      satelliteUrl,
      imageBase64,
      createdAt: new Date(),
    });
    console.log("Image saved with id:", savedImageResult.insertedId);

    // Call a Python script to process the downloaded image.
    // For example, this script can call GPT Vision API and your tree detection model.
    // The Python script is expected to output a JSON string with analysis results.
    const pythonProcess = spawn('python3', ['process_image.py', imageBase64]);
    let pythonData = '';
    pythonProcess.stdout.on('data', (data) => {
      pythonData += data.toString();
    });
    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python error: ${data}`);
    });
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script exited with code', code);
        return res.status(500).json({ error: 'Image processing failed.' });
      }
      try {
        const analysisResults = JSON.parse(pythonData);
        return res.json({
          analysisResults,
          savedImageId: savedImageResult.insertedId,
          imageUrl: satelliteUrl, // you might replace this with a processed image URL if needed
        });
      } catch (err) {
        console.error("Error parsing python output", err);
        return res.status(500).json({ error: 'Error parsing image analysis result.' });
      }
    });
  } catch (error) {
    console.error("Error processing analysis:", error);
    res.status(500).json({ error: 'Error processing analysis.' });
  }
});

module.exports = router; 