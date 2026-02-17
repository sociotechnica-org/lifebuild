import * as THREE from 'three'

// Vertex shader — compute world position and local position
const vertexShader = `
  varying vec3 vWorldPos;
  varying vec3 vLocalPos;
  varying vec3 vNormal;

  void main() {
    vLocalPos = position;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

// Fragment shader — layered simplex noise for watercolor/parchment look
const fragmentShader = `
  precision highp float;

  uniform vec3 uHighlight;
  uniform float uHighlightStrength;

  // Noise scales
  uniform float uRegionScale;
  uniform float uRegion2Scale;
  uniform float uBlotchScale;
  uniform float uBlotch2Scale;
  uniform float uWetEdgeScale;
  uniform float uGrainScale;
  uniform float uFiberScaleX;
  uniform float uFiberScaleY;
  uniform float uSpeckleScale;

  // Strengths / intensities
  uniform float uSageStrength;
  uniform float uStainStrength;
  uniform float uPoolLightStrength;
  uniform float uPoolDarkStrength;
  uniform float uWetEdgeStrength;
  uniform float uGrainIntensity;
  uniform float uFiberIntensity;
  uniform float uSpeckleIntensity;

  // Hex edge
  uniform float uEdgeStrength;
  uniform float uEdgeWidth;

  varying vec3 vWorldPos;
  varying vec3 vLocalPos;
  varying vec3 vNormal;

  //
  // Simplex 3D noise — Ashima Arts (MIT License)
  // https://github.com/ashima/webgl-noise
  //
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // Permutations
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
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

    // Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Distance from point to boundary of a pointy-top hexagon (circumradius R)
  // Returns positive inside, 0 at edge, negative outside
  float hexEdgeDist(vec2 p, float R) {
    float inR = R * 0.8660254;  // sqrt(3)/2 — inradius
    vec2 q = abs(p);
    // Two half-plane constraints cover all 6 edges via symmetry:
    // 1. |x| <= inR (left/right edges, normal along X)
    // 2. 0.5*|x| + sqrt(3)/2*|z| <= inR (diagonal edges)
    float d = max(q.x, 0.5 * q.x + 0.8660254 * q.y);
    return inR - d;
  }

  // Color palette — warm parchment tones with subtle wash tints
  const vec3 PARCHMENT       = vec3(0.78, 0.68, 0.50);
  const vec3 PARCHMENT_LIGHT = vec3(0.87, 0.81, 0.67);
  const vec3 PARCHMENT_DARK  = vec3(0.68, 0.58, 0.41);
  const vec3 SAGE_WASH       = vec3(0.65, 0.71, 0.52);  // desaturated sage
  const vec3 WARM_STAIN      = vec3(0.73, 0.58, 0.40);  // tea stain

  void main() {
    vec2 wp = vWorldPos.xz;

    // Layer 1: Large-scale warm/cool regions — big gentle zones
    float region = snoise(vec3(wp * uRegionScale, 0.0)) * 0.5 + 0.5;
    float region2 = snoise(vec3(wp * uRegion2Scale, 2.1)) * 0.5 + 0.5;

    // Layer 2: Medium watercolor blotches — the "pooling" effect
    float blotch = snoise(vec3(wp * uBlotchScale, 3.7)) * 0.5 + 0.5;
    float blotch2 = snoise(vec3(wp * uBlotch2Scale, 5.2)) * 0.5 + 0.5;

    // Layer 3: Watercolor wet-edge effect
    float wetEdge = abs(snoise(vec3(wp * uWetEdgeScale, 8.5)));

    // Layer 4: Paper grain — linen texture
    float grain = snoise(vec3(wp * uGrainScale, 7.3));

    // Layer 5: Directional linen fiber
    float fiber = snoise(vec3(wp.x * uFiberScaleX, wp.y * uFiberScaleY, 11.0));

    // Layer 6: Fine speckle for aged paper feel
    float speckle = snoise(vec3(wp * uSpeckleScale, 19.1));

    // Start with warm parchment base
    vec3 color = PARCHMENT;

    // Sage wash in some areas
    float sageMask = smoothstep(0.45, 0.70, region) * smoothstep(0.35, 0.60, region2);
    color = mix(color, SAGE_WASH, sageMask * uSageStrength);

    // Tea-stain warmth in complementary areas
    float stainMask = smoothstep(0.30, 0.55, 1.0 - region) * smoothstep(0.25, 0.55, 1.0 - region2);
    color = mix(color, WARM_STAIN, stainMask * uStainStrength);

    // Watercolor pooling — light and dark patches
    float pooling = blotch * 0.55 + blotch2 * 0.45;
    color = mix(color, PARCHMENT_LIGHT, smoothstep(0.50, 0.80, pooling) * uPoolLightStrength);
    color = mix(color, PARCHMENT_DARK, smoothstep(0.50, 0.80, 1.0 - pooling) * uPoolDarkStrength);

    // Wet-edge darkening
    float edgeDarken = smoothstep(0.02, 0.15, wetEdge) * (1.0 - smoothstep(0.15, 0.30, wetEdge));
    color *= 1.0 - edgeDarken * uWetEdgeStrength;

    // Paper grain
    color += grain * uGrainIntensity;

    // Directional fiber
    color += fiber * uFiberIntensity;

    // Fine speckle
    color += speckle * uSpeckleIntensity;

    // Hex edge — darken near tile boundary, blending with texture
    float dist = hexEdgeDist(vLocalPos.xz, 1.0);
    float edgeFactor = 1.0 - smoothstep(0.0, uEdgeWidth, dist);
    color *= 1.0 - edgeFactor * uEdgeStrength;

    // State highlight blend
    color = mix(color, uHighlight, uHighlightStrength);

    gl_FragColor = vec4(color, 1.0);
  }
`

export function createParchmentMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uHighlight: { value: new THREE.Vector3(0, 0, 0) },
      uHighlightStrength: { value: 0.0 },

      // Noise scales
      uRegionScale: { value: 0.06 },
      uRegion2Scale: { value: 0.09 },
      uBlotchScale: { value: 0.25 },
      uBlotch2Scale: { value: 0.15 },
      uWetEdgeScale: { value: 0.12 },
      uGrainScale: { value: 4.0 },
      uFiberScaleX: { value: 8.0 },
      uFiberScaleY: { value: 2.0 },
      uSpeckleScale: { value: 12.0 },

      // Strengths / intensities
      uSageStrength: { value: 0.35 },
      uStainStrength: { value: 0.3 },
      uPoolLightStrength: { value: 0.25 },
      uPoolDarkStrength: { value: 0.15 },
      uWetEdgeStrength: { value: 0.03 },
      uGrainIntensity: { value: 0.04 },
      uFiberIntensity: { value: 0.022 },
      uSpeckleIntensity: { value: 0.015 },

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
