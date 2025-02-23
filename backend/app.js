/** @format */

const express = require('express');
const app = express();
const port = 8080;
const cors = require('cors');
require('dotenv').config();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['POST', 'GET'],
  credentials: true
}));

app.use(express.json());

const analyzeImageRouter = require('./routes/analyzeImage');
app.use('/analyzeImage', analyzeImageRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;