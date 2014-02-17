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

    this.torchMvMatrix = [1, 0, 0, 
                          0, 1, 0,
                          x, y + (this.h / 2), 1];
}

Player.prototype.update = function(dt) {
    this.vel.add(this.acc.scalar(dt));
    
    var facing = this.vel.normalize();

    if(this.vel.x > MAX_SPEED) {
        this.vel.x = MAX_SPEED;
    } else if(this.vel.x < -MAX_SPEED) {
        this.vel.x = -MAX_SPEED;
    }

    this.pos.add(this.vel.scalar(dt));

    this.aabb.translate(this.pos);

    this.mvMatrix[6] = this.pos.x;
    this.mvMatrix[7] = this.pos.y;

    //if(facing.x < 0) {
        this.torchMvMatrix[6] = this.pos.x;
    //} else if(facing.x > 0) {
        //this.torchMvMatrix[6] = this.pos.x + this.w;
    //}
        
    this.torchMvMatrix[7] = this.pos.y + (this.h / 2);
};
