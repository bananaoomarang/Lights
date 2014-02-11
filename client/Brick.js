module.exports = Brick;

function Brick(x, y) {
    this.w = 50;
    this.h = 50;

    this.vertexBuffer = null;
    this.mvMatrix = [1, 0, 0, 
                     0, 1, 0,
                     x, y, 1];
}

Brick.prototype.move = function(x, y) {
    this.mvMatrix[6] = x;
    this.mvMatrix[7] = y;
};
