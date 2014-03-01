precision mediump float;

const float PI = 3.14159;

uniform sampler2D uTexture;
uniform int uStage;

varying vec2 vUV;

void main() {
    /*gl_FragColor = texture2D(uTexture, vUV);*/
    /*gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);*/

    float distance = 1.0;

    for(float y = 0.0; y < 512.0; y += 1.0) {
        // rect -> polar coords
        vec2 norm = vec2(vUV.s, y / 512.0) * 2.0 - 1.0;
        float theta = PI*1.5 + norm.x * PI;
        float r = (1.0 + norm.y) * 0.5;

        // Coord to grab from the occlusion map
        vec2 coord = vec2(-r * sin(theta), -r * cos(theta)) / 2.0 + 0.5;

        vec4 data = texture2D(uTexture, coord);

        // Distance from the top of the image
        float distanceTop = y / 512.0;

        // If we've hit an occulder, get a  new distance.
        // Then if the new distance is < current one, use it for our ray

        float caster = data.a;

        if(caster > 0.75) {
            distance = min(distance, distanceTop);

            // TODO try returning here?
        }
    }

    gl_FragColor = vec4(vec3(distance), 1.0);
}
