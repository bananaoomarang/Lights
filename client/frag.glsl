precision mediump float;

const float PI = 3.1415826;

uniform vec4 uColor;
uniform vec2 uLightPos;
uniform int uLight; // 0 = no light, 1 =... You guessed it.
uniform float uLightAngle;
uniform float uLightIntensity;
uniform float uSpotDimming; // The higher the more the dimming effect at the edges of the spotlight

vec4 getLight() {
    // Z coord is irrelavent
    vec2 fragPos = vec2(gl_FragCoord.x, gl_FragCoord.y);

    vec2 lightDir = vec2(uLightPos - fragPos);
    vec2 spotDir  = vec2(cos(uLightAngle - (PI / 2.0)), sin(uLightAngle - (PI / 2.0)));

    float spotEffect = dot(normalize(spotDir), normalize(-lightDir));
    float d = distance(uLightPos, fragPos);

    if(spotEffect > cos(PI / 8.0)) {
        spotEffect = pow(spotEffect, uSpotDimming);
        float atten = spotEffect / (0.5 + 0.1*d + 0.05*d*d);

        vec3 lightColor = vec3(atten, atten, atten) * uLightIntensity;

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

