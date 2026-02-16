import * as THREE from 'three'

// Vertex shader — same as parchment, passes world + local position
const vertexShader = `
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

// Fragment shader — Kubelka-Munk physically-based watercolor
// Uses K (absorption) and S (scattering) coefficients per pigment
// to compute reflectance of thin paint layers over paper substrate
const fragmentShader = `
  precision highp float;

  uniform vec3 uHighlight;
  uniform float uHighlightStrength;

  // Pigment K/S values (per RGB channel) — 4 pigments
  uniform vec3 uK0; // Yellow Ochre
  uniform vec3 uK1; // Burnt Sienna
  uniform vec3 uK2; // Sap Green
  uniform vec3 uK3; // Raw Umber

  uniform vec3 uS0;
  uniform vec3 uS1;
  uniform vec3 uS2;
  uniform vec3 uS3;

  // Paper substrate
  uniform vec3 uPaperColor;

  // Pigment distribution controls
  uniform float uBaseThickness;
  uniform float uThicknessVariation;
  uniform float uOchreAmount;
  uniform float uSiennaAmount;
  uniform float uGreenAmount;
  uniform float uUmberAmount;
  uniform float uRegionScale;
  uniform float uBlotchScale;
  uniform float uGrainScale;
  uniform float uGrainIntensity;
  uniform float uEdgeDarkening;

  // Hex edge
  uniform float uEdgeStrength;
  uniform float uEdgeWidth;

  varying vec3 vWorldPos;
  varying vec3 vLocalPos;

  //
  // Simplex 3D noise — Ashima Arts (MIT License)
  //
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Kubelka-Munk: compute layer reflectance and transmittance
  // K: absorption, S: scattering, d: thickness
  void kmLayer(vec3 K, vec3 S, float d, out vec3 r, out vec3 t) {
    vec3 safeS = max(S, vec3(0.0001));
    vec3 a = (K + safeS) / safeS;
    vec3 b = sqrt(max(a * a - 1.0, vec3(0.0)));
    vec3 bSd = clamp(b * safeS * d, vec3(0.001), vec3(20.0));

    vec3 sh = (exp(bSd) - exp(-bSd)) * 0.5; // sinh
    vec3 ch = (exp(bSd) + exp(-bSd)) * 0.5; // cosh
    vec3 denom = max(b * ch + a * sh, vec3(0.0001));

    r = sh / denom;
    t = b / denom;
  }

  // Compose a layer over a substrate
  vec3 kmCompose(vec3 r_layer, vec3 t_layer, vec3 R_sub) {
    return r_layer + (t_layer * t_layer * R_sub)
                   / max(vec3(0.0001), 1.0 - r_layer * R_sub);
  }

  // Hex edge SDF (pointy-top)
  float hexEdgeDist(vec2 p, float R) {
    float inR = R * 0.8660254;
    vec2 q = abs(p);
    float d = max(q.x, 0.5 * q.x + 0.8660254 * q.y);
    return inR - d;
  }

  void main() {
    vec2 wp = vWorldPos.xz;

    // --- Noise-driven pigment distribution ---

    // Large regions: which pigments dominate where
    float n1 = snoise(vec3(wp * uRegionScale, 0.0)) * 0.5 + 0.5;
    float n2 = snoise(vec3(wp * uRegionScale, 2.7)) * 0.5 + 0.5;
    float n3 = snoise(vec3(wp * uRegionScale * 1.3, 5.1)) * 0.5 + 0.5;

    // Medium blotches: watercolor pooling
    float blotch1 = snoise(vec3(wp * uBlotchScale, 8.3)) * 0.5 + 0.5;
    float blotch2 = snoise(vec3(wp * uBlotchScale * 0.7, 11.5)) * 0.5 + 0.5;

    // Paper grain variation
    float grain = snoise(vec3(wp * uGrainScale, 17.0));
    float fiber = snoise(vec3(wp.x * uGrainScale * 2.0, wp.y * uGrainScale * 0.5, 21.0));

    // Pigment concentrations driven by noise
    // Each pigment occupies overlapping noise-defined regions
    float ochre  = uOchreAmount * smoothstep(0.25, 0.65, n1);
    float sienna = uSiennaAmount * smoothstep(0.4, 0.75, 1.0 - n1) * smoothstep(0.3, 0.6, n2);
    float green  = uGreenAmount * smoothstep(0.45, 0.75, n2) * smoothstep(0.35, 0.65, n3);
    float umber  = uUmberAmount * smoothstep(0.5, 0.8, 1.0 - n2) * smoothstep(0.4, 0.7, 1.0 - n3);

    // Modulate by blotch — watercolor pooling concentrates pigment
    float poolFactor = blotch1 * 0.6 + blotch2 * 0.4;
    float thicknessMod = mix(1.0 - uThicknessVariation, 1.0 + uThicknessVariation, poolFactor);

    // Total pigment concentration
    float totalConc = ochre + sienna + green + umber;

    // If very little pigment, just show paper
    if (totalConc < 0.001) {
      vec3 paper = uPaperColor + grain * uGrainIntensity + fiber * uGrainIntensity * 0.5;
      paper = mix(paper, uHighlight, uHighlightStrength);
      gl_FragColor = vec4(paper, 1.0);
      return;
    }

    // Normalize pigment fractions for mixing
    float invTotal = 1.0 / totalConc;
    float fOchre  = ochre * invTotal;
    float fSienna = sienna * invTotal;
    float fGreen  = green * invTotal;
    float fUmber  = umber * invTotal;

    // KM pigment mixing: weighted average of K and S
    vec3 K_mix = fOchre * uK0 + fSienna * uK1 + fGreen * uK2 + fUmber * uK3;
    vec3 S_mix = fOchre * uS0 + fSienna * uS1 + fGreen * uS2 + fUmber * uS3;

    // Effective paint thickness
    float thickness = uBaseThickness * totalConc * thicknessMod;

    // Compute KM layer reflectance and transmittance
    vec3 r_paint, t_paint;
    kmLayer(K_mix, S_mix, thickness, r_paint, t_paint);

    // Paper with grain texture
    vec3 paperBase = uPaperColor + grain * uGrainIntensity + fiber * uGrainIntensity * 0.5;

    // Compose paint over paper
    vec3 color = kmCompose(r_paint, t_paint, paperBase);

    // Edge darkening — pigment accumulates at watercolor edges
    float edgeNoise = abs(snoise(vec3(wp * uBlotchScale * 2.0, 14.0)));
    float edgeDark = smoothstep(0.02, 0.2, edgeNoise) * (1.0 - smoothstep(0.2, 0.4, edgeNoise));
    color *= 1.0 - edgeDark * uEdgeDarkening * totalConc;

    // Hex edge — darken near tile boundary
    float dist = hexEdgeDist(vLocalPos.xz, 1.0);
    float edgeFactor = 1.0 - smoothstep(0.0, uEdgeWidth, dist);
    color *= 1.0 - edgeFactor * uEdgeStrength;

    // State highlight blend
    color = mix(color, uHighlight, uHighlightStrength);

    gl_FragColor = vec4(color, 1.0);
  }
`

export function createKubelkaMunkMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uHighlight: { value: new THREE.Vector3(0, 0, 0) },
      uHighlightStrength: { value: 0.0 },

      // Pigment K values (absorption) — per RGB channel
      // Yellow Ochre: warm base, semi-opaque earth pigment (muted)
      uK0: { value: new THREE.Vector3(0.12, 0.25, 1.4) },
      uS0: { value: new THREE.Vector3(0.35, 0.3, 0.22) },

      // Burnt Sienna: warm brown, transparent
      uK1: { value: new THREE.Vector3(0.25, 0.75, 1.4) },
      uS1: { value: new THREE.Vector3(0.15, 0.1, 0.08) },

      // Sage Green (desaturated): moderate R absorption, some G absorption, moderate B
      // More muted than pure sap green — parchment-appropriate
      uK2: { value: new THREE.Vector3(0.9, 0.3, 0.7) },
      uS2: { value: new THREE.Vector3(0.15, 0.12, 0.1) },

      // Raw Umber: dark earth, moderate all-channel absorption
      uK3: { value: new THREE.Vector3(0.5, 0.65, 1.1) },
      uS3: { value: new THREE.Vector3(0.12, 0.1, 0.08) },

      // Paper substrate — warm off-white
      uPaperColor: { value: new THREE.Vector3(0.92, 0.89, 0.82) },

      // Distribution controls
      uBaseThickness: { value: 0.5 },
      uThicknessVariation: { value: 0.35 },
      uOchreAmount: { value: 0.55 },
      uSiennaAmount: { value: 0.3 },
      uGreenAmount: { value: 0.35 },
      uUmberAmount: { value: 0.15 },
      uRegionScale: { value: 0.06 },
      uBlotchScale: { value: 0.2 },
      uGrainScale: { value: 4.0 },
      uGrainIntensity: { value: 0.03 },
      uEdgeDarkening: { value: 0.04 },

      // Hex edge
      uEdgeStrength: { value: 0.11 },
      uEdgeWidth: { value: 0.04 },
    },
    vertexShader,
    fragmentShader,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  })
}
