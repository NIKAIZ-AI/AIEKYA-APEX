import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createProceduralEarthTextures } from '../utils/proceduralEarth';
import {
  SATELLITES,
  SatelliteConfig,
  getSatelliteState,
  generateOrbitPathPoints,
} from '../utils/orbital';
import {
  createTerraAquaMODISModel,
  createVIIRSSpacecraftModel,
  createSatelliteBillboardLabel,
  createTargetingReticle,
} from '../utils/satelliteModels';
import { FireDecade, createDecadeFireHeatmapTexture } from '../utils/decadeFireHeatmap';

interface GlobeViewportProps {
  simulationSpeed: number; // 1x to 120x
  isPaused: boolean;
  selectedSatId: string;
  onSelectSatellite: (sat: SatelliteConfig) => void;
  showModisSwath: boolean;
  showViirsSwath: boolean;
  showOrbits: boolean;
  showGraticule: boolean;
  cameraPreset: 'global' | 'terra' | 'snpp' | 'polar' | 'overlap' | 'region';
  targetRegionCoords?: { lat: number; lon: number; name: string } | null;
  fireDecade?: FireDecade;
  showFireHeatmap?: boolean;
  isAutoRotateEnabled?: boolean;
  globeTheme?: 'space' | 'beige';
}

export const GlobeViewport: React.FC<GlobeViewportProps> = ({
  simulationSpeed,
  isPaused,
  selectedSatId,
  onSelectSatellite,
  showModisSwath,
  showViirsSwath,
  showOrbits,
  showGraticule = true,
  cameraPreset,
  targetRegionCoords,
  fireDecade = '2020s',
  showFireHeatmap = true,
  isAutoRotateEnabled = true,
  globeTheme = 'space',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoverTooltip, setHoverTooltip] = useState<{ sat: SatelliteConfig; x: number; y: number } | null>(null);

  // Store mutable state in ref to avoid re-initializing the WebGL canvas
  const stateRef = useRef({
    simulationSpeed,
    isPaused,
    selectedSatId,
    showModisSwath,
    showViirsSwath,
    showOrbits,
    showGraticule,
    cameraPreset,
    targetRegionCoords,
    fireDecade,
    showFireHeatmap,
    isAutoRotateEnabled,
    globeTheme,
    elapsedSimSeconds: 1400,
    onSelectSatellite,
    updateFireTexture: null as ((decade: FireDecade) => void) | null,
    updateTheme: null as ((theme: 'space' | 'beige') => void) | null,
    triggerPreset: null as ((preset: string) => void) | null,
    hoveredSatId: null as string | null,
  });

  useEffect(() => {
    stateRef.current.simulationSpeed = simulationSpeed;
    stateRef.current.isPaused = isPaused;
    stateRef.current.selectedSatId = selectedSatId;
    stateRef.current.showModisSwath = showModisSwath;
    stateRef.current.showViirsSwath = showViirsSwath;
    stateRef.current.showOrbits = showOrbits;
    stateRef.current.showGraticule = showGraticule;
    stateRef.current.targetRegionCoords = targetRegionCoords;
    stateRef.current.showFireHeatmap = showFireHeatmap;
    stateRef.current.isAutoRotateEnabled = isAutoRotateEnabled;
    stateRef.current.onSelectSatellite = onSelectSatellite;

    if (stateRef.current.cameraPreset !== cameraPreset) {
      stateRef.current.cameraPreset = cameraPreset;
      if (stateRef.current.triggerPreset) {
        stateRef.current.triggerPreset(cameraPreset);
      }
    }

    if (stateRef.current.globeTheme !== globeTheme) {
      stateRef.current.globeTheme = globeTheme;
      if (stateRef.current.updateTheme) {
        stateRef.current.updateTheme(globeTheme);
      }
    }

    if (stateRef.current.fireDecade !== fireDecade) {
      stateRef.current.fireDecade = fireDecade;
      if (stateRef.current.updateFireTexture) {
        stateRef.current.updateFireTexture(fireDecade);
      }
    }
  }, [
    simulationSpeed,
    isPaused,
    selectedSatId,
    showModisSwath,
    showViirsSwath,
    showOrbits,
    showGraticule,
    cameraPreset,
    targetRegionCoords,
    fireDecade,
    showFireHeatmap,
    isAutoRotateEnabled,
    globeTheme,
    onSelectSatellite,
  ]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL as per guidelines
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // Scene & Background: default to Space Black matching user's video
    const isInitialSpace = stateRef.current.globeTheme === 'space';
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isInitialSpace ? 0x010409 : 0xf5efe6);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.4, 5.6);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isInitialSpace ? 1.35 : 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.domElement.style.cursor = 'grab';
    container.appendChild(renderer.domElement);

    // Orbit Controls: natural, inertia-damped 360-degree rotation matching video interaction
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.20;
    controls.maxDistance = 12.0;
    controls.rotateSpeed = 0.85;
    controls.enableZoom = true;
    controls.zoomSpeed = 0.9;
    controls.autoRotate = stateRef.current.isAutoRotateEnabled;
    controls.autoRotateSpeed = 0.55;

    // Camera animation state
    let isAnimatingCamera = false;
    let cameraTrackingSat: SatelliteConfig | null = null;
    const targetCamPos = new THREE.Vector3().copy(camera.position);
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    // When user drags manually, yield camera animation immediately
    controls.addEventListener('start', () => {
      isAnimatingCamera = false;
      cameraTrackingSat = null;
      renderer.domElement.style.cursor = 'grabbing';
    });

    controls.addEventListener('end', () => {
      renderer.domElement.style.cursor = stateRef.current.hoveredSatId ? 'pointer' : 'grab';
    });

    stateRef.current.triggerPreset = (preset: string) => {
      isAnimatingCamera = true;
      cameraTrackingSat = null;

      if (preset === 'global') {
        targetCamPos.set(0, 1.4, 5.6);
        targetLookAt.set(0, 0, 0);
      } else if (preset === 'polar') {
        targetCamPos.set(0, 5.6, 0.3);
        targetLookAt.set(0, 0, 0);
      } else if (preset === 'region' && stateRef.current.targetRegionCoords) {
        const coords = stateRef.current.targetRegionCoords;
        const phi = (90 - coords.lat) * (Math.PI / 180);
        const theta = (coords.lon + 180) * (Math.PI / 180);
        const rx = -2.0 * Math.sin(phi) * Math.cos(theta);
        const ry = 2.0 * Math.cos(phi);
        const rz = 2.0 * Math.sin(phi) * Math.sin(theta);
        const lookPt = new THREE.Vector3(rx, ry, rz);
        targetLookAt.copy(lookPt);
        targetCamPos.copy(lookPt.clone().normalize().multiplyScalar(4.6));
      } else if (preset === 'terra') {
        const terra = SATELLITES.find((s) => s.id === 'terra');
        if (terra) {
          cameraTrackingSat = terra;
        } else {
          targetCamPos.set(-2.5, 1.8, 3.8);
          targetLookAt.set(0, 0, 0);
        }
      } else if (preset === 'snpp') {
        const snpp = SATELLITES.find((s) => s.id === 'snpp');
        if (snpp) {
          cameraTrackingSat = snpp;
        } else {
          targetCamPos.set(2.8, 1.4, 4.0);
          targetLookAt.set(0, 0, 0);
        }
      }
    };

    // Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 1. Directional Sunlight illuminating daytime hemisphere
    const sunLight = new THREE.DirectionalLight(0xfff8ee, isInitialSpace ? 2.9 : 2.4);
    sunLight.position.set(8.5, 4.2, 6.5);
    scene.add(sunLight);

    // 2. Ambient Fill Light
    const ambientLight = new THREE.AmbientLight(
      isInitialSpace ? 0x111c30 : 0xf5eee6,
      isInitialSpace ? 0.38 : 0.90
    );
    scene.add(ambientLight);

    // 3. Royal Blue Rim Backlight for limb illumination
    const rimLight = new THREE.DirectionalLight(0x2563eb, isInitialSpace ? 1.2 : 0.85);
    rimLight.position.set(-7, -2.5, -6);
    scene.add(rimLight);

    // Starfield Points in deep space
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      const r = 22 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      starPositions[idx] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[idx + 2] = r * Math.cos(phi);

      if (i % 3 === 0) {
        starColors[idx] = 0.55;
        starColors[idx + 1] = 0.75;
        starColors[idx + 2] = 1.0; // Royal Blue
      } else if (i % 3 === 1) {
        starColors[idx] = 0.98;
        starColors[idx + 1] = 0.95;
        starColors[idx + 2] = 0.88; // Warm star
      } else {
        starColors[idx] = 0.35;
        starColors[idx + 1] = 0.95;
        starColors[idx + 2] = 0.75; // Emerald tint
      }
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.14,
      vertexColors: true,
      transparent: true,
      opacity: isInitialSpace ? 0.80 : 0.25,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Fallback Procedural Textures
    const { colorTexture, specularTexture, bumpTexture, cloudsTexture } = createProceduralEarthTextures();

    // 1. PHOTOREALISTIC EARTH SPHERE (Radius 2.0)
    const earthRadius = 2.0;
    const earthGeo = new THREE.SphereGeometry(earthRadius, 64, 48);
    const earthMat = new THREE.MeshStandardMaterial({
      map: colorTexture, // Fallback procedural albedo while 4K NASA texture loads
      roughness: 0.85,
      metalness: 0.12,
      roughnessMap: specularTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.045, // Mountain elevation
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earthMesh);

    // Texture Loader for genuine 4K NASA Blue Marble, Topology, Specular Water, and Clouds
    const textureLoader = new THREE.TextureLoader();

    // A. 4K NASA Blue Marble satellite map with bathymetry & ice sheets
    textureLoader.load(
      '/earth_satellite_map.jpg',
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.generateMipmaps = true;
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        earthMat.map = tex;
        earthMat.needsUpdate = true;
      },
      undefined,
      (err) => console.warn('Satellite texture load fallback:', err)
    );

    // B. Elevation Bump Map (Rockies, Andes, Himalayas, Alps)
    textureLoader.load(
      '/earth_topology.png',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        earthMat.bumpMap = tex;
        earthMat.bumpScale = 0.050;
        earthMat.needsUpdate = true;
      }
    );

    // C. Water Specular Roughness Map (Oceans reflect sunlight glint, land is matte)
    textureLoader.load(
      '/earth_water.png',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        earthMat.roughnessMap = tex;
        earthMat.roughness = 0.82;
        earthMat.metalness = 0.16;
        earthMat.needsUpdate = true;
      }
    );

    // 2. DUAL-MESH SMOOTH OPACITY CROSSFADE FIRE HEATMAPS
    const fireHeatmapGeo = new THREE.SphereGeometry(earthRadius + 0.012, 64, 48);
    const fireTextureA = createDecadeFireHeatmapTexture(stateRef.current.fireDecade);
    const fireMatA = new THREE.MeshBasicMaterial({
      map: fireTextureA,
      transparent: true,
      opacity: stateRef.current.showFireHeatmap ? 0.95 : 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const fireMeshA = new THREE.Mesh(fireHeatmapGeo, fireMatA);
    scene.add(fireMeshA);

    const fireMatB = new THREE.MeshBasicMaterial({
      map: fireTextureA.clone(),
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const fireMeshB = new THREE.Mesh(fireHeatmapGeo, fireMatB);
    scene.add(fireMeshB);

    let masterFireOpacity = stateRef.current.showFireHeatmap ? 0.95 : 0.0;
    let transitionProgress = 1.0;

    stateRef.current.updateFireTexture = (decade: FireDecade) => {
      if (fireMatB.map) {
        fireMatB.map.dispose();
      }
      fireMatB.map = fireMatA.map;
      fireMatB.opacity = fireMatA.opacity;
      fireMatB.needsUpdate = true;

      const nextTexture = createDecadeFireHeatmapTexture(decade);
      fireMatA.map = nextTexture;
      fireMatA.opacity = 0.0;
      fireMatA.needsUpdate = true;
      transitionProgress = 0.0;
    };

    // 3. Realistic Dynamic Cloud Layer (Drifting slightly over Earth)
    const cloudsGeo = new THREE.SphereGeometry(earthRadius + 0.022, 64, 48);
    const cloudsMat = new THREE.MeshStandardMaterial({
      map: cloudsTexture,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    scene.add(cloudsMesh);

    textureLoader.load(
      '/earth_clouds.png',
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        cloudsMat.map = tex;
        cloudsMat.opacity = 0.40;
        cloudsMat.needsUpdate = true;
      }
    );

    // 4. Atmospheric Rayleigh Scattering Halo (Royal Blue Glow on limb)
    const atmosphereGeo = new THREE.SphereGeometry(earthRadius + 0.075, 48, 36);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: isInitialSpace ? 0.32 : 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    scene.add(atmosphereMesh);

    // Dynamic Theme Update
    stateRef.current.updateTheme = (theme: 'space' | 'beige') => {
      const isSpace = theme === 'space';
      scene.background = new THREE.Color(isSpace ? 0x010409 : 0xf5efe6);
      renderer.toneMappingExposure = isSpace ? 1.35 : 1.15;
      sunLight.intensity = isSpace ? 2.9 : 2.4;
      ambientLight.color.setHex(isSpace ? 0x111c30 : 0xf5eee6);
      ambientLight.intensity = isSpace ? 0.38 : 0.90;
      rimLight.intensity = isSpace ? 1.2 : 0.85;
      starMat.opacity = isSpace ? 0.80 : 0.25;
      atmosphereMat.opacity = isSpace ? 0.32 : 0.12;
      atmosphereMat.needsUpdate = true;
    };

    // Coordinate Graticule Grid
    const graticuleGroup = new THREE.Group();
    const graticuleMat = new THREE.LineBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.12,
    });
    for (const lat of [-60, -30, 0, 30, 60]) {
      const latRad = (lat * Math.PI) / 180;
      const r = (earthRadius + 0.005) * Math.cos(latRad);
      const y = (earthRadius + 0.005) * Math.sin(latRad);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const theta = (i / 64) * Math.PI * 2;
        pts.push(new THREE.Vector3(r * Math.cos(theta), y, r * Math.sin(theta)));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      graticuleGroup.add(new THREE.Line(lineGeo, graticuleMat));
    }
    for (let lon = 0; lon < 360; lon += 30) {
      const lonRad = (lon * Math.PI) / 180;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const phi = (i / 64) * Math.PI;
        const x = (earthRadius + 0.005) * Math.sin(phi) * Math.cos(lonRad);
        const y = (earthRadius + 0.005) * Math.cos(phi);
        const z = (earthRadius + 0.005) * Math.sin(phi) * Math.sin(lonRad);
        pts.push(new THREE.Vector3(x, y, z));
      }
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      graticuleGroup.add(new THREE.Line(lineGeo, graticuleMat));
    }
    scene.add(graticuleGroup);

    // Satellites & Sensor Swaths
    interface SatEntry {
      config: SatelliteConfig;
      model: THREE.Group;
      label: THREE.Sprite;
      reticle: THREE.Group;
      orbitLine: THREE.Line;
      swathCone: THREE.LineSegments;
      swathRibbon: THREE.Mesh;
    }
    const satEntries: SatEntry[] = [];
    const orbitGroup = new THREE.Group();
    scene.add(orbitGroup);
    const swathGroup = new THREE.Group();
    scene.add(swathGroup);

    for (const sat of SATELLITES) {
      const orbitPoints = generateOrbitPathPoints(sat, earthRadius, 140);
      const orbitPositions = new Float32Array(orbitPoints.length * 3);
      for (let i = 0; i < orbitPoints.length; i++) {
        orbitPositions[i * 3] = orbitPoints[i][0];
        orbitPositions[i * 3 + 1] = orbitPoints[i][1];
        orbitPositions[i * 3 + 2] = orbitPoints[i][2];
      }
      const orbitGeo = new THREE.BufferGeometry();
      orbitGeo.setAttribute('position', new THREE.BufferAttribute(orbitPositions, 3));
      const orbitMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(sat.colorHex),
        transparent: true,
        opacity: 0.38,
      });
      const orbitLine = new THREE.Line(orbitGeo, orbitMat);
      orbitGroup.add(orbitLine);

      // Create Realistic Spacecraft 3D Model
      const model =
        sat.sensor === 'MODIS'
          ? createTerraAquaMODISModel(sat.colorHex)
          : createVIIRSSpacecraftModel(sat.colorHex);

      // Add 3D Billboard Label and Holographic Targeting Reticle
      const label = createSatelliteBillboardLabel(sat.name, sat.sensor, sat.colorHex);
      model.add(label);

      const reticle = createTargetingReticle(sat.colorHex);
      model.add(reticle);

      scene.add(model);

      // Optical Swath Cones & Ribbons
      const coneGeo = new THREE.BufferGeometry();
      const conePos = new Float32Array(18);
      coneGeo.setAttribute('position', new THREE.BufferAttribute(conePos, 3));
      const coneMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(sat.colorHex),
        transparent: true,
        opacity: 0.45,
      });
      const swathCone = new THREE.LineSegments(coneGeo, coneMat);
      swathGroup.add(swathCone);

      const ribbonGeo = new THREE.BufferGeometry();
      const ribbonPos = new Float32Array(36 * 3);
      ribbonGeo.setAttribute('position', new THREE.BufferAttribute(ribbonPos, 3));
      const ribbonMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(sat.colorHex),
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const swathRibbon = new THREE.Mesh(ribbonGeo, ribbonMat);
      swathGroup.add(swathRibbon);

      satEntries.push({ config: sat, model, label, reticle, orbitLine, swathCone, swathRibbon });
    }

    // Raycasting for interactive satellite selection and hover detection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isPointerDragging = false;

    const getRaycastHit = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      for (const entry of satEntries) {
        const hits = raycaster.intersectObjects(entry.model.children, true);
        if (hits.length > 0) {
          return entry;
        }
      }
      return null;
    };

    const onPointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const hit = getRaycastHit(event);

      if (hit) {
        stateRef.current.hoveredSatId = hit.config.id;
        renderer.domElement.style.cursor = 'pointer';
        setHoverTooltip({
          sat: hit.config,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      } else {
        stateRef.current.hoveredSatId = null;
        if (!isPointerDragging) {
          renderer.domElement.style.cursor = 'grab';
        }
        setHoverTooltip(null);
      }
    };

    const onPointerDown = (event: MouseEvent) => {
      isPointerDragging = true;
      renderer.domElement.style.cursor = 'grabbing';

      const hit = getRaycastHit(event);
      if (hit) {
        stateRef.current.onSelectSatellite(hit.config);
      }
    };

    const onPointerUp = () => {
      isPointerDragging = false;
      renderer.domElement.style.cursor = stateRef.current.hoveredSatId ? 'pointer' : 'grab';
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    let lastTime = performance.now();
    let frameId = 0;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      const now = performance.now();
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;

      const state = stateRef.current;

      if (!state.isPaused) {
        state.elapsedSimSeconds += deltaSec * state.simulationSpeed * 4;
      }

      // Gentle realistic cloud drift relative to Earth surface
      cloudsMesh.rotation.y += deltaSec * 0.012;

      // Smooth Master Opacity Damping for Fire Heatmap
      const targetMaster = state.showFireHeatmap ? 0.95 : 0.0;
      masterFireOpacity = THREE.MathUtils.damp(masterFireOpacity, targetMaster, 6.0, deltaSec);

      // Smooth Decade Crossfade Transition
      if (transitionProgress < 1.0) {
        transitionProgress = Math.min(1.0, transitionProgress + deltaSec * 2.2);
      }
      const t = transitionProgress * transitionProgress * (3 - 2 * transitionProgress);

      fireMatA.opacity = masterFireOpacity * t;
      fireMatB.opacity = masterFireOpacity * (1.0 - t);
      fireMeshA.visible = fireMatA.opacity > 0.005;
      fireMeshB.visible = fireMatB.opacity > 0.005;

      graticuleGroup.visible = state.showGraticule;
      orbitGroup.visible = state.showOrbits;

      // Update Satellites, Solar Arrays, Reticles & Swaths
      for (const entry of satEntries) {
        const satState = getSatelliteState(entry.config, state.elapsedSimSeconds, earthRadius);
        entry.model.position.set(satState.position3D.x, satState.position3D.y, satState.position3D.z);
        entry.model.lookAt(0, 0, 0);

        // Keep 3D billboard labels facing camera
        entry.label.quaternion.copy(camera.quaternion);

        // Holographic reticle pulse animation on hover or selection
        const isHovered = state.hoveredSatId === entry.config.id;
        const isSelected = state.selectedSatId === entry.config.id;
        entry.reticle.visible = isHovered || isSelected;
        if (entry.reticle.visible) {
          const pulse = 1.0 + Math.sin(now * 0.008) * 0.15;
          entry.reticle.scale.set(pulse, pulse, pulse);
          entry.reticle.lookAt(camera.position);
        }

        const isModis = entry.config.sensor === 'MODIS';
        const isViirs = entry.config.sensor === 'VIIRS';
        const isSwathActive =
          (isModis && state.showModisSwath) || (isViirs && state.showViirsSwath);

        entry.swathCone.visible = isSwathActive;
        entry.swathRibbon.visible = isSwathActive;

        if (isSwathActive) {
          const coneAttr = entry.swathCone.geometry.attributes.position as THREE.BufferAttribute;
          const pos = coneAttr.array as Float32Array;
          pos[0] = satState.position3D.x;
          pos[1] = satState.position3D.y;
          pos[2] = satState.position3D.z;
          pos[3] = satState.subSat3D.x;
          pos[4] = satState.subSat3D.y;
          pos[5] = satState.subSat3D.z;

          pos[6] = satState.position3D.x;
          pos[7] = satState.position3D.y;
          pos[8] = satState.position3D.z;
          pos[9] = satState.swathLeft3D.x;
          pos[10] = satState.swathLeft3D.y;
          pos[11] = satState.swathLeft3D.z;

          pos[12] = satState.position3D.x;
          pos[13] = satState.position3D.y;
          pos[14] = satState.position3D.z;
          pos[15] = satState.swathRight3D.x;
          pos[16] = satState.swathRight3D.y;
          pos[17] = satState.swathRight3D.z;
          coneAttr.needsUpdate = true;
        }
      }

      // Smooth Camera Tracking or Preset Transition
      if (cameraTrackingSat) {
        const satState = getSatelliteState(cameraTrackingSat, state.elapsedSimSeconds, earthRadius);
        const satPos = new THREE.Vector3(satState.position3D.x, satState.position3D.y, satState.position3D.z);
        const offset = satPos.clone().normalize().multiplyScalar(1.2);
        const chasePos = satPos.clone().add(offset).add(new THREE.Vector3(0, 0.4, 0));
        camera.position.lerp(chasePos, 0.08);
        controls.target.lerp(satPos, 0.1);
      } else if (isAnimatingCamera) {
        camera.position.lerp(targetCamPos, 0.08);
        controls.target.lerp(targetLookAt, 0.08);
        if (camera.position.distanceTo(targetCamPos) < 0.04) {
          isAnimatingCamera = false;
        }
      }

      // OrbitControls update handles mouse drag, auto-rotation, and inertia damping
      controls.autoRotate = state.isAutoRotateEnabled && !cameraTrackingSat;
      controls.update();

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="threejs-globe-viewport"
      className="w-full h-full relative cursor-grab active:cursor-grabbing overflow-hidden select-none"
    >
      {/* Interactive Satellite Hover Tooltip */}
      {hoverTooltip && (
        <div
          style={{
            left: Math.min(window.innerWidth - 300, Math.max(16, hoverTooltip.x + 18)),
            top: Math.max(16, hoverTooltip.y - 48),
          }}
          className="pointer-events-none absolute z-40 px-3 py-2 rounded-xl bg-slate-900/95 border border-cyan-400/60 shadow-[0_8px_24px_rgba(0,0,0,0.6)] backdrop-blur-md text-white text-xs font-mono animate-in fade-in zoom-in-95 flex items-center gap-2.5"
        >
          <span
            className="w-2.5 h-2.5 rounded-full animate-ping shrink-0"
            style={{ backgroundColor: hoverTooltip.sat.colorHex }}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-wide font-sans">{hoverTooltip.sat.name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {hoverTooltip.sat.sensor}
              </span>
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5">
              {hoverTooltip.sat.altitudeKm} km LEO · Click to Inspect Mission &amp; Thermal Channels
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
