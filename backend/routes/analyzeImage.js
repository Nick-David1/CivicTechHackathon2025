const express = require('express');
const { OpenAI } = require('openai');
const router = express.Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post('/analyze', async (req, res) => {
  const { imageBase64 } = req.body;
  
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  try {
    const response = await openai.chat.completions.create({
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
      analysis: response.choices[0].message.content
    });
  } catch (error) {
    if (error.response && error.response.data) {
      console.error("Error processing image with GPT:", error.response.data);
    } else {
      console.error("Error processing image with GPT:", error);
    }
    res.status(500).json({ error: "Error processing image with GPT" });
  }
});

module.exports = router; 