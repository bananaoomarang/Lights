module.exports = Vector;

function Vector(x, y) {
    this.x = x;
    this.y = y;
}

Vector.prototype.set = function(x, y) {
    this.x = x;
    this.y = y;
};

Vector.prototype.add = function(vec) {
    this.x += vec.x;
    this.y += vec.y;

    return this;
};

Vector.prototype.within = function(aabb) {
    if(this.x < aabb.min.x ||
       this.x > aabb.max.x ||
       this.y < aabb.min.y ||
       this.y > aabb.max.y) {
           return false;
       } else {
           return true;
       }
};

Vector.prototype.round = function() {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);

    return this;
};

Vector.prototype.scalar = function(s) {
    return new Vector(this.x*s, this.y*s);
};

Vector.prototype.reverse = function() {
    return new Vector(this.x * -1, this.y * -1);
};

Vector.prototype.dp = function(v) {
    return this.x*v.x + this.y*v.y;
};

Vector.prototype.normalize = function() {
    var l = this.length();

    return new Vector(this.x / l, this. x / l);
};

Vector.prototype.length = function() {
    return Math.sqrt(Math.pow(this.x, 2) * Math.pow(this.y, 2));
};

Vector.prototype.angle = function(v) {
    return Math.acos(this.dp(v) / this.length() * v.length());
};
