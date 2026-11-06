import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRESET_FIRE_REGIONS,
  harmonizeFireHotspots,
  generateFireCalendarData,
  generateHotspotsCSV,
  calculateAnnualSummaries,
  calculateHistoricalMedian,
  filterRecordsByDateRange,
  generateAnalyticsJSON,
} from './fireHarmonization';

test('Fire Harmonization: reconciles VIIRS 375m detection inflation to MODIS scale', () => {
  const rawViirs = 10000;
  const harmonized = harmonizeFireHotspots(rawViirs, 'Tropical Humid & Deciduous Forest', 25);

  // Harmonized should reconcile the ~3x VIIRS over-count back to consistent fire scale (~2500 - 4000)
  assert.ok(harmonized > 2000 && harmonized < 5000);
  assert.equal(harmonizeFireHotspots(0), 0);
});

test('Fire Calendar: generates multi-decadal monthly records from 2000 to 2026', () => {
  const amazon = PRESET_FIRE_REGIONS[0];
  const records = generateFireCalendarData(amazon);

  assert.ok(records.length >= 310); // 26 years * ~12 months
  const y2005 = records.filter(r => r.year === 2005);
  assert.equal(y2005.length, 12);

  // Check 2012 onwards has VIIRS data
  const y2018 = records.find(r => r.year === 2018 && r.month === 8)!;
  assert.ok(y2018.rawViirsCount !== undefined && y2018.rawViirsCount > 0);
  assert.ok(y2018.harmonizedCount > 0);
});

test('Fire CSV Export: produces valid CSV text with required emergency responder columns', () => {
  const california = PRESET_FIRE_REGIONS[1];
  const records = generateFireCalendarData(california);
  const csv = generateHotspotsCSV(california, records);

  assert.ok(csv.includes('Year,Month,Region_ID,Region_Name'));
  assert.ok(csv.includes('Harmonized_Hotspot_Count'));
  assert.ok(csv.includes('Baseline_Mean_2000_2020'));
  assert.ok(csv.split('\n').length > 300);
});

test('Annual Summaries: correctly identifies peak fire season months', () => {
  const amazon = PRESET_FIRE_REGIONS[0];
  const records = generateFireCalendarData(amazon);
  const annual = calculateAnnualSummaries(records);

  assert.equal(annual.length, 27); // 2000 to 2026
  // Amazon fire season peaks in Aug, Sep, or Oct (months 8, 9, 10)
  assert.ok([8, 9, 10].includes(annual[0].peakMonth));
});

test('Historical Median & Date-Range Filtering: computes robust baselines and subsets', () => {
  const amazon = PRESET_FIRE_REGIONS[0];
  const records = generateFireCalendarData(amazon);
  const medianSep = calculateHistoricalMedian(records, 9);
  assert.ok(medianSep > 10000);

  const subset = filterRecordsByDateRange(records, '2019-01', '2021-12');
  assert.equal(subset.length, 36);

  const jsonReport = generateAnalyticsJSON(amazon, records, { start: '2020-01', end: '2024-12' });
  assert.ok(jsonReport.includes('NASA Space Apps Challenge 2026'));
  assert.ok(jsonReport.includes('totalHotspotsHarmonized'));
});

