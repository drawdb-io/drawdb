const express = require('express');
const cors = require('cors')
const path = require('path');
const app = express();
const fs = require('node:fs');

const DRAWDB_FILE_DIR = process.env.DRAWDB_FILE_DIR || '/usercode'
const DRAWDB_HOME = process.env.DRAWDB_HOME || path.join(__dirname, '../dist');
const DRAWDB_PORT = process.env.DRAWDB_PORT || 8080;

app.use(cors())
app.use(express.json())

// Serve the static files from the DrawDB app
app.use(express.static(DRAWDB_HOME));

// Endpoints
app.post('/api/usercode-files/', (req, res) => {
  const { filename, content } = req.body;
  if (!filename || !content) {
      return res.status(400).send('Filename and content are required');
  }

  const filePath = path.join(DRAWDB_FILE_DIR, filename);
  fs.writeFile(filePath, JSON.stringify(content), 'utf8', (err) => {
      if (err) {
          return res.status(500).send('Error writing ddb file');
      }
      res.send('File written successfully');
  });
});

app.get('/api/usercode-files/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(DRAWDB_FILE_DIR, filename);

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).send('File not found');
      }
      return res.status(500).send('Error reading file');
    }
    res.send(data);
  });
});

app.delete('/api/usercode-files/:filename', (req, res) => {
  const filename = req.params.filename;
  if (!filename) {
    return res.status(400).send('Filename is required');
  }

  const filePath = path.join(DRAWDB_FILE_DIR, filename);
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.send('File does not exists.');
    }
    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).send('Error deleting file');
      }
      res.send('File deleted successfully');
    });
  });
})

app.get('/api/diagrams', (_req, res) => {
  const dirPath = DRAWDB_FILE_DIR;
  fs.readdir(dirPath, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory');
    }
    const ddbFiles = files.filter(file => path.extname(file) === '.ddb');
    const fileContents = ddbFiles.map(file => {
      const filePath = path.join(dirPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    });
    res.json(fileContents);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(DRAWDB_HOME, 'index.html'));
});

app.listen(DRAWDB_PORT, () => {
  console.log(`DrawDB is running on port ${DRAWDB_PORT}`);
});
