module.exports = FBO;

function FBO(gl, w, h) {
    this.gl = gl;

    this.buffer = this.gl.createFramebuffer();
    this.texture = this.gl.createTexture();
    
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.buffer);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);

    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, w, h, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, null);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);

    this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, this.texture, 0);
    
    if(this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
        console.error("Dayum, couldn't initialize a framebuffer on your GPU");
    }

    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
}

FBO.prototype.bind = function() {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.buffer);
};

FBO.prototype.bindTexture = function() {
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
};
