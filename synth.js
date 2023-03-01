// Express setup
const express = require('express');
const app = express();
const server = require('http').Server(app);
const port = 3000;
const socketPort = 2500;

// midi setup
const midi = require('midi');

// Set up a new output to the port named "loopMIDI Port"
const output = new midi.output();
output.openPort(1);

console.log(output.getPortName(1));

// on process exit, close the port
process.on('exit', function () {
    output.closePort();
});

// Board setup
// list open com ports
const SerialPort = require('serialport');
SerialPort.list().then(
    ports => ports.forEach(port => console.log(port.path)),
    err => console.error(err)
);

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
    var midiOffset = 48;

    const buttons = [];
    for (let i = 0; i < buttonDigitalPins.length; i++) {
        buttons[i] = new five.Button({ pin: buttonDigitalPins[i], isPullup: true });
        buttons[i].on('down', function () {
            // console.log("Button " + (i + 1) + " pressed " + Math.random());
            
            io.emit('keyDown', {
                key: i + 1
            });

            output.send([144, i + (midiOffset), 127]);
            console.log(i + (midiOffset));
        });
        buttons[i].on('up', function () {
            // console.log('Button ' + (i + 1) + ' released');
            
            io.emit('keyUp', {
                key: i + 1
            });

            output.send([128, i + (midiOffset), 127]);
        });
    }

    // four potentiometers 10k from A0 to A3
    // reead analaog potentiometers on A0, A1, A2, A12, A13, A14, A15
    const pins = ["A1", "A2", "A3", "A12", "A13", "A14", "A15"];
    const values = [0, 0, 0, 0, 0, 0, 0];

    const potentiometers = [];
    for (let i = 0; i < pins.length; i++) {
        potentiometers[i] = new five.Sensor({ pin: pins[i], freq: 10 });
        potentiometers[i].on('change', function () {
            // if the value is not greater than 2 units from the last value, ignore it
            if (Math.abs(this.value - values[i]) > 2) {
                values[i] = this.value;
            } else {
                if (i != 5) return;
            }

            var value;

            // if it's channel 2, adjust the midiOffset by the potentiometer's change * 12
            if (i == 1) {
                // first normalize it between 1 and 8
                value = Math.round(this.value / 128);
                midiOffset = value * 12;
                console.log("New offset set to: " + midiOffset);
                // release all notes
                for (let i = 0; i < 128; i++) {
                    output.send([128, i, 127]);
                }
                return;
            }
            // else if (i == 5) //Pitch Bend
            // {
            //     // normalize the value between -50 and 50
            //     value = Math.round(this.value / 21.3 - 50);
            //     // send via midi
            //     output.send([176, i, value]);
            //     console.log(value);
            // }
            else //Standard (0 to 127)
            {
                // flip the value
                value = 1023 - this.value;
                // normalzize to an integer between 0 and 127
                value = Math.round(value / 8.192);
                // flip it
                value = 127 - value;

                if (i == 5) {
                    // clamp the value between 10 of the middle of 0 and 127
                    if (value < 63 - 10) {
                        value = 63 - 10;
                    }
                    if (value > 63 + 10) {
                        value = 63 + 10;
                    }

                    value -= 2;
                }

                // send via midi
                output.send([176, i, value]);
            }


            io.emit('potentiometer', {
                potentiometer: i,
                value: value
            });
            
            
            if (i == 5) {
                console.log(value);
            }
        });
    }
});