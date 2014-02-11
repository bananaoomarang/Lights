precision mediump float;

attribute vec2 position;

uniform mat3 uModelViewProjectionMatrix;
uniform vec4 uColor;

varying vec2 vInterpolatedPos;

void main() {
    vInterpolatedPos = vec2(0, 0);

    gl_Position = vec4(uModelViewProjectionMatrix * vec3(position, 1.0), 1.0);
}

