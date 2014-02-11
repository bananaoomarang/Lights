var fs = require('fs'),
    vertShader = fs.readFileSync(__dirname + '/vert.glsl'),
    fragShader = fs.readFileSync(__dirname + '/frag.glsl'),
    Brick = require('./Brick');

module.exports = Lights;

function Lights() {
    this.WIDTH = 500;
    this.HEIGHT = 500;
    this.mouse = {x: 0, y: 0};
    this.bricks = [];

    // Setup OpenGL Shiz
    this.gl = this.getGL();
    this.shaderProgram = this.getShaderProgram(vertShader, fragShader);
    this.gl.useProgram(this.shaderProgram);

    this.projectionMatrix = this.makeProjectionMatrix(this.WIDTH, this.HEIGHT);
    this.modelViewMatrix = [];
    
    this.uModelViewProjectionMatrix = null;
    this.uColor = null;
    this.uLightPos = null;
    this.setUniforms();

    this.positionAttribute = this.gl.getAttribLocation(this.shaderProgram, "position");

    this.gl.enableVertexAttribArray(this.positionAttribute);
    
    this.loadIdentity();
    this.mvpMatrix = this.matrixMultiply(this.modelViewMatrix, this.projectionMatrix);
    this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Set up buffers and the like
    this.brickBuffer = this.gl.createBuffer();

    this.loadBuffers();

    this.spawnBrick(100, 100);

    $(document).mousemove(function(e) {
        var offset = $('canvas').offset();
        this.mouse.x = e.clientX - offset.left;
        this.mouse.y = e.clientY - offset.top;
    }.bind(this));
}

Lights.prototype.update = function(dt) {
    this.gl.uniform2f(this.uLightPos, this.mouse.x, this.mouse.y);
};

Lights.prototype.draw = function() {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.brickBuffer);

    for (var b = 0; b < this.bricks.length; b++) {
        var brick = this.bricks[b];

        this.mvpMatrix = this.matrixMultiply(brick.mvMatrix, this.projectionMatrix);
        this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
};

Lights.prototype.spawnBrick = function(x, y) {
    var brick = new Brick(x, y, 10, 10);

    this.bricks.push(brick);
};

Lights.prototype.getGL = function() {
    var gl,
        canvas = $('canvas').get(0);

    gl = canvas.getContext('webgl') || canvas.getContext("experimental-webgl");

    if(gl) {
        return gl;
    } else {
        alert("Can't get a WebGL context... Which is awkward... Do you have an up to date browser?");
    }
};

Lights.prototype.getShaderProgram = function(vert, frag) {
    var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER),
        fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

    this.gl.shaderSource(vertexShader, vert);
    this.gl.shaderSource(fragmentShader, frag);

    this.gl.compileShader(vertexShader);
    this.gl.compileShader(fragmentShader);

    if(!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
        console.error("Vertex shader won't compile mate: ", this.gl.getShaderInfoLog(vertexShader));
    }
    
    if(!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
        console.error("Fragment shader won't compile mate: ", this.gl.getShaderInfoLog(fragmentShader));
    }

    var program = this.gl.createProgram();

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    return program;
};

Lights.prototype.setUniforms = function() {
    this.uModelViewProjectionMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uModelViewProjectionMatrix');
    this.uColor = this.gl.getUniformLocation(this.shaderProgram, 'uColor');
    this.uLightPos= this.gl.getUniformLocation(this.shaderProgram, 'uLightPos');
};

Lights.prototype.loadBuffers = function() {
    var vertices = [
            0,   0,
            0,   50,
            50, 0,
            50, 50
        ];

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.brickBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);
};

Lights.prototype.loadIdentity = function() {
    this.modelViewMatrix = [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1
    ];
};

// Yeah I did steal this one. How did you know?
Lights.prototype.matrixMultiply = function(a, b) {
  var a00 = a[0*3+0];
  var a01 = a[0*3+1];
  var a02 = a[0*3+2];
  var a10 = a[1*3+0];
  var a11 = a[1*3+1];
  var a12 = a[1*3+2];
  var a20 = a[2*3+0];
  var a21 = a[2*3+1];
  var a22 = a[2*3+2];
  var b00 = b[0*3+0];
  var b01 = b[0*3+1];
  var b02 = b[0*3+2];
  var b10 = b[1*3+0];
  var b11 = b[1*3+1];
  var b12 = b[1*3+2];
  var b20 = b[2*3+0];
  var b21 = b[2*3+1];
  var b22 = b[2*3+2];
  return [a00 * b00 + a01 * b10 + a02 * b20,
          a00 * b01 + a01 * b11 + a02 * b21,
          a00 * b02 + a01 * b12 + a02 * b22,
          a10 * b00 + a11 * b10 + a12 * b20,
          a10 * b01 + a11 * b11 + a12 * b21,
          a10 * b02 + a11 * b12 + a12 * b22,
          a20 * b00 + a21 * b10 + a22 * b20,
          a20 * b01 + a21 * b11 + a22 * b21,
          a20 * b02 + a21 * b12 + a22 * b22];
};

Lights.prototype.makeProjectionMatrix = function(width, height) {
    return [
        2 / width, 0,          0,
        0,        -2 / height, 0,
       -1,         1,          1
    ];
};
