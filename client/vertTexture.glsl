precision mediump float;

attribute vec2 position;
attribute vec2 aUV;

uniform mat3 uModelViewProjectionMatrix;

varying vec2 vUV;

void main() {
    vUV = aUV;
    gl_Position = vec4(uModelViewProjectionMatrix * vec3(position, 1.0), 1.0);
}

