const float FINE_RELIEF_REACH = 0.059;

float hash31(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float valueNoise(vec3 x) {
  vec3 cell = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  float bottom = mix(
    mix(hash31(cell), hash31(cell + vec3(1.0, 0.0, 0.0)), f.x),
    mix(hash31(cell + vec3(0.0, 1.0, 0.0)), hash31(cell + vec3(1.0, 1.0, 0.0)), f.x),
    f.y
  );
  float top = mix(
    mix(hash31(cell + vec3(0.0, 0.0, 1.0)), hash31(cell + vec3(1.0, 0.0, 1.0)), f.x),
    mix(hash31(cell + vec3(0.0, 1.0, 1.0)), hash31(cell + vec3(1.0, 1.0, 1.0)), f.x),
    f.y
  );
  return mix(bottom, top, f.z);
}

float ridge(vec3 x) {
  float v = 1.0 - abs(2.0 * valueNoise(x) - 1.0);
  return v * v;
}

float coarseRelief(vec3 q) {
  q += 0.6 * sin(uPhase);
  float n = 0.0;
  float scale = 1.0;
  float weight = 0.8;
  float carry = 1.0;
  for (int i = 0; i < 3; i++) {
    float v = ridge(q * scale);
    n += v * weight * carry;
    carry = 0.4 + 0.6 * v;
    q = ROTATE3 * q;
    scale *= 2.03;
    weight *= 0.5;
  }
  return min(n, 1.3);
}

float fineRelief(vec3 q) {
  q = ROTATE3 * (ROTATE3 * (ROTATE3 * (q + 0.6 * sin(uPhase))));
  float n = 0.0;
  float scale = 8.4;
  float weight = 0.05 * uDetail;
  for (int i = 0; i < 3; i++) {
    n += (ridge(q * scale) - 0.33) * weight;
    q = ROTATE3 * q;
    scale *= 2.03;
    weight *= 0.5;
  }
  return n;
}

float ledge(vec3 p) {
  return 0.0;
}
