precision mediump float;

attribute vec2 position;

uniform mat3 uModelViewProjectionMatrix;

void main() {
    gl_Position = vec4(uModelViewProjectionMatrix * vec3(position, 1.0), 1.0);
}

