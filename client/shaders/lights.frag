precision mediump float;

const float PI = 3.14159;
const float res = 256.0;

uniform sampler2D uTexture;
uniform vec2 uLightPos;
uniform float uLightIntensity;

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
    float d = distance(uLightPos, gl_FragCoord.xy);
    float atten = 1.0 / (0.5 + 0.01*d + 0.3*d*d);

    // The tex coord to sample from our 1D shadow map
    vec2 SMUV = vec2(coord, 0.0);

    // The centre tex coord
    float centre = SMSample(SMUV, r);

    float blur = (1.0 / res) * smoothstep(0.0, 1.0, r);

    float sum = 0.0;

    sum += SMSample(vec2(SMUV.x - 4.0*blur, SMUV.y), r) * 0.05;
    sum += SMSample(vec2(SMUV.x - 3.0*blur, SMUV.y), r) * 0.09;
    sum += SMSample(vec2(SMUV.x - 2.0*blur, SMUV.y), r) * 0.12;
    sum += SMSample(vec2(SMUV.x - 1.0*blur, SMUV.y), r) * 0.15;

    sum += centre;

    sum += SMSample(vec2(SMUV.x + 1.0*blur, SMUV.y), r) * 0.15;
    sum += SMSample(vec2(SMUV.x + 2.0*blur, SMUV.y), r) * 0.12;
    sum += SMSample(vec2(SMUV.x + 3.0*blur, SMUV.y), r) * 0.09;
    sum += SMSample(vec2(SMUV.x + 4.0*blur, SMUV.y), r) * 0.05;

    gl_FragColor = vec4(vec3(1.0), sum * smoothstep(1.0, 0.0, r)) * atten * uLightIntensity;
    /*gl_FragColor = vec4(vec3(atten) * 100.0, 1.0);*/
}
