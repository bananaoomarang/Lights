precision mediump float;

uniform vec4 uColor;
uniform vec2 uLightPos;
uniform vec3 uLightColor;
uniform vec3 uIntensity;

varying vec2 vInterpolatedPos;

void main() {
    vec2 fragPos = vec2(gl_FragCoord.x, gl_FragCoord.y);

    float d = distance(uLightPos, fragPos);

    /*vec3 fragIntensity = vec3(1.0, 1.0, 1.0) / (0.001 + 0.22*d + 0.22*pow(d, 2.0));*/
    vec3 fragIntensity = vec3(1.0, 1.0, 1.0) / ((0.01) + (0.003*d) + (0.0*pow(d, 2.0)));

    gl_FragColor = vec4(fragIntensity * vec3(1.0, 0.0, 0.0), 1.0);
}
