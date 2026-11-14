const float STEP_SCALE = 0.80;
const float STEP_RELAXED = 0.90;
const float FOG_DENSITY = 0.0007;
const float MAX_DISTANCE = 46.0;
const float CRYSTAL_SIZE = 0.42;

float map(vec3 p) {
  p *= CRYSTAL_SIZE;
  float growth = uCrystalShape.x;
  vec3 offset = vec3(1.0, uCrystalShape.y, uCrystalShape.z) * (growth - 1.0);
  float scale = 1.0;
  for (int i = 0; i < 9; i++) {
    if (float(i) >= uCrystalShape.w) break;
    p = abs(p);
    if (p.x < p.y) p.xy = p.yx;
    if (p.x < p.z) p.xz = p.zx;
    if (p.y < p.z) p.yz = p.zy;
    p = uCrystalRotation * (p * growth - offset);
    scale *= growth;
  }
  vec3 box = abs(p) - vec3(1.0);
  return (length(max(box, 0.0)) + min(max(box.x, max(box.y, box.z)), 0.0)) / scale / CRYSTAL_SIZE;
}
