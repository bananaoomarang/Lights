precision mediump float;

uniform vec4 uColor;
uniform vec2 uLightPos;
uniform float uLightIntensity;
uniform int uDrawAABB; // Draw bounding boxes for debugging purposes 0 = no, 1 = oui

void main() {
    if(uDrawAABB == 1) {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    } else {
        // Z coord is irrelavent
        vec2 fragPos = vec2(gl_FragCoord.x, gl_FragCoord.y);

        float d = distance(uLightPos, fragPos);

        float atten = 1.0 / (1.0 + 0.0*d + 0.02*d*d);

        gl_FragColor = vec4(vec3(atten, atten, atten) * uLightIntensity, 1.0);
    }
}
