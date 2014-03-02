precision mediump float;

attribute vec2 aPos;

uniform mat3 uModelViewProjectionMatrix;

void main() {
    gl_Position = vec4(uModelViewProjectionMatrix * vec3(aPos, 1.0), 1.0);
}

