precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUV;

void main() {
    gl_FragColor = texture2D(uTexture, vUV);
    /*gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);*/
}
