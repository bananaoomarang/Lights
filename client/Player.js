var Vector = require('./Vector'),
    AABB = require('./AABB');

module.exports = Player;

var MAX_SPEED = 200;

function Player(x, y) {
    this.pos = new Vector(x, y);
    this.w = 25;
    this.h = 50;
    this.aabb = new AABB(x, y, x + this.w, y + this.h);

    this.acc = new Vector(0, 0);
    this.vel = new Vector(0, 0);

    this.vertexBuffer = null;
    this.mvMatrix = [1, 0, 0, 
                     0, 1, 0,
                     x, y, 1];
}

Player.prototype.update = function(dt) {
    if(Math.abs(this.vel.x) <= MAX_SPEED) {
        this.vel.add(this.acc.scalar(dt));
    } else {
        this.vel.x = MAX_SPEED;
    }

    this.pos.add(this.vel.scalar(dt));

    this.aabb.translate(this.pos);

    this.mvMatrix[6] = this.pos.x;
    this.mvMatrix[7] = this.pos.y;
};
