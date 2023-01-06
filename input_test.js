
const five = require('johnny-five');
const board = new five.Board({
    port: "COM13"
});

board.on('ready', function () {
    // reead analaog potentiometers on A0, A1, A2, A13, A14, A15
    const pins = ["A0", "A1", "A2", "A13", "A14", "A15"];

    const pots = [];
    for (let i = 0; i < pins.length; i++) {
        pots[i] = new five.Sensor({ pin: pins[i], freq: 100 });
        pots[i].on('data', function () {
            console.log('Pot ' + (i + 1) + ' value: ' + this.value);
        }
        );
    }
    

});