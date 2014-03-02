precision mediump float;

attribute vec2 aPos;
attribute vec2 aUV;

uniform mat3 uModelViewProjectionMatrix;

varying vec2 vUV;

void main() {
    vUV = aUV;
    gl_Position = vec4(uModelViewProjectionMatrix * vec3(aPos, 1.0), 1.0);
}
