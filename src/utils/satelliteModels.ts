import * as THREE from 'three';

/**
 * Procedural 3D Satellite Models for NASA MODIS & VIIRS Spacecraft
 * Built as multi-part composite THREE.Group hierarchies with authentic PBR materials,
 * realistic photovoltaic solar panels, gold thermal foil, optics apertures, and interactive hitboxes.
 */

// Cached procedural solar cell texture
let cachedSolarTexture: THREE.CanvasTexture | null = null;
function getSolarCellTexture(): THREE.CanvasTexture {
  if (cachedSolarTexture) return cachedSolarTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Dark silicon blue base
  ctx.fillStyle = '#06162e';
  ctx.fillRect(0, 0, 256, 256);

  // Micro-textured silicon wafers
  const cellSize = 32;
  for (let x = 0; x < 256; x += cellSize) {
    for (let y = 0; y < 256; y += cellSize) {
      ctx.fillStyle = '#0c2344';
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

      // Fine conductive silver busbars
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + cellSize / 2, y + 2);
      ctx.lineTo(x + cellSize / 2, y + cellSize - 2);
      ctx.stroke();

      // Subtle anti-reflective coating sheen
      ctx.fillStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize / 2);
    }
  }

  cachedSolarTexture = new THREE.CanvasTexture(canvas);
  cachedSolarTexture.wrapS = THREE.RepeatWrapping;
  cachedSolarTexture.wrapT = THREE.RepeatWrapping;
  cachedSolarTexture.repeat.set(2, 2);
  return cachedSolarTexture;
}

/**
 * Creates a high-fidelity 3D model of NASA's Terra or Aqua EOS spacecraft carrying MODIS
 */
export function createTerraAquaMODISModel(colorHex = '#38bdf8'): THREE.Group {
  const root = new THREE.Group();
  root.name = 'TerraAqua_MODIS_Spacecraft';

  // PBR Materials
  const mliGoldMat = new THREE.MeshStandardMaterial({
    color: 0xe5b838, // Brilliant gold multi-layer insulation (MLI)
    metalness: 0.92,
    roughness: 0.22,
  });

  const busMetalMat = new THREE.MeshStandardMaterial({
    color: 0xd8d8d8,
    metalness: 0.75,
    roughness: 0.35,
  });

  const darkTitaniumMat = new THREE.MeshStandardMaterial({
    color: 0x242830,
    metalness: 0.85,
    roughness: 0.4,
  });

  const radiatorMat = new THREE.MeshStandardMaterial({
    color: 0xf5f5f5,
    metalness: 0.25,
    roughness: 0.85,
  });

  const solarCellMat = new THREE.MeshStandardMaterial({
    map: getSolarCellTexture(),
    color: 0x93c5fd,
    metalness: 0.88,
    roughness: 0.16,
    emissive: 0x071b3b,
    emissiveIntensity: 0.45,
  });

  const opticalGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x06111e,
    metalness: 0.95,
    roughness: 0.05,
    reflectivity: 0.9,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  // 1. Primary Spacecraft Main Equipment Bus (Gold MLI foil wrapped body)
  const busGeo = new THREE.BoxGeometry(0.24, 0.18, 0.38);
  const busMesh = new THREE.Mesh(busGeo, mliGoldMat);
  root.add(busMesh);

  // 2. Instrument Radiator Bay (White high-emissivity panel on zenith side)
  const radGeo = new THREE.BoxGeometry(0.246, 0.05, 0.32);
  const radMesh = new THREE.Mesh(radGeo, radiatorMat);
  radMesh.position.set(0, 0.11, 0);
  root.add(radMesh);

  // 3. Solar Array Articulation Boom
  const boomGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.20, 12);
  const boomMesh = new THREE.Mesh(boomGeo, darkTitaniumMat);
  boomMesh.rotation.z = Math.PI / 2;
  boomMesh.position.set(-0.21, 0, 0);
  root.add(boomMesh);

  // 4. Large Multi-Panel Solar Photovoltaic Wing
  const panelGroup = new THREE.Group();
  panelGroup.position.set(-0.46, 0, 0);

  const panelGeo = new THREE.BoxGeometry(0.34, 0.01, 0.58);
  const panelMesh = new THREE.Mesh(panelGeo, solarCellMat);
  panelGroup.add(panelMesh);

  // Solar panel frame border & stiffeners
  const frameGeo = new THREE.BoxGeometry(0.35, 0.014, 0.59);
  const frameMesh = new THREE.Mesh(frameGeo, darkTitaniumMat);
  frameMesh.scale.set(0.99, 0.8, 0.99);
  panelGroup.add(frameMesh);

  root.add(panelGroup);

  // 5. High-Gain Antenna (HGA) Steerable Parabolic Dish
  const dishGroup = new THREE.Group();
  dishGroup.position.set(0.08, 0.18, -0.15);
  dishGroup.rotation.set(-Math.PI * 0.65, Math.PI * 0.25, 0);

  const dishGeo = new THREE.SphereGeometry(0.08, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.42);
  const dishMesh = new THREE.Mesh(dishGeo, busMetalMat);
  dishGroup.add(dishMesh);

  // Antenna Feed Horn & Struts
  const hornGeo = new THREE.CylinderGeometry(0.005, 0.008, 0.06, 8);
  const hornMesh = new THREE.Mesh(hornGeo, darkTitaniumMat);
  hornMesh.position.set(0, 0.035, 0);
  dishGroup.add(hornMesh);

  root.add(dishGroup);

  // 6. MODIS Optical Instrument Module (pointing nadir towards Earth, -Y)
  const modisGroup = new THREE.Group();
  modisGroup.position.set(0, -0.12, 0.04);

  const modisHousingGeo = new THREE.BoxGeometry(0.12, 0.09, 0.16);
  const modisHousing = new THREE.Mesh(modisHousingGeo, darkTitaniumMat);
  modisGroup.add(modisHousing);

  // Double-Sided Scan Mirror Aperture Hood
  const apertureGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.03, 20);
  const apertureMesh = new THREE.Mesh(apertureGeo, opticalGlassMat);
  apertureMesh.position.set(0, -0.055, 0);
  modisGroup.add(apertureMesh);

  root.add(modisGroup);

  // 7. Sensor Identification Beacon Ring (Glowing cyan/blue)
  const beaconGeo = new THREE.RingGeometry(0.048, 0.062, 24);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    side: THREE.DoubleSide,
  });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.rotation.x = Math.PI / 2;
  beaconMesh.position.set(0, -0.19, 0.04);
  root.add(beaconMesh);

  // 8. Pulsing Telemetry Strobe Light
  const strobeGeo = new THREE.SphereGeometry(0.015, 12, 8);
  const strobeMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
  });
  const strobeMesh = new THREE.Mesh(strobeGeo, strobeMat);
  strobeMesh.position.set(0.12, 0.10, 0.18);
  root.add(strobeMesh);

  // 9. Large Invisible Hit-Sphere for smooth mouse detection and raycasting
  const hitGeo = new THREE.SphereGeometry(0.50, 16, 12);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.name = 'hitSphere';
  root.add(hitMesh);

  root.scale.setScalar(0.85);
  return root;
}

/**
 * Creates a high-fidelity 3D model of NASA/NOAA Suomi-NPP or NOAA-20 carrying VIIRS
 */
export function createVIIRSSpacecraftModel(colorHex = '#f59e0b'): THREE.Group {
  const root = new THREE.Group();
  root.name = 'SuomiNPP_JPSS_VIIRS_Spacecraft';

  // PBR Materials
  const busWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2, // Optical solar reflector (OSR) white quartz tiles
    metalness: 0.40,
    roughness: 0.35,
  });

  const graphiteMat = new THREE.MeshStandardMaterial({
    color: 0x22242a,
    metalness: 0.85,
    roughness: 0.45,
  });

  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xdfab2a,
    metalness: 0.94,
    roughness: 0.20,
  });

  const solarCellMat = new THREE.MeshStandardMaterial({
    map: getSolarCellTexture(),
    color: 0xfde68a,
    metalness: 0.90,
    roughness: 0.15,
    emissive: 0x1f1604,
    emissiveIntensity: 0.5,
  });

  const opticsMat = new THREE.MeshPhysicalMaterial({
    color: 0x050a12,
    metalness: 0.98,
    roughness: 0.04,
    reflectivity: 0.95,
    clearcoat: 1.0,
  });

  // 1. Modern Hexagonal Spacecraft Central Bus
  const busGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.38, 6);
  const busMesh = new THREE.Mesh(busGeo, busWhiteMat);
  busMesh.rotation.x = Math.PI / 2;
  root.add(busMesh);

  // 2. High-Efficiency Starboard Solar Wing Array (Articulated 4-panel assembly)
  const solarBoomGeo = new THREE.CylinderGeometry(0.010, 0.010, 0.18, 12);
  const solarBoom = new THREE.Mesh(solarBoomGeo, graphiteMat);
  solarBoom.rotation.z = Math.PI / 2;
  solarBoom.position.set(0.18, 0, 0);
  root.add(solarBoom);

  const solarWingGroup = new THREE.Group();
  solarWingGroup.position.set(0.48, 0, 0);

  const panelGeo = new THREE.BoxGeometry(0.46, 0.01, 0.50);
  const panelMesh = new THREE.Mesh(panelGeo, solarCellMat);
  solarWingGroup.add(panelMesh);

  const frameGeo = new THREE.BoxGeometry(0.47, 0.014, 0.51);
  const frameMesh = new THREE.Mesh(frameGeo, graphiteMat);
  frameMesh.scale.set(0.99, 0.85, 0.99);
  solarWingGroup.add(frameMesh);

  root.add(solarWingGroup);

  // 3. VIIRS Rotating Telescope Assembly (RTA) Cylindrical Housing (Gold Blanket)
  const rtaGroup = new THREE.Group();
  rtaGroup.position.set(-0.03, -0.13, 0.08);

  const rtaGeo = new THREE.CylinderGeometry(0.060, 0.060, 0.14, 20);
  const rtaMesh = new THREE.Mesh(rtaGeo, goldMat);
  rtaMesh.rotation.z = Math.PI / 2;
  rtaGroup.add(rtaMesh);

  // VIIRS Nadir Optical Baffle Hood (Pointing at Earth, -Y)
  const baffleGeo = new THREE.ConeGeometry(0.052, 0.07, 20, 1, true);
  const baffleMesh = new THREE.Mesh(baffleGeo, opticsMat);
  baffleMesh.position.set(0, -0.06, 0);
  baffleMesh.rotation.x = Math.PI;
  rtaGroup.add(baffleMesh);

  root.add(rtaGroup);

  // 4. Secondary Sensor Pods (CrIS Infrared Sounder & ATMS Microwave Scanner)
  const crisGeo = new THREE.BoxGeometry(0.08, 0.07, 0.11);
  const crisMesh = new THREE.Mesh(crisGeo, graphiteMat);
  crisMesh.position.set(0.05, 0.11, -0.06);
  root.add(crisMesh);

  const atmsGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.08, 16);
  const atmsMesh = new THREE.Mesh(atmsGeo, busWhiteMat);
  atmsMesh.position.set(-0.06, 0.10, -0.08);
  root.add(atmsMesh);

  // 5. Sensor Identification Beacon Ring (Glowing amber/orange)
  const beaconGeo = new THREE.RingGeometry(0.055, 0.070, 24);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    side: THREE.DoubleSide,
  });
  const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
  beaconMesh.rotation.x = Math.PI / 2;
  beaconMesh.position.set(-0.03, -0.21, 0.08);
  root.add(beaconMesh);

  // 6. Pulsing Amber Telemetry Strobe Light
  const strobeGeo = new THREE.SphereGeometry(0.016, 12, 8);
  const strobeMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
  });
  const strobeMesh = new THREE.Mesh(strobeGeo, strobeMat);
  strobeMesh.position.set(-0.11, 0.13, 0.18);
  root.add(strobeMesh);

  // 7. Large Invisible Hit-Sphere for smooth mouse detection and raycasting
  const hitGeo = new THREE.SphereGeometry(0.50, 16, 12);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.name = 'hitSphere';
  root.add(hitMesh);

  root.scale.setScalar(0.85);
  return root;
}

/**
 * Creates a crisp 3D sprite billboard hovering above the satellite in orbit
 */
export function createSatelliteBillboardLabel(
  name: string,
  sensor: string,
  colorHex: string
): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 140;
  const ctx = canvas.getContext('2d')!;

  // Translucent glass HUD pill
  ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
  ctx.beginPath();
  ctx.roundRect(16, 20, 480, 100, 28);
  ctx.fill();

  // Vibrant accent border
  ctx.strokeStyle = colorHex;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Satellite Name
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(name, 44, 84);

  // Sensor Pill
  ctx.fillStyle = colorHex;
  ctx.beginPath();
  ctx.roundRect(310, 42, 160, 56, 16);
  ctx.fill();

  ctx.font = 'bold 30px monospace';
  ctx.fillStyle = '#0a0f1d';
  ctx.textAlign = 'center';
  ctx.fillText(sensor, 390, 82);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.70, 0.19, 1.0);
  sprite.position.set(0, 0.42, 0);
  return sprite;
}

/**
 * Creates an animated holographic targeting reticle / halo that pulses around selected/hovered spacecraft
 */
export function createTargetingReticle(colorHex: string): THREE.Group {
  const group = new THREE.Group();
  group.name = 'TargetingReticle';

  // Inner smooth ring
  const ringGeo = new THREE.RingGeometry(0.28, 0.31, 36);
  const ringMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(colorHex),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.75,
    depthTest: false,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  group.add(ringMesh);

  // Outer dashed bracket indicators
  const bracketGeo = new THREE.PlaneGeometry(0.05, 0.10);
  const bracketMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#ffffff'),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.90,
    depthTest: false,
  });

  const positions = [
    { x: 0, y: 0.36, r: 0 },
    { x: 0, y: -0.36, r: 0 },
    { x: -0.36, y: 0, r: Math.PI / 2 },
    { x: 0.36, y: 0, r: Math.PI / 2 },
  ];

  for (const pos of positions) {
    const bracket = new THREE.Mesh(bracketGeo, bracketMat);
    bracket.position.set(pos.x, pos.y, 0);
    bracket.rotation.z = pos.r;
    group.add(bracket);
  }

  group.visible = false;
  return group;
}
