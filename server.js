const express = require('express');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('./src'));
app.use('/data', express.static('./data'));
app.use('/node_modules', express.static('./node_modules'));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

const fs = require('fs');
const path = require('path');

// Add this endpoint
app.get('/api/networks', (req, res) => {
  try {
    const dataDir = path.join(__dirname, 'data');
    const networks = [];
    
    // Read directories in the data folder
    const dirs = fs.readdirSync(dataDir);
    
    dirs.forEach(dir => {
      const networkDir = path.join(dataDir, dir);
      if (fs.statSync(networkDir).isDirectory()) {
        // Find JSON files in each network directory
        const files = fs.readdirSync(networkDir).filter(file => file.endsWith('_reportMetrics.json'));
        
        files.forEach(file => {
          networks.push({
            id: dir.toLowerCase().replace(/\s+/g, '-'),
            name: dir,
            fileName: file
          });
        });
      }
    });
    
    res.json(networks);
  } catch (error) {
    console.error('Error scanning networks:', error);
    res.status(500).json({ error: 'Failed to scan networks' });
  }
});