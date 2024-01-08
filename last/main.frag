precision highp float;

uniform vec2 resolution;
uniform float time;
uniform vec2 column;
uniform float f[100];
uniform int line; 

void main() {
  // 正規化（この時点では 0.0 ～ 1.0）
  vec2 coord = gl_FragCoord.xy / resolution;
  // 正負の方向に -1.0 ～ 1.0 で値が分布するように変換 @@@
  vec2 signedCoord = coord * 2.0 - 1.0;

  float existPointCount =  column.x * column.y;
  float wave = 0.0;
  float addCount = 0.0;
  for (int i = 0; i < 100; i++) {
    float flength = f[i];

    float fi = float(i);
    if (fi > existPointCount) {
      continue;
    }

    float xPos = mod(fi, column.x) + 1.;
    float xDivide = column.x;
    float yPos = floor(fi / column.x) + 1.0;
    float yDivide = column.y;

    vec2 pos = vec2(
      (2.0 / xDivide) * xPos - 1.0 - (1.0 / xDivide),
      (2.0 / yDivide) * (column.y - yPos) - 1.0 + (1.0 / yDivide)
    );
    wave += sin((-time * 0.1 + length(signedCoord - pos)) * flength);

    if (flength != 0.0) {
      addCount += 1.0;
    } 
  }
  if (addCount > 1.0) {
    wave = wave / (addCount * 2.0) + .5;
  }

  vec3 rgb = vec3(wave);


  float lightness = 0.0;
  if (
    (-(column.y / resolution.y) < fract(coord.y / (1. /  column.y)) * 2. - 1. && (column.y / resolution.y) > fract(coord.y / (1. /  column.y)) * 2. - 1.)
    || (-(column.x / resolution.x) < fract(coord.x / (1. /  column.x)) * 2. - 1. && (column.x / resolution.x) > fract(coord.x / (1. /  column.x)) * 2. - 1.)
  ) {
    lightness = 5.0;
  }


  gl_FragColor = vec4(rgb + mix(lightness, 0.0, float(line)), 1.0);
}

