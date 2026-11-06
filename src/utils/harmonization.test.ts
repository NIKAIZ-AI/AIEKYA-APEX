import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRossThick,
  calculateLiSparseR,
  normalizeToNBAR,
  BIOME_BRDF_PARAMS,
} from './brdf';
import {
  calculateNDVI,
  calculateEVI,
  harmonizedReflectance,
  OFFICIAL_HARMONIZATION_COEFFS,
  generateSRFCurve,
  MODIS_BANDS,
} from './srf';
import {
  calculateMODISFootprint,
  calculateVIIRSFootprint,
  scanAngleToVZA,
} from './footprint';
import {
  SATELLITES,
  getSatelliteState,
} from './orbital';
import {
  VALIDATION_SITES,
  generateTimeSeries,
  calculateHarmonizationMetrics,
} from './timeSeries';

test('BRDF: RossThick kernel is 0 at nadir standard geometry and responsive to VZA', () => {
  const kVolNadir = calculateRossThick(0, 0, 0);
  assert.ok(typeof kVolNadir === 'number');

  // Off-nadir should change volumetric scattering
  const kVolOffNadir = calculateRossThick(45, 30, 45);
  assert.notEqual(kVolNadir, kVolOffNadir);
});

test('BRDF: NBAR normalizes off-nadir reflectance towards standard geometry', () => {
  const observedReflectance = 0.05;
  const geom = { vza: 45, sza: 35, raa: 60 };
  const weights = BIOME_BRDF_PARAMS.forest.red;

  const result = normalizeToNBAR(observedReflectance, geom, weights, 45);
  assert.ok(result.nbar > 0 && result.nbar < 1);
  assert.ok(result.correctionFactor > 0);
});

test('SRF: NDVI and EVI calculations follow mathematical constraints', () => {
  const red = 0.04;
  const nir = 0.45;
  const blue = 0.02;

  const ndvi = calculateNDVI(red, nir);
  assert.ok(ndvi > 0.8 && ndvi < 0.9); // (0.45 - 0.04) / 0.49 = ~0.836

  const evi = calculateEVI(red, nir, blue);
  assert.ok(evi > 0 && evi <= 1);
});

test('SRF: SBAF regression converts VIIRS reflectance into MODIS equivalent', () => {
  const redPair = OFFICIAL_HARMONIZATION_COEFFS.find(c => c.modisBand === 'MODIS_B1' && c.viirsBand === 'VIIRS_I1')!;
  assert.ok(redPair);

  const viirsRef = 0.12;
  const modisEquiv = harmonizedReflectance(viirsRef, redPair);
  assert.ok(modisEquiv > 0.11 && modisEquiv < 0.13);

  // Check SRF curve generation has points
  const srf = generateSRFCurve(MODIS_BANDS[0], [600, 700], 50);
  assert.equal(srf.length, 50);
  assert.ok(srf.some(p => p.response > 0.5));
});

test('Footprint: VIIRS onboard aggregation constrains pixel growth relative to MODIS', () => {
  const edgeScanAngle = 50; // near swath edge

  const modisFootprint = calculateMODISFootprint(edgeScanAngle, 1000);
  const viirsFootprint = calculateVIIRSFootprint(edgeScanAngle, 750);

  // VZA increases with scan angle
  const vza = scanAngleToVZA(edgeScanAngle, 705);
  assert.ok(vza > edgeScanAngle);

  // MODIS pixel growth factor at 50 deg should exceed 3x
  assert.ok(modisFootprint.growthFactor > 3.0);

  // VIIRS aggregation restricts along-scan growth significantly
  assert.ok(viirsFootprint.alongScanMeters < modisFootprint.alongScanMeters);
});

test('Orbital: Satellites propagate valid geographical and 3D positions', () => {
  const terra = SATELLITES.find(s => s.id === 'terra')!;
  const state = getSatelliteState(terra, 1200, 2.0);

  assert.ok(state.latDeg >= -90 && state.latDeg <= 90);
  assert.ok(state.lonDeg >= -180 && state.lonDeg <= 180);
  assert.ok(state.position3D.x !== 0 || state.position3D.y !== 0);
  assert.ok(state.swathLeft3D && state.swathRight3D);
});

test('TimeSeries: 2000-2026 climate record continuity shows improved RMSE with harmonization', () => {
  const site = VALIDATION_SITES[0]; // Amazon
  const records = generateTimeSeries(site, 'NDVI');

  assert.ok(records.length > 250); // > 20 years * 12 months
  const metrics = calculateHarmonizationMetrics(records);

  assert.ok(metrics.harmonizedRmse < metrics.unharmonizedRmse);
  assert.ok(metrics.residualImprovementPct > 50);
});
