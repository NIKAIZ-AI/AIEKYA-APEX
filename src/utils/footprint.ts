/**
 * Satellite Sensor Spatial Footprint & Bowtie Distortion Module
 * Compares the optical scan geometry of MODIS vs VIIRS onboard pixel aggregation.
 */

const EARTH_RADIUS_KM = 6371.0;
const MODIS_ALTITUDE_KM = 705.0;
const VIIRS_ALTITUDE_KM = 824.0;
const DEG2RAD = Math.PI / 180;

export interface FootprintDimensions {
  scanAngleDeg: number;
  viewZenithDeg: number;
  alongScanMeters: number;
  alongTrackMeters: number;
  areaKm2: number;
  growthFactor: number;
  aggregationMode?: '3:1' | '2:1' | '1:1';
}

/**
 * Calculates ground View Zenith Angle (VZA) from sensor scan angle (theta)
 * taking Earth curvature into account.
 */
export function scanAngleToVZA(scanAngleDeg: number, altitudeKm: number): number {
  const theta = Math.abs(scanAngleDeg) * DEG2RAD;
  const ratio = (EARTH_RADIUS_KM + altitudeKm) / EARTH_RADIUS_KM;
  const sinVza = ratio * Math.sin(theta);
  if (sinVza >= 1.0) return 90.0;
  return Math.asin(sinVza) / DEG2RAD;
}

/**
 * Calculates MODIS pixel footprint across scan angle (no onboard aggregation).
 * Shows standard bowtie growth effect (up to 4.8x along scan, 2.0x along track).
 */
export function calculateMODISFootprint(
  scanAngleDeg: number,
  nadirResolutionM = 1000
): FootprintDimensions {
  const clampedAngle = Math.min(Math.max(Math.abs(scanAngleDeg), 0), 55.0);
  const vza = scanAngleToVZA(clampedAngle, MODIS_ALTITUDE_KM);

  const thetaRad = clampedAngle * DEG2RAD;
  const vzaRad = vza * DEG2RAD;

  // Exact spherical geometry expansion factors (Wolfe et al., 2002)
  const alongScanFactor = (Math.cos(thetaRad) / Math.max(Math.cos(vzaRad), 0.05)) * (1 / Math.max(Math.cos(vzaRad), 0.05));
  const alongTrackFactor = 1 / Math.max(Math.cos(vzaRad), 0.1);

  const alongScanMeters = nadirResolutionM * alongScanFactor;
  const alongTrackMeters = nadirResolutionM * alongTrackFactor;
  const areaKm2 = (alongScanMeters * alongTrackMeters) / 1e6;
  const nadirAreaKm2 = (nadirResolutionM * nadirResolutionM) / 1e6;

  return {
    scanAngleDeg,
    viewZenithDeg: Number(vza.toFixed(2)),
    alongScanMeters: Math.round(alongScanMeters),
    alongTrackMeters: Math.round(alongTrackMeters),
    areaKm2: Number(areaKm2.toFixed(3)),
    growthFactor: Number((areaKm2 / nadirAreaKm2).toFixed(2)),
  };
}

/**
 * Calculates VIIRS pixel footprint with 3:1 -> 2:1 -> 1:1 aggregation
 * Constrains pixel growth across its wider ±56.3° swath.
 */
export function calculateVIIRSFootprint(
  scanAngleDeg: number,
  nadirResolutionM = 750
): FootprintDimensions {
  const clampedAngle = Math.min(Math.max(Math.abs(scanAngleDeg), 0), 56.28);
  const vza = scanAngleToVZA(clampedAngle, VIIRS_ALTITUDE_KM);

  const vzaRad = vza * DEG2RAD;

  // VIIRS aggregation zones (Wolfe et al., 2013)
  let aggMode: '3:1' | '2:1' | '1:1' = '3:1';
  let subSampleRatio = 3;

  if (clampedAngle <= 31.7) {
    aggMode = '3:1';
    subSampleRatio = 3;
  } else if (clampedAngle <= 44.86) {
    aggMode = '2:1';
    subSampleRatio = 2;
  } else {
    aggMode = '1:1';
    subSampleRatio = 1;
  }

  // Base raw detector dimension at nadir without aggregation is (nadirResolutionM / 3)
  const baseDetectorM = nadirResolutionM / 3.0;

  // Along-scan expansion for single detector sample
  const detectorScanFactor = 1 / Math.pow(Math.max(Math.cos(vzaRad), 0.1), 1.8);
  const alongScanMeters = baseDetectorM * subSampleRatio * detectorScanFactor;

  // Along-track expansion
  const alongTrackFactor = 1 / Math.max(Math.cos(vzaRad), 0.15);
  const alongTrackMeters = nadirResolutionM * alongTrackFactor;

  const areaKm2 = (alongScanMeters * alongTrackMeters) / 1e6;
  const nadirAreaKm2 = (nadirResolutionM * nadirResolutionM) / 1e6;

  return {
    scanAngleDeg,
    viewZenithDeg: Number(vza.toFixed(2)),
    alongScanMeters: Math.round(alongScanMeters),
    alongTrackMeters: Math.round(alongTrackMeters),
    areaKm2: Number(areaKm2.toFixed(3)),
    growthFactor: Number((areaKm2 / nadirAreaKm2).toFixed(2)),
    aggregationMode: aggMode,
  };
}

/**
 * Evaluates the resampling harmonization error when mapping MODIS & VIIRS
 * onto a unified 500m or 1000m target Climate Modeling Grid (CMG).
 */
export function calculateResamplingOverlap(
  sensorFootprint: FootprintDimensions,
  targetGridSizeM = 500
): {
  targetGridSizeM: number;
  coverageRatio: number; // Ratio of sensor footprint to target cell
  effectiveSubPixels: number;
  pointSpreadFunctionBlur: number; // Normalized blur coefficient [1.0 to 4.5]
} {
  const sensorAreaM2 = sensorFootprint.alongScanMeters * sensorFootprint.alongTrackMeters;
  const targetAreaM2 = targetGridSizeM * targetGridSizeM;
  const coverageRatio = sensorAreaM2 / targetAreaM2;
  const psfBlur = Math.sqrt(coverageRatio);

  return {
    targetGridSizeM,
    coverageRatio: Number(coverageRatio.toFixed(2)),
    effectiveSubPixels: Math.max(1, Math.round(targetAreaM2 / sensorAreaM2)),
    pointSpreadFunctionBlur: Number(psfBlur.toFixed(2)),
  };
}
