const express = require('express');
const app = express();
const analyzeRouter = require('./routes/analyze');

// Other middleware (bodyParser, etc.) can be added here

// Mount the analyze router under an API path
app.use('/api', analyzeRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 