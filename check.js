const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const port = new SerialPort({
    path: 'COM11',
    baudRate: 115200
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Open the port
port.on('open', () => {
    console.log('Serial port opened');
});

// Read data from the serial port
parser.on('data', data => {
    console.log(`Received data: ${data}`);
});

// Handle errors
port.on('error', err => {
    console.error('Error: ', err.message);
});
