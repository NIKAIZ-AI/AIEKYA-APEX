/**
 * Spectral Response Function (SRF) & Spectral Band Adjustment Factor (SBAF) Module
 * Handles spectral band differences between MODIS (Terra/Aqua) and VIIRS (SNPP/NOAA-20/21)
 */

export interface SpectralBand {
  id: string;
  sensor: 'MODIS' | 'VIIRS';
  satellite: string;
  name: string;
  wavelengthMin: number; // nm
  wavelengthMax: number; // nm
  wavelengthCenter: number; // nm
  bandwidth: number; // nm
  resolutionNadirM: number;
  primaryApplication: string;
}

export const MODIS_BANDS: SpectralBand[] = [
  {
    id: 'MODIS_B1',
    sensor: 'MODIS',
    satellite: 'Terra / Aqua',
    name: 'Band 1 (Red)',
    wavelengthMin: 620,
    wavelengthMax: 670,
    wavelengthCenter: 645,
    bandwidth: 50,
    resolutionNadirM: 250,
    primaryApplication: 'Vegetation chlorophyll absorption, NDVI',
  },
  {
    id: 'MODIS_B2',
    sensor: 'MODIS',
    satellite: 'Terra / Aqua',
    name: 'Band 2 (NIR)',
    wavelengthMin: 841,
    wavelengthMax: 876,
    wavelengthCenter: 858,
    bandwidth: 35,
    resolutionNadirM: 250,
    primaryApplication: 'Leaf cellular structure, vegetation vigor, water body delineation',
  },
  {
    id: 'MODIS_B3',
    sensor: 'MODIS',
    satellite: 'Terra / Aqua',
    name: 'Band 3 (Blue)',
    wavelengthMin: 459,
    wavelengthMax: 479,
    wavelengthCenter: 469,
    bandwidth: 20,
    resolutionNadirM: 500,
    primaryApplication: 'Atmospheric aerosol, soil/veg discrimination',
  },
  {
    id: 'MODIS_B4',
    sensor: 'MODIS',
    satellite: 'Terra / Aqua',
    name: 'Band 4 (Green)',
    wavelengthMin: 545,
    wavelengthMax: 565,
    wavelengthCenter: 555,
    bandwidth: 20,
    resolutionNadirM: 500,
    primaryApplication: 'Green reflectance peak, true-color composite',
  },
  {
    id: 'MODIS_B6',
    sensor: 'MODIS',
    satellite: 'Terra / Aqua',
    name: 'Band 6 (SWIR-1)',
    wavelengthMin: 1628,
    wavelengthMax: 1652,
    wavelengthCenter: 1640,
    bandwidth: 24,
    resolutionNadirM: 500,
    primaryApplication: 'Snow/cloud discrimination, canopy moisture',
  },
  {
    id: 'MODIS_B7',
    sensor: 'MODIS',
    satellite: 'Terra / Aqua',
    name: 'Band 7 (SWIR-2)',
    wavelengthMin: 2105,
    wavelengthMax: 2155,
    wavelengthCenter: 2130,
    bandwidth: 50,
    resolutionNadirM: 500,
    primaryApplication: 'Mineral mapping, burn scars, aerosol correction',
  },
];

export const VIIRS_BANDS: SpectralBand[] = [
  {
    id: 'VIIRS_I1',
    sensor: 'VIIRS',
    satellite: 'Suomi-NPP / NOAA-20 / NOAA-21',
    name: 'Band I1 (Imagery Red)',
    wavelengthMin: 600,
    wavelengthMax: 680,
    wavelengthCenter: 640,
    bandwidth: 80,
    resolutionNadirM: 375,
    primaryApplication: 'High-res NDVI, active fire boundary, land cover',
  },
  {
    id: 'VIIRS_M5',
    sensor: 'VIIRS',
    satellite: 'Suomi-NPP / NOAA-20 / NOAA-21',
    name: 'Band M5 (Moderate Red)',
    wavelengthMin: 662,
    wavelengthMax: 682,
    wavelengthCenter: 672,
    bandwidth: 20,
    resolutionNadirM: 750,
    primaryApplication: 'Chlorophyll absorption, moderate-res surface reflectance',
  },
  {
    id: 'VIIRS_I2',
    sensor: 'VIIRS',
    satellite: 'Suomi-NPP / NOAA-20 / NOAA-21',
    name: 'Band I2 (Imagery NIR)',
    wavelengthMin: 846,
    wavelengthMax: 885,
    wavelengthCenter: 865,
    bandwidth: 39,
    resolutionNadirM: 375,
    primaryApplication: 'High-res vegetation vigor, flood extent',
  },
  {
    id: 'VIIRS_M7',
    sensor: 'VIIRS',
    satellite: 'Suomi-NPP / NOAA-20 / NOAA-21',
    name: 'Band M7 (Moderate NIR)',
    wavelengthMin: 846,
    wavelengthMax: 885,
    wavelengthCenter: 865,
    bandwidth: 39,
    resolutionNadirM: 750,
    primaryApplication: 'Dual-gain NIR, ocean color aerosol, land indices',
  },
  {
    id: 'VIIRS_M3',
    sensor: 'VIIRS',
    satellite: 'Suomi-NPP / NOAA-20 / NOAA-21',
    name: 'Band M3 (Blue)',
    wavelengthMin: 478,
    wavelengthMax: 498,
    wavelengthCenter: 488,
    bandwidth: 20,
    resolutionNadirM: 750,
    primaryApplication: 'Aerosol optical thickness, water quality',
  },
  {
    id: 'VIIRS_M4',
    sensor: 'VIIRS',
    satellite: 'Suomi-NPP / NOAA-20 / NOAA-21',
    name: 'Band M4 (Green)',
    wavelengthMin: 545,
    wavelengthMax: 565,
    wavelengthCenter: 555,
    bandwidth: 20,
    resolutionNadirM: 750,
    primaryApplication: 'True color composite, coastal turbidity',
  },
  {
    id: 'VIIRS_I3',
    sensor: 'VIIRS',
    satellite: 'Suomi-NPP / NOAA-20 / NOAA-21',
    name: 'Band I3 (Imagery SWIR)',
    wavelengthMin: 1580,
    wavelengthMax: 1640,
    wavelengthCenter: 1610,
    bandwidth: 60,
    resolutionNadirM: 375,
    primaryApplication: 'Snow vs cloud, fire mapping, burn severity',
  },
  {
    id: 'VIIRS_M11',
    sensor: 'VIIRS',
    satellite: 'Suomi-NPP / NOAA-20 / NOAA-21',
    name: 'Band M11 (SWIR-2)',
    wavelengthMin: 2225,
    wavelengthMax: 2275,
    wavelengthCenter: 2250,
    bandwidth: 50,
    resolutionNadirM: 750,
    primaryApplication: 'High temperature fire detection, geology',
  },
];

export interface BandPairHarmonization {
  modisBand: string;
  viirsBand: string;
  spectralDomain: 'Red' | 'NIR' | 'Blue' | 'Green' | 'SWIR-1' | 'SWIR-2';
  // Linear regression: R_modis = slope * R_viirs + offset
  slope: number;
  offset: number;
  rSquared: number;
  rmse: number;
  notes: string;
}

export const OFFICIAL_HARMONIZATION_COEFFS: BandPairHarmonization[] = [
  {
    modisBand: 'MODIS_B1',
    viirsBand: 'VIIRS_I1',
    spectralDomain: 'Red',
    slope: 0.9824,
    offset: 0.0031,
    rSquared: 0.992,
    rmse: 0.0078,
    notes: 'VIIRS I1 has slightly broader 80nm bandwidth capturing additional fringe reflectance.',
  },
  {
    modisBand: 'MODIS_B1',
    viirsBand: 'VIIRS_M5',
    spectralDomain: 'Red',
    slope: 1.0315,
    offset: -0.0042,
    rSquared: 0.988,
    rmse: 0.0091,
    notes: 'VIIRS M5 is shifted to 672nm (deeper in chlorophyll absorption notch) relative to MODIS 645nm.',
  },
  {
    modisBand: 'MODIS_B2',
    viirsBand: 'VIIRS_I2',
    spectralDomain: 'NIR',
    slope: 0.9912,
    offset: 0.0025,
    rSquared: 0.995,
    rmse: 0.0064,
    notes: 'Exceptional spectral alignment across the NIR vegetation plateau with minimal water vapor artifact.',
  },
  {
    modisBand: 'MODIS_B3',
    viirsBand: 'VIIRS_M3',
    spectralDomain: 'Blue',
    slope: 0.9540,
    offset: 0.0068,
    rSquared: 0.981,
    rmse: 0.0112,
    notes: 'M3 center at 488nm vs MODIS 469nm results in Rayleigh scattering difference.',
  },
  {
    modisBand: 'MODIS_B4',
    viirsBand: 'VIIRS_M4',
    spectralDomain: 'Green',
    slope: 0.9978,
    offset: 0.0008,
    rSquared: 0.996,
    rmse: 0.0051,
    notes: 'Near-identical 545-565nm bandwidths; virtually zero spectral shift required.',
  },
  {
    modisBand: 'MODIS_B6',
    viirsBand: 'VIIRS_I3',
    spectralDomain: 'SWIR-1',
    slope: 1.0142,
    offset: -0.0038,
    rSquared: 0.989,
    rmse: 0.0089,
    notes: 'VIIRS I3 center at 1610nm vs MODIS 1640nm; slight sensitivity to leaf liquid water thickness.',
  },
];

/**
 * Procedural Gaussian/Trapezoidal SRF generator for simulation & visualization
 */
export function generateSRFCurve(
  band: SpectralBand,
  wavelengthRange: [number, number],
  numPoints = 120
): Array<{ wavelength: number; response: number }> {
  const [minW, maxW] = wavelengthRange;
  const step = (maxW - minW) / (numPoints - 1);
  const points: Array<{ wavelength: number; response: number }> = [];

  const center = band.wavelengthCenter;
  const fwhm = band.bandwidth;
  const sigma = fwhm / (2 * Math.sqrt(2 * Math.log(2)));

  for (let i = 0; i < numPoints; i++) {
    const wl = minW + i * step;
    // Super-Gaussian profile typical of satellite optical filter passbands
    const expTerm = Math.pow((wl - center) / (1.1 * sigma), 4);
    const response = Math.exp(-0.5 * expTerm);
    points.push({
      wavelength: Number(wl.toFixed(1)),
      response: response < 0.005 ? 0 : Number(response.toFixed(4)),
    });
  }
  return points;
}

/**
 * Apply SBAF transformation from VIIRS to MODIS equivalent reflectance
 */
export function harmonizedReflectance(
  viirsReflectance: number,
  pair: BandPairHarmonization
): number {
  const harmonized = pair.slope * viirsReflectance + pair.offset;
  return Math.max(0, Math.min(1.0, harmonized));
}

/**
 * Calculate NDVI from Red and NIR surface reflectance
 */
export function calculateNDVI(red: number, nir: number): number {
  const denom = nir + red;
  if (denom < 0.001) return 0;
  return (nir - red) / denom;
}

/**
 * Calculate EVI (Enhanced Vegetation Index)
 * EVI = 2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))
 */
export function calculateEVI(red: number, nir: number, blue: number): number {
  const denom = nir + 6 * red - 7.5 * blue + 1.0;
  if (denom < 0.01) return 0;
  return 2.5 * ((nir - red) / denom);
}
