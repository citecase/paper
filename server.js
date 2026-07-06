const express = require('express');
const cors = require('cors');
const path = require('path');
const parseHandler = require('./api/parse');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static assets directly from the root folder
app.use(express.static(__dirname));

// Route the API call to the serverless handler
app.post('/api/parse', parseHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
