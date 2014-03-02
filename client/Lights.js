var fs = require('fs'),
    kd = require('./lib/keydrown.min.js'),
    howler = require('./lib/howler.min.js'),
    Howl = howler.Howl,
    Vector = require('./Vector'),
    FBO = require('./FBO'),
    Shader = require('./Shader'),
    AABB = require('./AABB'),
    Brick = require('./Brick'),
    Creature = require('./Creature'),
    Player = require('./Player');
    
// Load Shaders
var vertShader = fs.readFileSync(__dirname + '/shaders/default.vert'),
    fragShader = fs.readFileSync(__dirname + '/shaders/default.frag'),
    vertShaderTexture = fs.readFileSync(__dirname + '/shaders/texture.vert'),
    fragShaderTexture = fs.readFileSync(__dirname + '/shaders/texture.frag'),
    fragShaderLights = fs.readFileSync(__dirname + '/shaders/lights.frag'),
    fragShadowMap = fs.readFileSync(__dirname + '/shaders/shadowMap.frag');

module.exports = Lights;

var WIDTH = 512,
    HEIGHT = 512,
    BRICK_SIZE = 25,
    GRAVITY = 300,
    PLAYER_ACC = 500,
    PLAYER_JUMP = 150,
    GROUND_FRICTION = 0.89,
    LIGHT_SIZE = 256,
    HALF_LIGHT = LIGHT_SIZE / 2,
    SHADOW_QUALITY = 512; // Resolution of shadow map...

var LEVEL = [ 
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];

// Cancel the unneeded kdrown loop
kd.stop();

function Lights() {
    this.mouse = new Vector(0, 0);
    this.mouseDown = false;
    this.player = new Player(0, 0);
    this.light = {
        pos: new Vector(0, 0),
        angle: 0,
        intensity: 500,
        spotDimming: 15,
        on: false
    };
    this.bricks = [];
    this.creatures = [];

    // Setup OpenGL Shiz
    this.gl = this.getGL();

    this.defaultShader = new Shader(this.gl, vertShader, fragShader, {
        attributes: ['aPos'],
        uniforms: ['uModelViewProjectionMatrix', 'uColor', 'uLightPos', 'uLight', 'uLightAngle', 'uLightIntensity', 'uSpotDimming']
    });

    this.shadowMapShader = new Shader(this.gl, vertShaderTexture, fragShadowMap, {
        attributes: ['aPos', 'aUV'],
        uniforms: ['uModelViewProjectionMatrix', 'uTexture', 'uStage']
    });

    this.textureShader = new Shader(this.gl, vertShaderTexture, fragShaderTexture, {
        attributes: ['aPos', 'aUV'],
        uniforms: ['uModelViewProjectionMatrix', 'uTexture']
    });

    this.postProductionShader = new Shader(this.gl, vertShaderTexture, fragShaderLights, {
        attributes: ['aPos', 'aUV'],
        uniforms: ['uModelViewProjectionMatrix', 'uTexture']
    });

    this.projectionMatrix = this.makeProjectionMatrix(WIDTH, HEIGHT);
    this.modelViewMatrix = [];

    this.setUniformDefaults();
    
    this.setAttributes();
    
    this.loadIdentity();
    this.mvpMatrix = this.matrixMultiply(this.modelViewMatrix, this.projectionMatrix);
    this.gl.uniformMatrix3fv(this.uModelViewProjectionMatrix, false, this.mvpMatrix);
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);

    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    // Set up buffers and the like
    this.brickBuffer = this.gl.createBuffer();
    this.playerBuffer = this.gl.createBuffer();
    this.torchBuffer = this.gl.createBuffer();
    this.creatureBuffer = this.gl.createBuffer();
    this.textureCoordBuffer = this.gl.createBuffer();
    this.viewportQuad = this.gl.createBuffer();

    this.loadBuffers();
    
    this.shadowMapFBO = new FBO(this.gl, SHADOW_QUALITY, 1);
    this.renderBuffer = new FBO(this.gl, LIGHT_SIZE, LIGHT_SIZE);

    // Load sounds
    this.sounds = {
        click: new Howl({urls:['./sounds/click.wav']}),
        breathing: new Howl({urls:['./sounds/breathing.ogg']}).loop(true),
        outofbreath: new Howl({urls:['./sounds/outofbreath.wav']})
    };

    this.setEventHandlers();
    
    this.loadLevel(LEVEL);
}

var n = new Vector(0, -1),
    e = new Vector(1, 0),
    s = new Vector(0, 1),
    w = new Vector(-1, 0);

Lights.prototype.update = function(dt) {
    kd.tick();
    
    this.defaultShader.use();

    if(this.mouseDown) {
        this.light.pos.set(this.player.torchMvMatrix[6], HEIGHT - (this.player.pos.y + (this.player.h / 2)));
        this.light.angle = Math.atan2(this.mouse.x - this.player.pos.x, this.mouse.y - this.player.pos.y);
        this.light.on = true;
    } else {
        this.light.on = true;
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

    var vec = new Vector(this.light.pos.x - this.bricks[0].aabb.min.x, this.light.pos.y - this.bricks[0].aabb.min.y);

    var faceN = vec.normalize().dp(n),
        faceE = vec.normalize().dp(e),
        faceS = vec.normalize().dp(s),
        faceW = vec.normalize().dp(w);

    if(faceN > 0) {
    }
    if(faceE < 0) {
    }
    if(faceS > 0) {
    }
    if(faceW < 0) {
    }

    if(this.player.pos.x < 0) this.player.pos.x = 0;
    if(this.player.pos.x + this.player.w > WIDTH) this.player.pos.x = WIDTH - this.player.w;
    if(this.player.pos.y < 0) this.player.pos.y = 0;
    if(this.player.pos.y + this.player.h > HEIGHT) {
        this.player.pos.y = HEIGHT - this.player.h;
        this.player.vel.y = 0;
    }

    this.player.update(dt);
};

Lights.prototype.draw = function() {
    //1. Draw occlusion map to internal buffer
    this.renderBuffer.bind();
    
    this.defaultShader.use();

    this.gl.viewport(0, 0, WIDTH, HEIGHT);
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        
    this.setLightUniforms();

    this.drawEntities(new AABB(this.mouse.x - HALF_LIGHT, this.mouse.y - HALF_LIGHT, this.mouse.x + HALF_LIGHT, this.mouse.y + HALF_LIGHT));
    
    //2. Render a shadow map internally using occlusion map
    this.shadowMapFBO.bind();
    this.shadowMapShader.use();

    this.loadIdentity();

    this.gl.viewport(0, 0, SHADOW_QUALITY, 1);
    
    this.gl.enableVertexAttribArray(this.shadowMapShader.attributes.aUV);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.viewportQuad);
    this.gl.vertexAttribPointer(this.shadowMapShader.attributes.aPos, 2, this.gl.FLOAT, false, 0, 0);

    this.renderBuffer.bindTexture();
    this.gl.uniform1i(this.shadowMapShader.uTexture, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
    this.gl.vertexAttribPointer(this.shadowMapShader.attributes.aUV, 2, this.gl.FLOAT, false, 0, 0);

    this.drawArrays(this.modelViewMatrix, this.shadowMapShader);
    
    //3. Composite final scene over actual screen
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.viewport(0, 0, WIDTH, HEIGHT);
    
    // First draw the scene on a black background
    this.defaultShader.use();
    this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.drawEntities();

    // Then slam the lights on top
    this.gl.viewport(this.mouse.x - HALF_LIGHT, HEIGHT - (this.mouse.y + HALF_LIGHT), LIGHT_SIZE, LIGHT_SIZE);
    //this.gl.viewport(0, 0, LIGHT_SIZE, LIGHT_SIZE);
    this.postProductionShader.use();
    this.gl.enableVertexAttribArray(this.postProductionShader.attributes.aUV);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.viewportQuad);
    this.gl.vertexAttribPointer(this.shadowMapShader.attributes.aPos, 2, this.gl.FLOAT, false, 0, 0);

    this.shadowMapFBO.bindTexture();
    //this.renderBuffer.bindTexture();
    this.gl.uniform1i(this.postProductionShader.uniforms.uTexture, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
    this.gl.vertexAttribPointer(this.postProductionShader.attributes.aUV, 2, this.gl.FLOAT, false, 0, 0);

    this.loadIdentity();
    this.drawArrays(this.modelViewMatrix, this.postProductionShader);
};

Lights.prototype.setLightUniforms = function() {
    // Slam down some uniforms
    this.gl.uniform2f(this.defaultShader.uniforms.uLightPos, this.light.pos.x, this.light.pos.y);
    this.gl.uniform1f(this.defaultShader.uniforms.uLightAngle, this.light.angle);

    if(this.light.on) 
        this.gl.uniform1i(this.defaultShader.uniforms.uLight, 1);
    else
        this.gl.uniform1i(this.defaultShader.uniforms.uLight, 0);
};

Lights.prototype.drawEntities = function(occlusion) {
    var originCorrectionMatrix;

    // Draw the bricks
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.brickBuffer);
    this.gl.vertexAttribPointer(this.defaultShader.attributes.aPos, 2, this.gl.FLOAT, false, 0, 0);

    if(occlusion) {
        originCorrectionMatrix = this.makeTranslationMatrix(-this.mouse.x + (HALF_LIGHT), (-this.mouse.y + HEIGHT) - (HALF_LIGHT));
    }

    for (var b = 0; b < this.bricks.length; b++) {
        var brick = this.bricks[b];

        if(occlusion) {
            if(brick.aabb.intersects(occlusion)) {
                this.drawArrays(this.matrixMultiply(brick.mvMatrix, originCorrectionMatrix));
            } else {
                continue;
            }
        } else {
            this.drawArrays(brick.mvMatrix);
        }
    }

    // Draw the player
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.playerBuffer);
    this.gl.vertexAttribPointer(this.defaultShader.attributes.aPos, 2, this.gl.FLOAT, false, 0, 0);
    
    if(occlusion) {
        if(this.player.pos.within(occlusion)) {
            this.drawArrays(this.matrixMultiply(this.player.mvMatrix, originCorrectionMatrix));
        }
    } else {
        this.drawArrays(this.player.mvMatrix);
    }
    
    // Draw the torch
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.torchBuffer);
    this.gl.vertexAttribPointer(this.defaultShader.attributes.aPos, 2, this.gl.FLOAT, false, 0, 0);

    var torchAngle = Math.atan2(this.mouse.x - this.player.pos.x, this.mouse.y - this.player.pos.y);

    // Use the default mvMatrix to rotate it
    this.loadIdentity();
    this.modelViewMatrix = this.matrixMultiply(this.makeRotationMatrix(torchAngle), this.player.torchMvMatrix);

    if(occlusion) {
        this.drawArrays(this.matrixMultiply(this.modelViewMatrix, originCorrectionMatrix));
    } else {
        this.drawArrays(this.modelViewMatrix);
    }

    // Draw the creatures...
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.creatureBuffer);
    this.gl.vertexAttribPointer(this.defaultShader.attributes.aPos, 2, this.gl.FLOAT, false, 0, 0);
    
    for (var c = 0; c < this.creatures.length; c++) {
        var creature = this.creatures[c];
        
        if(occlusion) {
            if(creature.aabb.intersects(occlusion)) {
                this.drawArrays(this.matrixMultiply(creature.mvMatrix, originCorrectionMatrix));
            }
        } else {
            this.drawArrays(creature.mvMatrix);
        }
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

Lights.prototype.setUniformDefaults = function() {
    this.defaultShader.use();
    this.gl.uniform1f(this.defaultShader.uniforms.uLightIntensity, this.light.intensity);
    this.gl.uniform1f(this.defaultShader.uniforms.uSpotDimming, this.light.spotDimming);
};

Lights.prototype.setAttributes = function() {
    this.gl.enableVertexAttribArray(this.defaultShader.attributes.aPos);

    this.gl.enableVertexAttribArray(this.textureShader.attributes.aPos);
    
    this.gl.enableVertexAttribArray(this.shadowMapShader.attributes.aPos);
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

    var viewportQuadVertices = [
            0,   0,
            0,   HEIGHT,
            WIDTH, 0,
            WIDTH, HEIGHT
    ];

    var textureCoords = [
        0.0, 1.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0
    ];

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.brickBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(brickVertices), this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.playerBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(playerVertices), this.gl.STATIC_DRAW);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.torchBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(torchVertices), this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.creatureBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(creatureVertices), this.gl.STATIC_DRAW);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.viewportQuad);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(viewportQuadVertices), this.gl.STATIC_DRAW);
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
};

Lights.prototype.drawArrays = function(mvMatrix, shader) {
    if(!shader) shader = this.defaultShader;

    this.mvpMatrix = this.matrixMultiply(mvMatrix, this.projectionMatrix);
    this.gl.uniformMatrix3fv(shader.uniforms.uModelViewProjectionMatrix, false, this.mvpMatrix);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
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

Lights.prototype.makeTranslationMatrix = function(x, y) {
    return [
        1, 0, 0,
        0, 1, 0,
        x, y, 1
    ];
};
