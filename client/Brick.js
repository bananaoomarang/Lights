var AABB = require('./AABB');

module.exports = Brick;

function Brick(x, y) {
    this.w = 25;
    this.h = 25;
    this.aabb = new AABB(x, y, x + this.w, y + this.h);

    this.vertexBuffer = null;
    this.mvMatrix = [1, 0, 0, 
                     0, 1, 0,
                     x, y, 1];
}

Brick.prototype.move = function(x, y) {
    this.mvMatrix[6] = x;
    this.mvMatrix[7] = y;
};
