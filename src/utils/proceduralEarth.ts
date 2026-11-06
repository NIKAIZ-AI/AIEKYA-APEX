import * as THREE from 'three';

/**
 * Procedural Earth Texture Generator with Royal Blue, Beige, and Emerald Green Palette
 * - Oceans: Royal Blue multi-stop gradient with specular glint
 * - Landmasses: Rich Emerald Green biomes & Warm Beige/Sand deserts
 * - Atmosphere: Royal Blue & Neon Cyan Rayleigh scattering halo
 */

export function createProceduralEarthTextures(): {
  colorTexture: THREE.CanvasTexture;
  specularTexture: THREE.CanvasTexture;
  bumpTexture: THREE.CanvasTexture;
  cloudsTexture: THREE.CanvasTexture;
} {
  const width = 2048;
  const height = 1024;

  // 1. Earth Surface Albedo Canvas
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d')!;

  // Deep Royal Blue Ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0.0, '#0a1936'); // Polar deep
  oceanGrad.addColorStop(0.2, '#173b75'); // High latitude royal blue
  oceanGrad.addColorStop(0.5, '#1e40af'); // Equatorial vibrant royal blue
  oceanGrad.addColorStop(0.8, '#173b75');
  oceanGrad.addColorStop(1.0, '#0a1936');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Sub-surface oceanic shelf glow (lighter royal-cyan blue near coastlines)
  ctx.fillStyle = 'rgba(30, 64, 175, 0.5)';
  ctx.fillRect(0, 0, width, height);

  function toCanvas(lonDeg: number, latDeg: number): [number, number] {
    const x = ((lonDeg + 180) / 360) * width;
    const y = ((90 - latDeg) / 180) * height;
    return [x, y];
  }

  function drawLandmass(points: Array<[number, number]>, fill: string, stroke = '#1d3b25') {
    ctx.beginPath();
    const [startX, startY] = toCanvas(points[0][0], points[0][1]);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < points.length; i++) {
      const [px, py] = toCanvas(points[i][0], points[i][1]);
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  // Emerald Green for vegetation & forests
  const emeraldGreen = '#059669'; // Rich emerald green
  const deepEmerald = '#047857';   // Dense tropical forest
  const warmBeige = '#d4c5a9';     // Warm desert sand / beige

  // North America
  drawLandmass([
    [-168, 65], [-160, 71], [-130, 70], [-95, 74], [-75, 62], [-60, 48],
    [-70, 42], [-80, 32], [-81, 25], [-97, 26], [-105, 20], [-90, 16],
    [-77, 8], [-85, 10], [-95, 16], [-105, 23], [-117, 32], [-124, 40],
    [-125, 50], [-135, 58], [-165, 60]
  ], emeraldGreen, '#064e3b');

  // South America (Emerald Green Amazon)
  drawLandmass([
    [-77, 8], [-60, 8], [-50, 0], [-35, -5], [-35, -12], [-40, -22],
    [-52, -32], [-65, -42], [-68, -55], [-75, -50], [-72, -35], [-80, -5],
    [-77, 8]
  ], deepEmerald, '#022c22');

  // Eurasia (Emerald Green & Boreal forests)
  drawLandmass([
    [-9, 36], [0, 42], [-5, 48], [5, 52], [5, 58], [15, 60], [28, 70],
    [50, 70], [80, 74], [110, 75], [140, 72], [170, 68], [180, 65],
    [170, 60], [140, 50], [130, 42], [122, 32], [110, 20], [105, 10],
    [100, 5], [92, 15], [80, 10], [70, 22], [55, 25], [50, 13],
    [43, 12], [35, 30], [28, 41], [15, 40], [0, 38], [-9, 36]
  ], emeraldGreen, '#064e3b');

  // Africa (Emerald Green Congo Basin + Warm Beige Sahara)
  drawLandmass([
    [-17, 15], [-17, 28], [-5, 36], [10, 37], [25, 32], [32, 31],
    [43, 12], [51, 12], [42, -5], [35, -25], [20, -35], [17, -33],
    [12, -18], [9, 4], [0, 6], [-10, 5], [-17, 15]
  ], '#059669', '#064e3b');

  // Sahara Desert in Warm Beige
  ctx.fillStyle = warmBeige;
  ctx.beginPath();
  const [saharaX, saharaY] = toCanvas(16, 23);
  ctx.ellipse(saharaX, saharaY, width * 0.085, height * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // Arabian Peninsula in Warm Beige
  ctx.fillStyle = warmBeige;
  ctx.beginPath();
  const [arabiaX, arabiaY] = toCanvas(45, 24);
  ctx.ellipse(arabiaX, arabiaY, width * 0.035, height * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();

  // Australia (Warm Beige outback with Emerald Green coastal fringe)
  drawLandmass([
    [114, -22], [125, -15], [137, -12], [142, -11], [150, -23], [153, -28],
    [150, -37], [138, -35], [130, -32], [115, -34], [113, -25], [114, -22]
  ], warmBeige, '#b49f82');

  // Amazon dense emerald rainforest canopy
  ctx.fillStyle = '#022c22';
  ctx.beginPath();
  const [amzX, amzY] = toCanvas(-62, -5);
  ctx.ellipse(amzX, amzY, width * 0.045, height * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();

  // Antarctica & Greenland
  ctx.fillStyle = '#f1f5f9';
  ctx.beginPath();
  ctx.rect(0, height * 0.88, width, height * 0.12);
  ctx.fill();

  drawLandmass([
    [-55, 60], [-40, 60], [-25, 70], [-20, 80], [-45, 83], [-55, 75]
  ], '#f1f5f9', '#cbd5e1');

  // Subtle Beige & Royal Blue Graticule Grid lines
  ctx.strokeStyle = 'rgba(212, 197, 169, 0.14)'; // Soft beige graticule
  ctx.lineWidth = 1;
  // Equator
  ctx.beginPath();
  ctx.moveTo(0, height * 0.5);
  ctx.lineTo(width, height * 0.5);
  ctx.stroke();

  // Tropics
  const tropicY1 = ((90 - 23.44) / 180) * height;
  const tropicY2 = ((90 + 23.44) / 180) * height;
  ctx.beginPath();
  ctx.moveTo(0, tropicY1);
  ctx.lineTo(width, tropicY1);
  ctx.moveTo(0, tropicY2);
  ctx.lineTo(width, tropicY2);
  ctx.stroke();

  // 2. Specular Texture (Royal blue oceans reflect intensely, landmasses are rough)
  const specCanvas = document.createElement('canvas');
  specCanvas.width = 1024;
  specCanvas.height = 512;
  const sCtx = specCanvas.getContext('2d')!;
  sCtx.fillStyle = '#ffffff'; // Ocean high specular
  sCtx.fillRect(0, 0, 1024, 512);

  // Draw land as matte dark
  sCtx.drawImage(colorCanvas, 0, 0, 1024, 512);
  const sData = sCtx.getImageData(0, 0, 1024, 512);
  for (let i = 0; i < sData.data.length; i += 4) {
    const isOcean = sData.data[i + 2] > 90 && sData.data[i] < 50;
    if (isOcean) {
      sData.data[i] = 245;
      sData.data[i + 1] = 245;
      sData.data[i + 2] = 245;
    } else {
      sData.data[i] = 20;
      sData.data[i + 1] = 20;
      sData.data[i + 2] = 20;
    }
  }
  sCtx.putImageData(sData, 0, 0);

  // 3. Clouds Texture (Soft, atmospheric, organic swirls)
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = 1024;
  cloudCanvas.height = 512;
  const cCtx = cloudCanvas.getContext('2d')!;
  cCtx.fillStyle = '#000000';
  cCtx.fillRect(0, 0, 1024, 512);

  for (let x = 0; x < 1024; x += 16) {
    const yOff = Math.sin(x * 0.015) * 18;
    const grad = cCtx.createRadialGradient(x, 256 + yOff, 2, x, 256 + yOff, 26);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.42)');
    grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.16)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    cCtx.fillStyle = grad;
    cCtx.beginPath();
    cCtx.arc(x, 256 + yOff, 26, 0, Math.PI * 2);
    cCtx.fill();
  }

  const stormCenters = [
    [240, 140], [620, 130], [840, 150], [320, 370], [690, 380]
  ];
  for (const [cx, cy] of stormCenters) {
    for (let r = 8; r < 75; r += 12) {
      const angle = r * 0.18;
      const sx = cx + Math.cos(angle) * r;
      const sy = cy + Math.sin(angle) * r;
      const grad = cCtx.createRadialGradient(sx, sy, 2, sx, sy, 20);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.10)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      cCtx.fillStyle = grad;
      cCtx.beginPath();
      cCtx.arc(sx, sy, 20, 0, Math.PI * 2);
      cCtx.fill();
    }
  }

  // 4. Bump / Height Texture for tactile 3D mountain & terrain relief
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 1024;
  bumpCanvas.height = 512;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#000000'; // Oceans at elevation 0
  bCtx.fillRect(0, 0, 1024, 512);

  // Transfer land contours at base elevation
  bCtx.drawImage(colorCanvas, 0, 0, 1024, 512);
  const bData = bCtx.getImageData(0, 0, 1024, 512);
  for (let i = 0; i < bData.data.length; i += 4) {
    const isLand = !(bData.data[i + 2] > 90 && bData.data[i] < 50);
    if (isLand) {
      bData.data[i] = 110;
      bData.data[i + 1] = 110;
      bData.data[i + 2] = 110;
    } else {
      bData.data[i] = 0;
      bData.data[i + 1] = 0;
      bData.data[i + 2] = 0;
    }
  }
  bCtx.putImageData(bData, 0, 0);

  // Draw Mountain Ridges (Himalayas, Andes, Rockies, Alps, Great Dividing Range)
  const mountainChains = [
    // Andes (-70 lon, -40 to 5 lat)
    [[-70, 5], [-73, -10], [-68, -25], [-70, -45]],
    // Rockies (-115 lon, 35 to 60 lat)
    [[-110, 35], [-115, 45], [-125, 55], [-135, 62]],
    // Himalayas (75 to 95 lon, 28 to 35 lat)
    [[75, 32], [82, 30], [90, 28], [98, 28]],
    // Alps (5 to 15 lon, 45 to 48 lat)
    [[6, 45], [10, 47], [14, 46]],
  ];

  for (const chain of mountainChains) {
    bCtx.strokeStyle = '#ffffff';
    bCtx.lineWidth = 6;
    bCtx.filter = 'blur(3px)';
    bCtx.beginPath();
    const [x0, y0] = [((chain[0][0] + 180) / 360) * 1024, ((90 - chain[0][1]) / 180) * 512];
    bCtx.moveTo(x0, y0);
    for (let i = 1; i < chain.length; i++) {
      const [xi, yi] = [((chain[i][0] + 180) / 360) * 1024, ((90 - chain[i][1]) / 180) * 512];
      bCtx.lineTo(xi, yi);
    }
    bCtx.stroke();
    bCtx.filter = 'none';
  }

  // Create Three.js textures
  const colorTexture = new THREE.CanvasTexture(colorCanvas);
  colorTexture.colorSpace = THREE.SRGBColorSpace;
  colorTexture.wrapS = THREE.RepeatWrapping;
  colorTexture.wrapT = THREE.ClampToEdgeWrapping;

  const specularTexture = new THREE.CanvasTexture(specCanvas);
  specularTexture.wrapS = THREE.RepeatWrapping;
  specularTexture.wrapT = THREE.ClampToEdgeWrapping;

  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = THREE.RepeatWrapping;
  bumpTexture.wrapT = THREE.ClampToEdgeWrapping;

  const cloudsTexture = new THREE.CanvasTexture(cloudCanvas);
  cloudsTexture.wrapS = THREE.RepeatWrapping;
  cloudsTexture.wrapT = THREE.ClampToEdgeWrapping;

  return {
    colorTexture,
    specularTexture,
    bumpTexture,
    cloudsTexture,
  };
}
