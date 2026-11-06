/**
 * Bidirectional Reflectance Distribution Function (BRDF) Module
 * Implements the RossThick-LiSparse-Reciprocal (RTLSR) semi-empirical kernel-driven model
 * used in NASA MODIS (MCD43) and VIIRS (VNP43) Nadir BRDF-Adjusted Reflectance (NBAR).
 */

export interface BRDFWeights {
  f_iso: number;
  f_vol: number;
  f_geo: number;
}

export interface ViewingGeometry {
  vza: number; // View Zenith Angle in degrees [0, 80]
  sza: number; // Solar Zenith Angle in degrees [0, 80]
  raa: number; // Relative Azimuth Angle in degrees [0, 360]
}

const DEG2RAD = Math.PI / 180;

/**
 * RossThick volumetric scattering kernel (K_vol)
 * Accounts for multiple scattering in a dense foliage canopy.
 */
export function calculateRossThick(vzaDeg: number, szaDeg: number, raaDeg: number): number {
  const theta_v = Math.min(Math.max(vzaDeg, 0), 85) * DEG2RAD;
  const theta_s = Math.min(Math.max(szaDeg, 0), 85) * DEG2RAD;
  const phi = raaDeg * DEG2RAD;

  const cosThetaV = Math.cos(theta_v);
  const cosThetaS = Math.cos(theta_s);
  const sinThetaV = Math.sin(theta_v);
  const sinThetaS = Math.sin(theta_s);
  const cosPhi = Math.cos(phi);

  // Phase angle cos(xi)
  let cosXi = cosThetaV * cosThetaS + sinThetaV * sinThetaS * cosPhi;
  cosXi = Math.min(Math.max(cosXi, -1), 1);
  const xi = Math.acos(cosXi);
  const sinXi = Math.sin(xi);

  const numerator = (Math.PI / 2 - xi) * cosXi + sinXi;
  const denominator = cosThetaV + cosThetaS;

  if (denominator === 0) return 0;
  return numerator / denominator - Math.PI / 4;
}

/**
 * LiSparse-R geometric shadow casting kernel (K_geo)
 * Accounts for mutual shadowing of discrete plant crowns.
 */
export function calculateLiSparseR(
  vzaDeg: number,
  szaDeg: number,
  raaDeg: number,
  h_over_b = 2.0,
  b_over_r = 1.0
): number {
  const theta_v = Math.min(Math.max(vzaDeg, 0), 85) * DEG2RAD;
  const theta_s = Math.min(Math.max(szaDeg, 0), 85) * DEG2RAD;
  const phi = raaDeg * DEG2RAD;

  // Modified zenith angles for spheroid deformation
  const theta_v_prime = Math.atan(b_over_r * Math.tan(theta_v));
  const theta_s_prime = Math.atan(b_over_r * Math.tan(theta_s));

  const cosThetaV_p = Math.cos(theta_v_prime);
  const cosThetaS_p = Math.cos(theta_s_prime);
  const sinThetaV_p = Math.sin(theta_v_prime);
  const sinThetaS_p = Math.sin(theta_s_prime);
  const cosPhi = Math.cos(phi);

  let cosXi_prime = cosThetaV_p * cosThetaS_p + sinThetaV_p * sinThetaS_p * cosPhi;
  cosXi_prime = Math.min(Math.max(cosXi_prime, -1), 1);
  const sinXi_prime = Math.sqrt(Math.max(0, 1 - cosXi_prime * cosXi_prime));

  const secThetaV_p = 1 / Math.max(cosThetaV_p, 0.001);
  const secThetaS_p = 1 / Math.max(cosThetaS_p, 0.001);

  const D_squared =
    Math.tan(theta_v_prime) * Math.tan(theta_v_prime) +
    Math.tan(theta_s_prime) * Math.tan(theta_s_prime) -
    2 * Math.tan(theta_v_prime) * Math.tan(theta_s_prime) * cosPhi;
  const D = Math.sqrt(Math.max(0, D_squared));

  const cosT = h_over_b * Math.sqrt(D_squared + Math.pow(Math.tan(theta_v_prime) * Math.tan(theta_s_prime) * Math.sin(phi), 2)) /
    (secThetaV_p + secThetaS_p);
  const clampedCosT = Math.min(Math.max(cosT, -1), 1);
  const t = Math.acos(clampedCosT);

  const overlap = (1 / Math.PI) * (t - Math.sin(t) * Math.cos(t)) * (secThetaV_p + secThetaS_p);
  const distance = secThetaV_p + secThetaS_p - overlap;

  return 0.5 * (1 + cosXi_prime) * secThetaV_p * secThetaS_p - distance;
}

/**
 * Predict surface reflectance under given viewing/illumination geometry using RTLSR
 */
export function predictReflectance(
  geom: ViewingGeometry,
  weights: BRDFWeights
): number {
  const kVol = calculateRossThick(geom.vza, geom.sza, geom.raa);
  const kGeo = calculateLiSparseR(geom.vza, geom.sza, geom.raa);
  return weights.f_iso + weights.f_vol * kVol + weights.f_geo * kGeo;
}

/**
 * Standardizes directional surface reflectance to Nadir BRDF-Adjusted Reflectance (NBAR).
 * Default target standard geometry: Nadir view (VZA = 0°), Solar Zenith = 45°
 */
export function normalizeToNBAR(
  observedReflectance: number,
  observedGeom: ViewingGeometry,
  weights: BRDFWeights,
  targetSzaDeg = 45
): {
  nbar: number;
  correctionFactor: number;
  kVolObserved: number;
  kGeoObserved: number;
  kVolStandard: number;
  kGeoStandard: number;
} {
  const kVolObserved = calculateRossThick(observedGeom.vza, observedGeom.sza, observedGeom.raa);
  const kGeoObserved = calculateLiSparseR(observedGeom.vza, observedGeom.sza, observedGeom.raa);

  const modeledObserved = weights.f_iso + weights.f_vol * kVolObserved + weights.f_geo * kGeoObserved;

  // Standard geometry: VZA = 0, SZA = targetSzaDeg, RAA = 0
  const kVolStandard = calculateRossThick(0, targetSzaDeg, 0);
  const kGeoStandard = calculateLiSparseR(0, targetSzaDeg, 0);
  const modeledStandard = weights.f_iso + weights.f_vol * kVolStandard + weights.f_geo * kGeoStandard;

  const correctionFactor = modeledObserved > 0.0001 ? modeledStandard / modeledObserved : 1.0;
  // Apply c-factor ratio approach (Roy et al., 2016)
  const nbar = observedReflectance * correctionFactor;

  return {
    nbar: Math.max(0, Math.min(nbar, 1.0)),
    correctionFactor,
    kVolObserved,
    kGeoObserved,
    kVolStandard,
    kGeoStandard,
  };
}

// Typical representative MODIS/VIIRS BRDF weights by surface type
export const BIOME_BRDF_PARAMS: Record<string, { name: string; red: BRDFWeights; nir: BRDFWeights }> = {
  forest: {
    name: 'Dense Deciduous & Conifer Forest',
    red: { f_iso: 0.038, f_vol: 0.019, f_geo: 0.007 },
    nir: { f_iso: 0.320, f_vol: 0.170, f_geo: 0.045 },
  },
  cropland: {
    name: 'Agricultural Crops / Grassland',
    red: { f_iso: 0.082, f_vol: 0.044, f_geo: 0.015 },
    nir: { f_iso: 0.370, f_vol: 0.190, f_geo: 0.052 },
  },
  savanna: {
    name: 'Woody Savanna & Shrubland',
    red: { f_iso: 0.120, f_vol: 0.058, f_geo: 0.024 },
    nir: { f_iso: 0.280, f_vol: 0.125, f_geo: 0.038 },
  },
  desert: {
    name: 'Barren Sand / Calibrated Playa (Railroad Valley)',
    red: { f_iso: 0.395, f_vol: 0.082, f_geo: 0.041 },
    nir: { f_iso: 0.440, f_vol: 0.095, f_geo: 0.048 },
  },
  snow: {
    name: 'Seasonal Snow / Ice Sheet',
    red: { f_iso: 0.820, f_vol: 0.060, f_geo: 0.012 },
    nir: { f_iso: 0.690, f_vol: 0.055, f_geo: 0.010 },
  },
};
