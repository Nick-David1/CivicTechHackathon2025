const express = require('express');
const router = express.Router();
const axios = require('axios');
const { MongoClient } = require('mongodb');

// Define your MongoDB connection details (update these with your actual values)
const MONGO_URI = process.env.MONGO_URI; // e.g., "mongodb://localhost:27017"
const DB_NAME = 'yourDatabaseName';
const COLLECTION_NAME = 'satelliteImages';

/**
 * Helper function to save the base64 encoded image in MongoDB.
 * You can later retrieve it for further analysis or display.
 */
async function saveImageToMongo(imageData, { lat, long }) {
    const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        const document = {
            lat,
            long,
            image: imageData,  // base64 encoded image
            timestamp: new Date()
        };
        const result = await collection.insertOne(document);
        return result.insertedId;
    } catch (error) {
        console.error('Error saving image to MongoDB:', error);
        throw error;
    } finally {
        await client.close();
    }
}

// Placeholder functions for calling external APIs.
// You should replace these with your actual API call implementations.

async function callGPTVisionAPI(base64Image) {
    // Example: Send a POST request to GPT Vision API.
    // const response = await axios.post(GPT_VISION_API_URL, { image: base64Image });
    // return response.data;
    return { analysis: 'Dummy GPT Vision analysis result' };
}

async function callDetectreeAnalyzer(base64Image) {
    // Example: Send a POST request to your Detectree API.
    // const response = await axios.post(DETECTREE_API_URL, { image: base64Image });
    // return response.data;
    return { greenspacePercentage: 35 }; // example value
}

router.get('/analyzeImage', async (req, res) => {
    try {
        const { lat, long } = req.query;
        if (!lat || !long) {
            return res.status(400).json({ error: 'Coordinates are required' });
        }
        const zoom = 18; // close-up view
        const width = 800, height = 600;
        const mapboxToken = process.env.MAPBOX_TOKEN;
        const mapboxUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${long},${lat},${zoom}/${width}x${height}?access_token=${mapboxToken}`;

        // Step 2: Fetch the satellite image from Mapbox
        const imageResponse = await axios.get(mapboxUrl, { responseType: 'arraybuffer' });

        // Step 3: Convert the response (binary data) to a Buffer and then to a base64 string.
        const buffer = Buffer.from(imageResponse.data, 'binary');
        const base64Image = buffer.toString('base64');  // now the image is encoded in base64

        // Step 4: Save the base64 encoded image in MongoDB
        const imageId = await saveImageToMongo(base64Image, { lat, long });

        // Step 5: Call the external APIs (GPT Vision and Detectree)
        const gptVisionResult = await callGPTVisionAPI(base64Image);
        const detectreeResult = await callDetectreeAnalyzer(base64Image);

        // Step 6: Aggregate and send back the response
        const responseData = {
            savedImageId: imageId, // Reference to the saved image in MongoDB
            // Optionally, you can also return the Mapbox URL if you need it.
            imageUrl: mapboxUrl,
            greenspace_percentage: detectreeResult.greenspacePercentage,
            gptAnalysis: gptVisionResult
        };

        res.json(responseData);
    } catch (error) {
        console.error("Error in /analyzeImage:", error);
        res.status(500).json({ error: "Failed to analyze image" });
    }
});

module.exports = router; 