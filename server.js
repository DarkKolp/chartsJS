const express = require('express');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('./src'));
app.use('/CSV', express.static('./CSV'));
app.use('/node_modules', express.static('./node_modules'));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});