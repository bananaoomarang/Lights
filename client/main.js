var Lights = require('./Lights');

require('jquery');

$(document).ready(main);

function main() {
    var LIGHTS = new Lights();

    function loopyLoo() {
        LIGHTS.update();
        LIGHTS.draw();

        requestAnimationFrame(loopyLoo);
    }

    loopyLoo();
}
