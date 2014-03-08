var Vector = require('./Vector'),
    AABB = require('./AABB');

module.exports = Player;
    
var MAX_SPEED = 250;

function Player(x, y) {
    this.pos = new Vector(x, y);
    this.w = 25;
    this.h = 50;
    this.aabb = new AABB(x, y, x + this.w, y + this.h);

    this.acc = new Vector(0, 0);
    this.vel = new Vector(0, 0);
    this.friction = 1.0;

    this.vertexBuffer = null;
    this.mvMatrix = [1, 0, 0, 
                     0, 1, 0,
                     x, y, 1];

    this.torch = {
        pos: new Vector(),
        mvMatrix:
            [1, 0, 0, 
             0, 1, 0,
             x, y + (this.h / 2), 1]
    };

    // Override vector function for pro hax
    this.pos.add = function(v) {
        this.pos.x += v.x;
        this.pos.y += v.y;
    
        this.aabb.translate(this.pos);

        this.mvMatrix[6] = this.pos.x;
        this.mvMatrix[7] = this.pos.y;
    }.bind(this);

    this.pos.set = function(v) {
        this.pos.x = v.x;
        this.pos.y = v.y;
        
        this.aabb.translate(this.pos);

        this.mvMatrix[6] = this.pos.x;
        this.mvMatrix[7] = this.pos.y;
    }.bind(this);
}

Player.prototype.update = function(dt) {
    this.torch.mvMatrix[6] = this.pos.x;
    this.torch.mvMatrix[7] = this.pos.y + (this.h / 2);

    this.torch.pos.set(this.torch.mvMatrix[6], this.torch.mvMatrix[7]);
};

Player.prototype.applyPhysics = function(dt) {
    this.vel.add(this.acc.scalar(dt));
    this.vel.x *= this.friction;
    
    if(this.vel.x > MAX_SPEED) {
        this.vel.x = MAX_SPEED;
    } else if(this.vel.x < -MAX_SPEED) {
        this.vel.x = -MAX_SPEED;
    }

    this.pos.add(this.vel.scalar(dt));
};
