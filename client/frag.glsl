precision mediump float;

uniform vec4 uColor;
uniform vec2 uLightPos;
uniform vec3 uLightColor;
uniform vec3 uIntensity;

varying vec2 vInterpolatedPos;

void main() {
    vec2 fragPos = vec2(gl_FragCoord.x, gl_FragCoord.y);

    float d = distance(uLightPos, fragPos);

    float atten = 1.0 / (1.0 + 0.0*d + 0.02*d*d);
    float intensity = 100.0;

    gl_FragColor = vec4(vec3(atten, atten, atten) * intensity, 1.0);
}
