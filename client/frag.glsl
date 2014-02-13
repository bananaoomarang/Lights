precision mediump float;

const float PI = 3.1415826;

uniform vec4 uColor;
uniform vec2 uLightPos;
uniform float uLightAngle;
uniform float uLightIntensity;

void main() {
    // Z coord is irrelavent
    vec2 fragPos = vec2(gl_FragCoord.x, gl_FragCoord.y);

    float d = distance(uLightPos, fragPos);

    float atten = 1.0 / (1.0 + 0.0*d + 0.02*d*d);

    vec3 lightColor = vec3(atten, atten, atten) * uLightIntensity;

    float angleFromLight = atan(fragPos.x - uLightPos.x, -(fragPos.y - uLightPos.y)) - uLightAngle; 

    if(abs(angleFromLight) < (PI / 4.0) && abs(angleFromLight) > 0.0) {
        gl_FragColor = vec4(lightColor, 1.0);
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
