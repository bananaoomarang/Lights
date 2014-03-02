module.exports = Shader;

function Shader(gl, vert, frag, vars) {
    this.gl = gl;

    this.program = getShaderProgram.call(this, vert, frag);
    this.attributes = {};
    this.uniforms = {};

    for(var uni in vars.uniforms) {
        var uniform = vars.uniforms[uni];

        this.uniforms[uniform] = this.gl.getUniformLocation(this.program, uniform);
    }

    for(var attr in vars.attributes) {
        var attribute = vars.attributes[attr];

        this.attributes[attribute] = this.gl.getAttribLocation(this.program, attribute);
    }
}

Shader.prototype.use = function() {
    this.gl.useProgram(this.program);
};

function getShaderProgram(vert, frag) {
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
}
