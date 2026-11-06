import * as THREE from 'three';

/**
 * Decade Fire Intensity Heatmap Module
 * Projects historical average active fire intensity onto the 3D Earth globe
 * across the 2000s, 2010s, 2020s, and all-time climatology.
 */

export type FireDecade = '2000s' | '2010s' | '2020s' | 'all';

export interface GlobalFireCluster {
  id: string;
  name: string;
  lat: number;
  lon: number;
  radiusDeg: number;
  // Intensity multipliers per decade (0.0 to 1.0+)
  intensity: {
    '2000s': number;
    '2010s': number;
    '2020s': number;
    all: number;
  };
  primaryCauses: string;
}

export const GLOBAL_FIRE_CLUSTERS: GlobalFireCluster[] = [
  {
    id: 'amazon_arc',
    name: 'Amazon Arc of Deforestation (Brazil/Bolivia)',
    lat: -9.5,
    lon: -58.0,
    radiusDeg: 12.0,
    intensity: {
      '2000s': 0.88, // Peak clearing in 2004-2005
      '2010s': 0.65, // Deforestation plateau
      '2020s': 0.98, // Extreme 2024 El Niño megadrought spike
      all: 0.84,
    },
    primaryCauses: 'Agricultural expansion, cattle ranching, drought-driven understory fires',
  },
  {
    id: 'pantanal',
    name: 'Pantanal Tropical Wetlands',
    lat: -18.0,
    lon: -57.0,
    radiusDeg: 6.0,
    intensity: {
      '2000s': 0.35,
      '2010s': 0.42,
      '2020s': 1.00, // Catastrophic 2020 & 2024 fires
      all: 0.58,
    },
    primaryCauses: 'Severe hydrological drought and human pasture burns',
  },
  {
    id: 'congo_savanna',
    name: 'Central African Miombo & Savannas (Angola/DRC)',
    lat: -8.0,
    lon: 22.0,
    radiusDeg: 14.0,
    intensity: {
      '2000s': 0.95,
      '2010s': 0.92,
      '2020s': 0.89,
      all: 0.92,
    },
    primaryCauses: 'Annual agricultural shifting cultivation and pastoral burning',
  },
  {
    id: 'west_us',
    name: 'Western United States (California/Oregon)',
    lat: 38.5,
    lon: -120.0,
    radiusDeg: 7.5,
    intensity: {
      '2000s': 0.45,
      '2010s': 0.68,
      '2020s': 0.95, // Record 2020-2021 mega-fire years
      all: 0.69,
    },
    primaryCauses: 'Fuel buildup, extreme heatwaves, vapor pressure deficit, dry lightning',
  },
  {
    id: 'boreal_siberia',
    name: 'Siberian Boreal Larch Taiga (Sakha Republic)',
    lat: 62.0,
    lon: 125.0,
    radiusDeg: 13.0,
    intensity: {
      '2000s': 0.52,
      '2010s': 0.64,
      '2020s': 0.96, // Record 2021 Arctic heatwave burning
      all: 0.71,
    },
    primaryCauses: 'Permafrost thaw, high-latitude heat anomalies, lightning-ignited peat',
  },
  {
    id: 'boreal_canada',
    name: 'Canadian Boreal & Northwest Territories',
    lat: 56.0,
    lon: -115.0,
    radiusDeg: 12.0,
    intensity: {
      '2000s': 0.48,
      '2010s': 0.58,
      '2020s': 1.00, // Unprecedented 2023 Canadian wildfire crisis
      all: 0.68,
    },
    primaryCauses: 'Extreme early snowmelt, severe drought, continental blocking ridges',
  },
  {
    id: 'se_australia',
    name: 'Southeastern Australia (Victoria/NSW)',
    lat: -35.0,
    lon: 148.0,
    radiusDeg: 8.0,
    intensity: {
      '2000s': 0.55, // 2003 Canberra & 2009 Black Saturday
      '2010s': 0.98, // 2019-2020 Black Summer
      '2020s': 0.42, // La Niña dampening
      all: 0.65,
    },
    primaryCauses: 'Positive Indian Ocean Dipole, drought, high wind fire weather',
  },
  {
    id: 'se_asia_peat',
    name: 'Southeast Asian Peatlands (Sumatra/Kalimantan)',
    lat: -1.5,
    lon: 108.0,
    radiusDeg: 9.0,
    intensity: {
      '2000s': 0.72, // 2006 El Niño
      '2010s': 0.95, // 2015 Catastrophic peat haze crisis
      '2020s': 0.60, // 2023 moderate El Niño
      all: 0.75,
    },
    primaryCauses: 'Drained peatland subsidence, oil palm clearing, drought',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean Basin (Iberia/Greece)',
    lat: 39.0,
    lon: 10.0,
    radiusDeg: 8.0,
    intensity: {
      '2000s': 0.62,
      '2010s': 0.65,
      '2020s': 0.88, // 2021 & 2023 Mediterranean heat domes
      all: 0.72,
    },
    primaryCauses: 'Subtropical ridge heat extremes, rural land abandonment fuel accumulation',
  },
];

export interface DecadeStats {
  decade: FireDecade;
  label: string;
  periodYears: string;
  globalAverageIndex: number;
  dominantEpicenter: string;
  trendDescription: string;
}

export const DECADE_METADATA: Record<FireDecade, DecadeStats> = {
  '2000s': {
    decade: '2000s',
    label: '2000s Baseline Decade',
    periodYears: '2000 – 2009',
    globalAverageIndex: 68.4,
    dominantEpicenter: 'Amazon Basin & Central Africa Savannas',
    trendDescription: 'Initial Terra & Aqua MODIS era establishing the first global continuous satellite fire baseline.',
  },
  '2010s': {
    decade: '2010s',
    label: '2010s Transition Decade',
    periodYears: '2010 – 2019',
    globalAverageIndex: 74.2,
    dominantEpicenter: 'SE Asia Peatlands (2015) & SE Australia (2019)',
    trendDescription: 'Introduction of Suomi-NPP VIIRS (2012) and NOAA-20 (2017); emergence of multi-sensor overlap calibration.',
  },
  '2020s': {
    decade: '2020s',
    label: '2020s Megafires & Present',
    periodYears: '2020 – 2026',
    globalAverageIndex: 89.1,
    dominantEpicenter: 'North American Boreal, Siberia & Pantanal',
    trendDescription: 'Unprecedented high-latitude and tropical wetland burning with compound extreme heatwaves and droughts.',
  },
  all: {
    decade: 'all',
    label: '26-Year Climatology Record',
    periodYears: '2000 – 2026',
    globalAverageIndex: 77.2,
    dominantEpicenter: 'Global Multi-Sensor Unified Synthesis',
    trendDescription: 'Seamless multi-decadal harmonized Climate Data Record integrating MODIS and VIIRS.',
  },
};

/**
 * Creates a high-fidelity procedural 2D Canvas texture representing the
 * global active fire intensity heatmap for the chosen decade.
 */
export function createDecadeFireHeatmapTexture(
  decade: FireDecade,
  width = 1024,
  height = 512
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Transparent base background so Earth surface remains clearly visible beneath
  ctx.clearRect(0, 0, width, height);

  // Convert (lon, lat) to canvas pixel coordinates
  const toCanvas = (lon: number, lat: number): [number, number] => {
    const x = ((lon + 180) / 360) * width;
    const y = ((90 - lat) / 180) * height;
    return [x, y];
  };

  // Draw radial glowing fire hotspots for each cluster
  for (const cluster of GLOBAL_FIRE_CLUSTERS) {
    const intensity = cluster.intensity[decade];
    if (intensity <= 0.05) continue;

    const [cx, cy] = toCanvas(cluster.lon, cluster.lat);
    const radiusPx = (cluster.radiusDeg / 180) * height * 1.35;

    // Multi-stop neon flame gradient: Core Neon Yellow -> Intense Orange -> Magenta/Purple -> Transparent
    const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, radiusPx);
    grad.addColorStop(0.0, `rgba(255, 255, 140, ${0.95 * intensity})`); // Neon core
    grad.addColorStop(0.25, `rgba(255, 120, 10, ${0.85 * intensity})`); // Fire orange
    grad.addColorStop(0.60, `rgba(220, 20, 60, ${0.55 * intensity})`);  // Crimson
    grad.addColorStop(0.85, `rgba(147, 51, 234, ${0.25 * intensity})`); // Royal violet fringe
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radiusPx, 0, Math.PI * 2);
    ctx.fill();

    // Secondary sub-pixel flare core for high-intensity hotspots
    if (intensity > 0.7) {
      const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radiusPx * 0.35);
      coreGrad.addColorStop(0.0, 'rgba(255, 255, 255, 0.98)'); // Pure white hot
      coreGrad.addColorStop(0.5, 'rgba(255, 220, 50, 0.7)');
      coreGrad.addColorStop(1.0, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, radiusPx * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}
