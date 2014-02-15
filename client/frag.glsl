precision mediump float;

const float PI = 3.1415826;

uniform vec4 uColor;
uniform vec2 uLightPos;
uniform int uLight; // 0 = no light, 1 =... You guessed it.
uniform float uLightAngle;
uniform float uLightIntensity;

vec4 getLight() {
    // Z coord is irrelavent
    vec2 fragPos = vec2(gl_FragCoord.x, gl_FragCoord.y);

    float d = distance(uLightPos, fragPos);

    float angleFromLight = atan(fragPos.x - uLightPos.x, -(fragPos.y - uLightPos.y)) - uLightAngle;
    vec2 normalFromLight = vec2(cos(angleFromLight), sin(angleFromLight));

    float dp = 1.0 - abs(dot(normalFromLight, normalize(fragPos)));

    float atten = dp / (1.0 + 0.0*d + 0.02*d*d);
    
    vec3 lightColor = vec3(atten, atten, atten) * uLightIntensity;

    if(abs(angleFromLight) < (PI / 4.0) && abs(angleFromLight) > 0.0) {
        return vec4(lightColor, 1.0);
    } else {
        return vec4(0.0, 0.0, 0.0, 1.0);
    }
}

void main() {
    if(uLight == 1) {
        gl_FragColor = getLight();
    } else {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}

