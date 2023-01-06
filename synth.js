// Express setup
const express = require('express');
const app = express();
const server = require('http').Server(app);
const port = 3000;
const socketPort = 2500;

// Easymidi setup
const easymidi = require('easymidi');
const output = new easymidi.Output('Soundmachine Mk. 1', true);

// Board setup
const five = require('johnny-five');
const board = new five.Board({
    port: "COM13"
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

    const buttonDigitalPins = [38, 28, 37, 27, 36, 35, 26, 34, 25, 33, 24, 32, 31, 23, 30, 22, 29, 39, 40, 41, 45, 43, 46, 42, 44, 47, 48, 50, 49, 51, 21, 19, 20, 18];

    const buttons = [];
    for (let i = 0; i < buttonDigitalPins.length; i++) {
        buttons[i] = new five.Button({ pin: buttonDigitalPins[i], isPullup: true });
        buttons[i].on('down', function () {
            console.log("Button " + (i + 1) + " pressed " + Math.random());
            
            io.emit('keyDown', {
                key: i + 1
            });

            output.send('noteon', {
                note: convertPinToNoteNumber(buttonDigitalPins[i]),
                velocity: 127,
                channel: 1
            });
        });
        buttons[i].on('up', function () {
            // console.log('Button ' + (i + 1) + ' released');
            
            io.emit('keyUp', {
                key: i + 1
            });

            output.send('noteoff', {
                note: convertPinToNoteNumber(buttonDigitalPins[i]),
                velocity: 127,
                channel: 1
            });
        });
    }

    // four potentiometers 10k from A0 to A3
    // reead analaog potentiometers on A0, A1, A2, A12, A13, A14, A15
    const pins = ["A1", "A2", "A3", "A12", "A13", "A14", "A15"];

    const potentiometers = [];
    for (let i = 0; i < pins.length; i++) {
        potentiometers[i] = new five.Sensor({ pin: pins[i], freq: 100 });
        potentiometers[i].on('change', function () {
            // flip the value
            const value = 1023 - this.value;
            io.emit('potentiometer', {
                potentiometer: i,
                value: value
            });
        });
    }
});