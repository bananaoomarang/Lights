var fs = require('fs'),
    vertShader = fs.readFileSync(__dirname + '/vert.glsl'),
    fragShader = fs.readFileSync(__dirname + '/frag.glsl'),
    kd = require('./lib/keydrown.min.js'),
    Vector = require('./Vector'),
    Brick = require('./Brick'),
    Player = require('./Player');

module.exports = Lights;

var WIDTH = 500,
    HEIGHT = 500,
    BRICK_SIZE = 25,
    GRAVITY = 50,
    PLAYER_ACC = 300;

// Cancel the unneeded kdrown loop
kd.stop();

function Lights() {
    this.mouse = new Vector(0, 0);
    this.player = new Player(0, 0);
    this.bricks = [];
    this.drawAABB = false;

    // Setup OpenGL Shiz
    this.gl = this.getGL();
    this.shaderProgram = this.getShaderProgram(vertShader, fragShader);
    this.gl.useProgram(this.shaderProgram);

    this.projectionMatrix = this.makeProjectionMatrix(WIDTH, HEIGHT);
    this.modelViewMatrix = [];
    
    this.uModelViewProjectionMatrix = null;
    this.uColor = null;
    this.uLightPos = null;
    this.uLightIntensity = null;
    this.uDrawAABB = null;
    this.setUniforms();
    
    this.gl.uniform1f(this.uLightIntensity, 100);

    this.positionAttribute = this.gl.getAttribLocation(this.shaderProgram, "position");

    this.gl.enableVertexAttribArray(this.positionAttribute);
    
    this.loadIdentity();
    this.mvpMatrix = this.matrixMultiply(this.modelViewMatrix, this.projectionMatrix);
    this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Set up buffers and the like
    this.brickBuffer = this.gl.createBuffer();
    this.playerBuffer = this.gl.createBuffer();
    this.torchBuffer = this.gl.createBuffer();
    this.loadBuffers();

    $(document).mousemove(function(e) {
        var offset = $('canvas').offset();
        this.mouse.x = e.clientX - offset.left;
        this.mouse.y = 500 - e.clientY - offset.top;
    }.bind(this));

    kd.RIGHT.down(function() {
        this.player.acc.x = PLAYER_ACC;
    }.bind(this));
    
    kd.RIGHT.up(function() {
        this.player.acc.x = 0;
        this.player.vel.x = 0;
    }.bind(this));
    
    kd.LEFT.down(function() {
        this.player.acc.x = -PLAYER_ACC;
    }.bind(this));
    
    kd.LEFT.up(function() {
        this.player.acc.x = 0;
        this.player.vel.x = 0;
    }.bind(this));

    kd.Q.press(function() {
        if(this.drawAABB)
            this.drawAABB = false;
        else
            this.drawAABB = true;
    }.bind(this));

    this.spawnLevel();
}

Lights.prototype.update = function(dt) {
    kd.tick();
    this.gl.uniform2f(this.uLightPos, this.mouse.x, this.mouse.y);


    this.player.acc.y = GRAVITY;

    for (var b = 0; b < this.bricks.length; b++) {
        var brick = this.bricks[b];

        if(this.player.aabb.intersects(brick.aabb)) {
            this.player.acc.y = 0;
            this.player.vel.y = 0;
        }
    }

    this.player.update(dt);
};

Lights.prototype.draw = function() {

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Draw the bricks

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.brickBuffer);
    this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);

    for (var b = 0; b < this.bricks.length; b++) {
        var brick = this.bricks[b];
        if(this.drawAABB) {
            this.gl.uniform1i(this.uDrawAABB, 1);

            this.mvpMatrix = this.matrixMultiply(brick.mvMatrix, this.projectionMatrix);
            this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

            this.gl.uniform1i(this.uDrawAABB, 0);
        } else {
            this.mvpMatrix = this.matrixMultiply(brick.mvMatrix, this.projectionMatrix);
            this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
        }
    }

    // Draw the player
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.playerBuffer);
    this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);

    this.mvpMatrix = this.matrixMultiply(this.player.mvMatrix, this.projectionMatrix);
    this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    
    // Draw the torch
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.torchBuffer);
    this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);

    // This is the angle between the mouse and the player....
    var theta = Math.atan2(this.mouse.x - this.player.pos.x, (HEIGHT - this.mouse.y) - this.player.pos.y);

    this.mvpMatrix = this.matrixMultiply(this.makeRotationMatrix(theta), this.player.mvMatrix);
    this.mvpMatrix = this.matrixMultiply(this.mvpMatrix, this.projectionMatrix);
    this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
};

// treats the level as a 20x20 grid (assuming the world stays 500x500)
Lights.prototype.spawnBrick = function(x, y) {
    var brick = new Brick(x*BRICK_SIZE, y*BRICK_SIZE);

    this.bricks.push(brick);
};

Lights.prototype.spawnLevel = function() {
    this.spawnBrick(0, 5);
    this.spawnBrick(1, 6);
    this.spawnBrick(2, 7);
    this.spawnBrick(3, 7);
    this.spawnBrick(4, 7);
    this.spawnBrick(5, 7);
    this.spawnBrick(0, 6);
    this.spawnBrick(0, 7);
    this.spawnBrick(1, 7);
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
    this.uLightPos = this.gl.getUniformLocation(this.shaderProgram, 'uLightPos');
    this.uLightIntensity = this.gl.getUniformLocation(this.shaderProgram, 'uLightIntensity');
    this.uDrawAABB = this.gl.getUniformLocation(this.shaderProgram, 'uDrawAABB');
};

Lights.prototype.loadBuffers = function() {
    var brickVertices = [
            0,          0,
            0,          BRICK_SIZE,
            BRICK_SIZE, 0,
            BRICK_SIZE, BRICK_SIZE
        ];
    
    var playerVertices = [
            0,          0,
            0,          BRICK_SIZE*2,
            BRICK_SIZE, 0,
            BRICK_SIZE, BRICK_SIZE*2
        ];

    var torchVertices = [
            0,          0,
            0,          BRICK_SIZE,
            BRICK_SIZE / 2, 0,
            BRICK_SIZE / 2, BRICK_SIZE
        ];

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.brickBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(brickVertices), this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.playerBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(playerVertices), this.gl.STATIC_DRAW);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.torchBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(torchVertices), this.gl.STATIC_DRAW);

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


Lights.prototype.makeRotationMatrix = function(angle) {
    var c = Math.cos(angle),
        s = Math.sin(angle);

    return [
        c, -s, 0,
        s,  c, 0,
        0,  0, 1
    ];
};
