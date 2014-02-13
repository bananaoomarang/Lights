var Lights = require('./Lights'),
    Timer = require('./Timer');

require('jquery');

$(document).ready(main);

function main() {
    var LIGHTS = new Lights(),
        dt = new Timer();

    function loopyLoo() {
        LIGHTS.update(dt.getTime() / 1000);
        LIGHTS.draw();

        requestAnimationFrame(loopyLoo);

        dt.reset();
    }

    loopyLoo();
}
