/**
 * Orbital Mechanics & Satellite Swath Projection Module
 * Simulates real Sun-synchronous Low Earth Orbits (LEO) for Terra, Aqua, Suomi-NPP, NOAA-20, and NOAA-21.
 */

export interface SatelliteConfig {
  id: string;
  name: string;
  sensor: 'MODIS' | 'VIIRS';
  altitudeKm: number;
  inclinationDeg: number;
  periodMinutes: number;
  equatorialCrossingTime: string; // e.g. "10:30 AM Descending" or "01:30 PM Ascending"
  swathWidthKm: number;
  scanAngleDeg: number;
  launchYear: number;
  status: 'Operational' | 'Orbit Drifting' | 'Decommission Phase';
  colorHex: string;
  phaseOffsetRad: number; // initial orbital phase offset
}

export const SATELLITES: SatelliteConfig[] = [
  {
    id: 'terra',
    name: 'Terra (EOS AM-1)',
    sensor: 'MODIS',
    altitudeKm: 705,
    inclinationDeg: 98.2,
    periodMinutes: 98.8,
    equatorialCrossingTime: '10:30 AM (Descending)',
    swathWidthKm: 2330,
    scanAngleDeg: 55.0,
    launchYear: 1999,
    status: 'Orbit Drifting',
    colorHex: '#38bdf8', // Sky Blue
    phaseOffsetRad: 0.0,
  },
  {
    id: 'aqua',
    name: 'Aqua (EOS PM-1)',
    sensor: 'MODIS',
    altitudeKm: 705,
    inclinationDeg: 98.2,
    periodMinutes: 98.8,
    equatorialCrossingTime: '01:30 PM (Ascending)',
    swathWidthKm: 2330,
    scanAngleDeg: 55.0,
    launchYear: 2002,
    status: 'Orbit Drifting',
    colorHex: '#06b6d4', // Laser Cyan
    phaseOffsetRad: Math.PI * 0.75,
  },
  {
    id: 'snpp',
    name: 'Suomi-NPP',
    sensor: 'VIIRS',
    altitudeKm: 824,
    inclinationDeg: 98.7,
    periodMinutes: 101.4,
    equatorialCrossingTime: '01:30 PM (Ascending)',
    swathWidthKm: 3040,
    scanAngleDeg: 56.28,
    launchYear: 2011,
    status: 'Operational',
    colorHex: '#f59e0b', // Telemetry Amber
    phaseOffsetRad: Math.PI * 1.35,
  },
  {
    id: 'noaa20',
    name: 'NOAA-20 (JPSS-1)',
    sensor: 'VIIRS',
    altitudeKm: 824,
    inclinationDeg: 98.7,
    periodMinutes: 101.4,
    equatorialCrossingTime: '01:30 PM (Ascending +50m)',
    swathWidthKm: 3040,
    scanAngleDeg: 56.28,
    launchYear: 2017,
    status: 'Operational',
    colorHex: '#10b981', // Emerald
    phaseOffsetRad: Math.PI * 1.35 + Math.PI * (50 / 101.4) * 2, // 50 min offset
  },
  {
    id: 'noaa21',
    name: 'NOAA-21 (JPSS-2)',
    sensor: 'VIIRS',
    altitudeKm: 824,
    inclinationDeg: 98.7,
    periodMinutes: 101.4,
    equatorialCrossingTime: '01:30 PM (Ascending)',
    swathWidthKm: 3040,
    scanAngleDeg: 56.28,
    launchYear: 2022,
    status: 'Operational',
    colorHex: '#a855f7', // Purple
    phaseOffsetRad: Math.PI * 0.45,
  },
];

const DEG2RAD = Math.PI / 180;
const EARTH_RADIUS_KM = 6371.0;

export interface SatelliteState {
  config: SatelliteConfig;
  latDeg: number;
  lonDeg: number;
  altitudeKm: number;
  position3D: { x: number; y: number; z: number };
  subSat3D: { x: number; y: number; z: number };
  swathLeft3D: { x: number; y: number; z: number };
  swathRight3D: { x: number; y: number; z: number };
  headingDeg: number;
}

/**
 * Propagates satellite orbit for elapsed simulation seconds
 * Returns 3D sphere coordinate positions normalized for a globe of radius `globeRadius`
 */
export function getSatelliteState(
  sat: SatelliteConfig,
  elapsedSeconds: number,
  globeRadius = 2.0
): SatelliteState {
  const periodSec = sat.periodMinutes * 60;
  // Mean motion
  const meanAnomaly = (2 * Math.PI * (elapsedSeconds / periodSec) + sat.phaseOffsetRad) % (2 * Math.PI);

  const incRad = sat.inclinationDeg * DEG2RAD;

  // Latitude from spherical orbit: sin(lat) = sin(inc) * sin(u)
  const sinLat = Math.sin(incRad) * Math.sin(meanAnomaly);
  const latRad = Math.asin(sinLat);
  const latDeg = latRad / DEG2RAD;

  // Longitude accounts for orbital node and Earth rotation
  // Earth rotates 360° in 86164 seconds (sidereal day)
  const earthRotRad = (2 * Math.PI * elapsedSeconds) / 86164;
  const orbitLonRad = Math.atan2(Math.cos(incRad) * Math.sin(meanAnomaly), Math.cos(meanAnomaly));
  const lonRad = (orbitLonRad - earthRotRad + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  const lonDeg = lonRad / DEG2RAD;

  // Orbit altitude scaled to globe radius
  const altRatio = (EARTH_RADIUS_KM + sat.altitudeKm) / EARTH_RADIUS_KM;
  const satRadius = globeRadius * altRatio;

  // Convert (lat, lon) to 3D Cartesian (Y-up, Z-forward, X-right)
  const phi = (90 - latDeg) * DEG2RAD;
  const theta = (lonDeg + 180) * DEG2RAD;

  const subX = -globeRadius * Math.sin(phi) * Math.cos(theta);
  const subZ = globeRadius * Math.sin(phi) * Math.sin(theta);
  const subY = globeRadius * Math.cos(phi);

  const satX = -satRadius * Math.sin(phi) * Math.cos(theta);
  const satZ = satRadius * Math.sin(phi) * Math.sin(theta);
  const satY = satRadius * Math.cos(phi);

  // Swath footprint width on Earth surface (swath angle in radians)
  const halfSwathAngleRad = (sat.swathWidthKm / (2 * EARTH_RADIUS_KM));

  // Tangent perpendicular to orbital track
  const dLat = Math.cos(meanAnomaly) * Math.sin(incRad);
  const dLon = -Math.sin(meanAnomaly) * Math.cos(incRad);
  const heading = Math.atan2(dLon, dLat);

  // Perpendicular heading
  const perpHeadingLeft = heading + Math.PI / 2;
  const perpHeadingRight = heading - Math.PI / 2;

  // Swath left edge
  const leftLat = latDeg + (halfSwathAngleRad / DEG2RAD) * Math.cos(perpHeadingLeft);
  const leftLon = lonDeg + (halfSwathAngleRad / DEG2RAD) * Math.sin(perpHeadingLeft);
  const leftPhi = (90 - leftLat) * DEG2RAD;
  const leftTheta = (leftLon + 180) * DEG2RAD;

  const leftX = -globeRadius * Math.sin(leftPhi) * Math.cos(leftTheta);
  const leftZ = globeRadius * Math.sin(leftPhi) * Math.sin(leftTheta);
  const leftY = globeRadius * Math.cos(leftPhi);

  // Swath right edge
  const rightLat = latDeg + (halfSwathAngleRad / DEG2RAD) * Math.cos(perpHeadingRight);
  const rightLon = lonDeg + (halfSwathAngleRad / DEG2RAD) * Math.sin(perpHeadingRight);
  const rightPhi = (90 - rightLat) * DEG2RAD;
  const rightTheta = (rightLon + 180) * DEG2RAD;

  const rightX = -globeRadius * Math.sin(rightPhi) * Math.cos(rightTheta);
  const rightZ = globeRadius * Math.sin(rightPhi) * Math.sin(rightTheta);
  const rightY = globeRadius * Math.cos(rightPhi);

  return {
    config: sat,
    latDeg: Number(latDeg.toFixed(2)),
    lonDeg: Number(lonDeg.toFixed(2)),
    altitudeKm: sat.altitudeKm,
    position3D: { x: satX, y: satY, z: satZ },
    subSat3D: { x: subX, y: subY, z: subZ },
    swathLeft3D: { x: leftX, y: leftY, z: leftZ },
    swathRight3D: { x: rightX, y: rightY, z: rightZ },
    headingDeg: Number(((heading / DEG2RAD + 360) % 360).toFixed(1)),
  };
}

/**
 * Computes an orbital path ring (array of 3D vertices)
 */
export function generateOrbitPathPoints(
  sat: SatelliteConfig,
  globeRadius = 2.0,
  numSegments = 120
): Array<[number, number, number]> {
  const points: Array<[number, number, number]> = [];
  const altRatio = (EARTH_RADIUS_KM + sat.altitudeKm) / EARTH_RADIUS_KM;
  const satRadius = globeRadius * altRatio;
  const incRad = sat.inclinationDeg * DEG2RAD;

  for (let i = 0; i <= numSegments; i++) {
    const u = (i / numSegments) * Math.PI * 2;
    const sinLat = Math.sin(incRad) * Math.sin(u);
    const latRad = Math.asin(sinLat);
    const latDeg = latRad / DEG2RAD;
    const orbitLonRad = Math.atan2(Math.cos(incRad) * Math.sin(u), Math.cos(u));
    const lonDeg = orbitLonRad / DEG2RAD;

    const phi = (90 - latDeg) * DEG2RAD;
    const theta = (lonDeg + 180) * DEG2RAD;

    const x = -satRadius * Math.sin(phi) * Math.cos(theta);
    const y = satRadius * Math.cos(phi);
    const z = satRadius * Math.sin(phi) * Math.sin(theta);
    points.push([x, y, z]);
  }
  return points;
}
