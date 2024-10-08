const express = require('express');
const path = require('path');
const { SerialPort } = require('serialport');  // Updated import
const { ReadlineParser } = require('@serialport/parser-readline');  // Updated import

// Initialize the Express application
const app = express();
app.use(express.static('public')); // Serve static files from the "public" directory

app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Variable to store serial data
let serialData = { frequency: 0 };
let port;

// Function to open the serial port
function openSerialPort() {
  try {
    port = new SerialPort({
      path: 'COM5',
      baudRate: 115200
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

    parser.on('data', (line) => {
      const values = line.trim().split(',');
      if (values.length === 4) {
        const [ax, ay, az, frequency] = values.map(parseFloat);
        serialData.frequency = frequency + 0.3;
        console.log(`Received frequency: ${frequency}`);
      }
    });

    port.on('open', () => {
      console.log('Serial port opened successfully.');
    });

    port.on('error', (err) => {
      console.error('Error opening serial port:', err.message);
    });
  } catch (err) {
    console.error('Failed to open serial port:', err.message);
  }
}

// Close the serial port when the process exits
process.on('exit', () => {
  if (port && port.isOpen) {
    port.close(() => {
      console.log('Serial port closed.');
    });
  }
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/data', (req, res) => {
  res.json(serialData);
});

// API endpoint to open the serial port
app.post('/open-serial', (req, res) => {
  if (port && port.isOpen) {
    return res.status(400).json({ message: 'Serial port is already open' });
  }
  openSerialPort();
  res.json({ message: 'Attempting to open serial port' });
});

// Start the server
const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
  openSerialPort();
});

// Handle Ctrl+C to close the serial port and exit gracefully
process.on('SIGINT', () => {
  server.close(() => {
    if (port && port.isOpen) {
      port.close(() => {
        console.log('Serial port closed. Server stopped.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});
