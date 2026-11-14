uniform float uConeSlope;

out vec4 fragment;

const int PREPASS_STEPS = 96;

void main() {
  vec3 direction = rayDirection(viewUv(gl_FragCoord.xy * float(PREPASS_TILE)));

  float t = 0.05;
  float cleared = 0.0;
  for (int i = 0; i < PREPASS_STEPS; i++) {
    float d = map(uOrigin + direction * t);
    if (d < HALO_REACH || d * STEP_SCALE < uConeSlope * t) break;
    cleared = t;
    t += d * STEP_SCALE;
    if (t > MAX_DISTANCE) {
      cleared = MAX_DISTANCE;
      break;
    }
  }
  fragment = vec4(max(cleared * 0.985 - 0.02, 0.0), 0.0, 0.0, 1.0);
}
