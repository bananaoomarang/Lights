var fs = require('fs'),
    vertShader = fs.readFileSync(__dirname + '/vert.glsl'),
    fragShader = fs.readFileSync(__dirname + '/frag.glsl'),
    kd = require('./lib/keydrown.min.js'),
    howler = require('./lib/howler.min.js'),
    Howl = howler.Howl,
    Vector = require('./Vector'),
    AABB = require('./AABB'),
    Brick = require('./Brick'),
    Creature = require('./Creature'),
    Player = require('./Player');

module.exports = Lights;

var WIDTH = 500,
    HEIGHT = 500,
    BRICK_SIZE = 25,
    GRAVITY = 300,
    PLAYER_ACC = 500,
    PLAYER_JUMP = 150,
    GROUND_FRICTION = 0.89;

var LEVEL = [ 
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Cancel the unneeded kdrown loop
kd.stop();

function Lights() {
    this.mouse = new Vector(0, 0);
    this.mouseDown = false;
    this.player = new Player(0, 0);
    this.bricks = [];
    this.creatures = [];

    // Setup OpenGL Shiz
    this.gl = this.getGL();
    this.shaderProgram = this.getShaderProgram(vertShader, fragShader);
    this.gl.useProgram(this.shaderProgram);

    this.projectionMatrix = this.makeProjectionMatrix(WIDTH, HEIGHT);
    this.modelViewMatrix = [];
    
    this.uModelViewProjectionMatrix = null;
    this.uColor = null;
    this.uLightPos = null;
    this.uLight = null;
    this.uLightAngle = null;
    this.uLightIntensity = null;
    this.uSpotDimming = null;
    this.getUniforms();
    
    this.gl.uniform1f(this.uLightIntensity, 500);
    this.gl.uniform1f(this.uSpotDimming, 15);

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
    this.creatureBuffer = this.gl.createBuffer();
    this.loadBuffers();

    // Load sounds
    this.sounds = {
        click: new Howl({urls:['./sounds/click.wav']}),
        breathing: new Howl({urls:['./sounds/breathing.ogg']}).loop(true),
        outofbreath: new Howl({urls:['./sounds/outofbreath.wav']})
    };

    this.setEventHandlers();
    
    this.loadLevel(LEVEL);
}

Lights.prototype.update = function(dt) {
    kd.tick();

    if(this.mouseDown) {
        this.gl.uniform2f(this.uLightPos, this.player.torchMvMatrix[6], HEIGHT - (this.player.pos.y + (this.player.w / 2)));
        this.gl.uniform1i(this.uLight, 1);
    } else {
        this.gl.uniform1i(this.uLight, 0);
    }

    this.player.acc.y = GRAVITY;

    // Default friciton to nothing
    this.player.friction = 1.0;

    if(this.onGround(this.player)) {
        if(!kd.A.isDown() && !kd.D.isDown()) {
            this.player.friction = GROUND_FRICTION;

            if(Math.abs(this.player.vel.x) < 5) {
                this.player.vel.x = 0;
            }
        } 
    }
    
    this.player.applyPhysics(dt);
    
    for (var b = 0; b < this.bricks.length; b++) {
        var brick = this.bricks[b],
            intersect = this.player.aabb.intersects(brick.aabb);

        if(intersect) {
            if(Math.abs(intersect.x) > 0) {
                this.player.pos.x -= intersect.x;

                if(!this.onGround(this.player)) this.player.vel.x = 0;
            }

            if(Math.abs(intersect.y) > 0) {
                this.player.pos.y -= intersect.y;
                this.player.vel.y = 0;
            }
        }
    }

    if(this.player.pos.x < 0) this.player.pos.x = 0;
    if(this.player.pos.x + this.player.w > WIDTH) this.player.pos.x = WIDTH - this.player.w;
    if(this.player.pos.y < 0) this.player.pos.y = 0;
    if(this.player.pos.y + this.player.h > HEIGHT) this.player.pos.y = HEIGHT - this.player.w;

    this.player.update(dt);
};

Lights.prototype.draw = function() {

    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Draw the bricks

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.brickBuffer);
    this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);

    for (var b = 0; b < this.bricks.length; b++) {
        var brick = this.bricks[b];

        this.mvpMatrix = this.matrixMultiply(brick.mvMatrix, this.projectionMatrix);
        this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
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

    // Slam down a bunch of info to the shaders
    var torchAngle = Math.atan2(this.mouse.x - this.player.pos.x, this.mouse.y - this.player.pos.y);

    this.gl.uniform1f(this.uLightAngle, torchAngle);

    this.mvpMatrix = this.matrixMultiply(this.makeRotationMatrix(torchAngle), this.player.torchMvMatrix);
    this.mvpMatrix = this.matrixMultiply(this.mvpMatrix, this.projectionMatrix);
    this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    // Draw the creatures...
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.creatureBuffer);
    this.gl.vertexAttribPointer(this.positionAttribute, 2, this.gl.FLOAT, false, 0, 0);
    
    for (var c = 0; c < this.creatures.length; c++) {
        var creature = this.creatures[c];

        this.mvpMatrix = this.matrixMultiply(creature.mvMatrix, this.projectionMatrix);
        this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
        this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    }
};

// treats the level as a 20x20 grid (assuming the world stays 500x500)
Lights.prototype.spawnBrick = function(x, y) {
    var brick = new Brick(x*BRICK_SIZE, y*BRICK_SIZE);

    this.bricks.push(brick);
};

Lights.prototype.spawnCreature= function(x, y) {
    var creature = new Creature(x*BRICK_SIZE, y*BRICK_SIZE);

    this.creatures.push(creature);
};

Lights.prototype.loadLevel = function(l) {
    for (var y = 0; y < l.length; y++) {
        for (var x = 0; x < l[y].length; x++) {
            if(l[y][x] === 1) this.spawnBrick(x, y);
            if(l[y][x] === 2) this.spawnCreature(x, y);
        }
    }
};

Lights.prototype.setEventHandlers = function() {
    $(document).mousemove(function(e) {
        var offset = $('canvas').offset();
        this.mouse.x = e.clientX - offset.left;
        this.mouse.y = e.clientY - offset.top;
    }.bind(this));

    $(document).mousedown(function() {
        this.mouseDown = true;
        this.sounds.click.play();
    }.bind(this));
    
    $(document).mouseup(function() {
        this.mouseDown = false;
        this.sounds.click.play();
    }.bind(this));

    kd.D.press(function() {
        this.player.acc.x = PLAYER_ACC;
        this.sounds.breathing.play();
        this.sounds.outofbreath.stop();
    }.bind(this));
    
    kd.D.up(function() {
        if(this.player.acc.x === PLAYER_ACC) {
            this.player.acc.x = 0;
            //this.player.vel.x = 0;
            this.sounds.breathing.stop();
            this.sounds.outofbreath.play();
        }
    }.bind(this));
    
    kd.A.press(function() {
        this.player.acc.x = -PLAYER_ACC;
        this.sounds.breathing.play();
        this.sounds.outofbreath.stop();
    }.bind(this));
    
    kd.A.up(function() {
        if(this.player.acc.x === -PLAYER_ACC) {
            this.player.acc.x = 0;
            //this.player.vel.x = 0;
            this.sounds.breathing.stop();
            this.sounds.outofbreath.play();
        }
    }.bind(this));
    
    kd.W.press(function() {
        if(this.onGround(this.player)) {
            this.player.vel.y = -PLAYER_JUMP;
        }
    }.bind(this));
};

Lights.prototype.onGround = function(obj) {
        var under = new AABB(obj.pos.x, obj.pos.y + obj.h, obj.pos.x + obj.w, obj.pos.y + obj.h + 1);

        for (var i = 0; i < this.bricks.length; i++) {
            var aabb = this.bricks[i].aabb;

            if(under.intersects(aabb)) {
                return true;
            }
        }

        return false;
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

Lights.prototype.getUniforms = function() {
    this.uModelViewProjectionMatrix = this.gl.getUniformLocation(this.shaderProgram, 'uModelViewProjectionMatrix');
    this.uColor = this.gl.getUniformLocation(this.shaderProgram, 'uColor');
    this.uLightPos = this.gl.getUniformLocation(this.shaderProgram, 'uLightPos');
    this.uLight = this.gl.getUniformLocation(this.shaderProgram, 'uLight');
    this.uLightAngle = this.gl.getUniformLocation(this.shaderProgram, 'uLightAngle');
    this.uLightIntensity = this.gl.getUniformLocation(this.shaderProgram, 'uLightIntensity');
    this.uSpotDimming = this.gl.getUniformLocation(this.shaderProgram, 'uSpotDimming');
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
    
    var creatureVertices = [
            0,          0,
            0,          BRICK_SIZE / 2,
            BRICK_SIZE / 2, 0,
            BRICK_SIZE / 2, BRICK_SIZE / 2
        ];

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.brickBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(brickVertices), this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.playerBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(playerVertices), this.gl.STATIC_DRAW);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.torchBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(torchVertices), this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.creatureBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(creatureVertices), this.gl.STATIC_DRAW);
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
