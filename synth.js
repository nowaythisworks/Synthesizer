// Express setup
const express = require('express');
const app = express();
const server = require('http').Server(app);
const port = 3000;

const socketPort = 2500;

const five = require('johnny-five');
const board = new five.Board({
    port: "COM10"
});

board.on('ready', function () {
    console.log('Board is ready');

    // ####################
    // EXPRESS SERVER SETUP
    // ####################

    // Serve ALL FILES in root directory
    app.use(express.static(__dirname));
    const io = require('socket.io')(socketPort);

    // Serve index.html on root
    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    // Start server
    server.listen(port, () => {
        console.log(`Server listening at port ${port}`)

        // Socketio setup
        const socketPort = 2000;
        const io = require('socket.io')(socketPort);
        console.log(`Socketio listening at port ${socketPort}`);

        io.on('connection', (socket) => {
            console.log('Socketio connected');
            socket.on('disconnect', () => {
                console.log('Socketio disconnected');
            }
            );
        });
    });
    
    const buttonDigitalPins = [2,3,4,5,6,7,8,9,10,16];

    const buttons = [];
    for (let i = 0; i < buttonDigitalPins.length; i++) {
        buttons[i] = new five.Button({ pin: buttonDigitalPins[i], isPullup: true });
        buttons[i].on('down', function () {
            console.log('Button ' + (i + 1) + ' pressed');
            
            io.emit('keyDown', {
                key: i + 1
            });
        });
        buttons[i].on('up', function () {
            console.log('Button ' + (i + 1) + ' released');
            
            io.emit('keyUp', {
                key: i + 1
            });
        }
        );
    }

    // four potentiometers 10k from A0 to A3
    const potentiometers = [];
    for (let i = 0; i < 4; i++) {
        potentiometers[i] = new five.Sensor({ pin: 'A' + i, freq: 10 });
        potentiometers[i].on('change', function () {
            io.emit('potentiometer', {
                potentiometer: i,
                value: this.value
            });
        }
        );
    }

    // two buttons (pads) on Digital 14, 15
    const pads = [];
    for (let i = 0; i < 2; i++) {
        pads[i] = new five.Button({ pin: 14 + i, isPullup: true });
        pads[i].on('down', function () {
            console.log('Pad ' + (i + 1) + ' pressed');
            
            io.emit('padDown', {
                pad: i + 1
            });
        }
        );
        pads[i].on('up', function () {
            console.log('Pad ' + (i + 1) + ' released');
            
            io.emit('padUp', {
                pad: i + 1
            });
        }
        );
    }
});