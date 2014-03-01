precision mediump float;

const float PI = 3.14159;

uniform sampler2D uTexture;

varying vec2 vUV;

float SMSample(vec2 coord, float r) {
    return step(r, texture2D(uTexture, coord).r);
}

void main() {
    // rect -> polar translation
    vec2 norm = vUV.st * 2.0 - 1.0;
    float theta = atan(norm.y, norm.x);
    float r = length(norm);
    float coord = -(theta + PI) / (2.0 * PI);

    // The tex coord to sample from our 1D shadow map
    vec2 SMUV = vec2(coord, 0.0);

    // The centre tex coord
    float centre = SMSample(SMUV, r);

    float sum = 0.0;

    sum += centre;

    gl_FragColor = vec4(vec3(0.0), sum);
}
