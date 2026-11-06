/**
 * Fire Hotspot Harmonization & Burning Activity Analytics Module
 * Reconciles MODIS (1km) and VIIRS (375m I-band) active fire detections
 * into a continuous, standardized fire history record (2000 - 2026).
 * Includes Fire Regime categorization (Wildfire vs Anthropogenic).
 */

export interface FireRegion {
  id: string;
  name: string;
  country: string;
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
  biome: string;
  peakSeasonMonths: number[]; // 1 = Jan, 12 = Dec
  baselineMonthlyMean: number[]; // 12 months (Jan-Dec) average fire count (2000-2020 baseline)
  historicRecordYear: number;
  historicRecordNote: string;
  description: string;
}

export const PRESET_FIRE_REGIONS: FireRegion[] = [
  {
    id: 'amazon',
    name: 'Amazon Rainforest & Arc of Deforestation',
    country: 'Brazil / Bolivia / Peru',
    latMin: -15.0,
    latMax: -3.0,
    lonMin: -68.0,
    lonMax: -50.0,
    biome: 'Tropical Humid & Deciduous Forest',
    peakSeasonMonths: [8, 9, 10], // Aug - Oct
    baselineMonthlyMean: [1420, 980, 850, 1100, 2400, 6800, 18500, 48200, 62400, 31500, 11200, 3800],
    historicRecordYear: 2024,
    historicRecordNote: 'Historic drought coupled with El Niño drove extreme burning across southern Amazonia.',
    description: 'Critical tropical biomass burning zone; agricultural clearing and drought-induced forest understory fires.',
  },
  {
    id: 'california',
    name: 'California & Western United States',
    country: 'United States',
    latMin: 32.5,
    latMax: 42.0,
    lonMin: -124.5,
    lonMax: -114.0,
    biome: 'Mediterranean Woodland, Chaparral & Conifer',
    peakSeasonMonths: [7, 8, 9, 10], // Jul - Oct
    baselineMonthlyMean: [45, 60, 110, 230, 680, 2100, 5400, 8900, 7800, 3600, 620, 120],
    historicRecordYear: 2020,
    historicRecordNote: 'Record fire season exceeding 4.3 million acres burned (August Complex, SCU, LNU).',
    description: 'High-consequence wildland-urban interface (WUI) fires driven by dry lightning, Diablo/Santa Ana winds, and fuel aridity.',
  },
  {
    id: 'australia_bush',
    name: 'Australian Bush & Southeast Savannas',
    country: 'Australia (NSW, Victoria, QLD)',
    latMin: -38.5,
    latMax: -26.0,
    lonMin: 142.0,
    lonMax: 153.5,
    biome: 'Temperate Eucalyptus Forest & Bushland',
    peakSeasonMonths: [11, 12, 1, 2], // Nov - Feb (Austral Summer)
    baselineMonthlyMean: [6800, 9400, 18500, 14200, 3400, 850, 420, 310, 650, 1800, 3200, 5100],
    historicRecordYear: 2019,
    historicRecordNote: '"Black Summer" mega-fires burning ~24 million hectares with unprecedented pyro-cumulonimbus activity.',
    description: 'Extreme fire-prone temperate biome vulnerable to Indian Ocean Dipole positive phases and heat extremes.',
  },
  {
    id: 'sub_saharan_africa',
    name: 'Sub-Saharan Africa & Miombo Savannas',
    country: 'Angola / Zambia / DRC / Mozambique',
    latMin: -18.0,
    latMax: -4.0,
    lonMin: 12.0,
    lonMax: 36.0,
    biome: 'Dry Deciduous Forest & Savanna Mosaic',
    peakSeasonMonths: [6, 7, 8, 9], // June - September dry season
    baselineMonthlyMean: [1200, 2400, 5600, 18500, 42000, 85000, 94000, 68000, 31000, 8900, 2100, 1100],
    historicRecordYear: 2019,
    historicRecordNote: 'Extensive seasonal savanna burning detected across central southern Africa.',
    description: 'Extensive dry-season savanna burning; mixture of pastoralist range clearing and agricultural residue.',
  },
  {
    id: 'pantanal',
    name: 'Pantanal Tropical Wetlands',
    country: 'Brazil / Bolivia / Paraguay',
    latMin: -22.0,
    latMax: -16.0,
    lonMin: -59.0,
    lonMax: -55.0,
    biome: 'Tropical Wetland & Floodplain Savanna',
    peakSeasonMonths: [8, 9, 10],
    baselineMonthlyMean: [180, 120, 140, 210, 420, 980, 3100, 8400, 12900, 6800, 2100, 450],
    historicRecordYear: 2020,
    historicRecordNote: 'Over 30% of the biome burned during unprecedented hydrological drought.',
    description: 'World’s largest tropical wetland experiencing severe fire weather during extended dry seasons.',
  },
  {
    id: 'siberia',
    name: 'Siberian Boreal Taiga',
    country: 'Russia (Sakha Republic)',
    latMin: 58.0,
    latMax: 68.0,
    lonMin: 115.0,
    lonMax: 135.0,
    biome: 'Boreal Needleleaf Larch Forest & Peatland',
    peakSeasonMonths: [6, 7, 8], // Jun - Aug
    baselineMonthlyMean: [10, 10, 25, 120, 1800, 14500, 38900, 21400, 1600, 80, 15, 10],
    historicRecordYear: 2021,
    historicRecordNote: 'Arctic heatwave and permafrost drying resulted in smoke plumes reaching the North Pole.',
    description: 'Carbon-dense boreal ecosystem; deep peat smoldering and high-intensity crown fires with global climate feedbacks.',
  },
  {
    id: 'mediterranean',
    name: 'Mediterranean Basin (Iberia & Greece)',
    country: 'Spain / Portugal / Greece',
    latMin: 36.0,
    latMax: 42.5,
    lonMin: -9.5,
    lonMax: 26.0,
    biome: 'Mediterranean Sclerophyllous Forest & Scrub',
    peakSeasonMonths: [7, 8, 9],
    baselineMonthlyMean: [110, 140, 250, 420, 890, 2400, 7800, 11400, 4200, 1100, 340, 150],
    historicRecordYear: 2023,
    historicRecordNote: 'Evros wildfire in Greece became the largest recorded contiguous wildfire in EU history.',
    description: 'Densely populated landscapes impacted by recurrent summer heatwaves and land abandonment fuel loads.',
  },
];

export interface MonthlyFireRecord {
  year: number;
  month: number; // 1-12
  decimalYear: number;
  rawModisCount?: number;
  rawViirsCount?: number;
  harmonizedCount: number;
  meanFRP: number; // MW (Fire Radiative Power)
  totalFRE: number; // GJ (Fire Radiative Energy)
  baselineMean: number;
  anomalyPercent: number; // delta vs 2000-2020 baseline (%)
  anomalyZScore: number;
  isRecordAnomaly: boolean;
  activeSensor: 'MODIS_ONLY' | 'OVERLAP' | 'VIIRS_DOMINANT';
  wildfireCount: number; // Forests / natural vegetation
  anthropogenicCount: number; // Agricultural, land clearing, industrial
  wildfirePercent: number;
  anthropogenicPercent: number;
}

export interface SpatialFireHotspot {
  id: string;
  lat: number;
  lon: number;
  frp: number; // MW
  brightnessTempK: number;
  confidence: number; // 0-100%
  date: string;
  sensor: 'Harmonized (VIIRS+MODIS)' | 'MODIS' | 'VIIRS';
  regime: 'wildfire' | 'anthropogenic';
  landCover: string;
}

/**
 * Reconciles VIIRS 375m active fire detections with MODIS 1km historical baseline.
 */
export function harmonizeFireHotspots(
  rawViirsCount: number,
  biome: string = 'Tropical Humid & Deciduous Forest',
  meanFRP: number = 22.0
): number {
  if (rawViirsCount <= 0) return 0;

  let alpha = 0.32;
  let beta = 0.96;

  if (biome.includes('Boreal') || biome.includes('Taiga')) {
    alpha = 0.36;
    beta = 0.94;
  } else if (biome.includes('Wetland') || biome.includes('Floodplain')) {
    alpha = 0.28;
    beta = 0.98;
  } else if (biome.includes('Mediterranean') || biome.includes('Chaparral')) {
    alpha = 0.34;
    beta = 0.95;
  } else if (biome.includes('Savanna')) {
    alpha = 0.30;
    beta = 0.97;
  }

  const frpWeight = Math.min(1.25, Math.max(0.75, Math.pow(meanFRP / 20.0, 0.12)));
  const harmonized = alpha * Math.pow(rawViirsCount, beta) * frpWeight;
  return Math.round(Math.max(1, harmonized));
}

/**
 * Generates continuous 2000 - 2026 harmonized fire calendar records for an Area of Interest
 */
export function generateFireCalendarData(region: FireRegion): MonthlyFireRecord[] {
  const records: MonthlyFireRecord[] = [];
  const startYear = 2000;
  const endYear = 2026;

  for (let year = startYear; year <= endYear; year++) {
    const isRecordYear = year === region.historicRecordYear;
    const yearAnomalyFactor = isRecordYear
      ? 1.95
      : year === 2023 || year === 2024
      ? 1.45
      : 0.8 + ((year * 37 + 13) % 45) / 100;

    for (let month = 1; month <= 12; month++) {
      if (year === 2026 && month > 10) continue; // Partial current year

      const baseline = region.baselineMonthlyMean[month - 1];
      const isPeakMonth = region.peakSeasonMonths.includes(month);

      const noise = ((Math.sin(year * 12 + month * 7) + 1) / 2) * 0.3 - 0.15;
      const countScale = Math.max(0.2, yearAnomalyFactor + noise);

      const expectedMODIS = Math.round(baseline * countScale);

      let rawModis: number | undefined;
      let rawViirs: number | undefined;
      let harmonized: number;
      let activeSensor: 'MODIS_ONLY' | 'OVERLAP' | 'VIIRS_DOMINANT';

      if (year < 2012) {
        rawModis = expectedMODIS;
        harmonized = rawModis;
        activeSensor = 'MODIS_ONLY';
      } else if (year >= 2012 && year <= 2019) {
        rawModis = expectedMODIS;
        const viirsMultiplier = isPeakMonth ? 3.4 : 3.8;
        rawViirs = Math.round(expectedMODIS * viirsMultiplier);
        harmonized = Math.round(rawModis * 0.45 + harmonizeFireHotspots(rawViirs, region.biome) * 0.55);
        activeSensor = 'OVERLAP';
      } else {
        const viirsMultiplier = isPeakMonth ? 3.3 : 3.7;
        rawViirs = Math.round(expectedMODIS * viirsMultiplier);
        rawModis = Math.round(expectedMODIS * 0.95);
        harmonized = harmonizeFireHotspots(rawViirs, region.biome);
        activeSensor = 'VIIRS_DOMINANT';
      }

      // Fire regime categorization (Wildfire vs Anthropogenic)
      let wildfireRatio = 0.65;
      if (region.id === 'amazon') {
        // Amazon has high land clearing / agricultural fires in Aug-Sep
        wildfireRatio = isPeakMonth ? 0.52 : 0.70;
      } else if (region.id === 'california') {
        // California fires are mostly natural/wildland-urban wildfires
        wildfireRatio = 0.88;
      } else if (region.id === 'sub_saharan_africa') {
        // Sub-Saharan Africa has significant pastoral / agricultural burning
        wildfireRatio = 0.48;
      } else if (region.id === 'siberia') {
        wildfireRatio = 0.94;
      }

      const wildfireCount = Math.round(harmonized * wildfireRatio);
      const anthropogenicCount = harmonized - wildfireCount;
      const wildfirePercent = Number(((wildfireCount / Math.max(1, harmonized)) * 100).toFixed(1));
      const anthropogenicPercent = Number((100 - wildfirePercent).toFixed(1));

      const meanFRP = Math.round((18.0 + (isPeakMonth ? 22.0 : 8.0) * countScale) * 10) / 10;
      const totalFRE = Math.round(harmonized * meanFRP * 0.0864 * 10) / 10;

      const anomalyPct = Number((((harmonized - baseline) / Math.max(1, baseline)) * 100).toFixed(1));
      const zScore = Number(((harmonized - baseline) / Math.max(1, baseline * 0.4)).toFixed(2));

      records.push({
        year,
        month,
        decimalYear: year + (month - 0.5) / 12,
        rawModisCount: rawModis,
        rawViirsCount: rawViirs,
        harmonizedCount: harmonized,
        meanFRP,
        totalFRE,
        baselineMean: baseline,
        anomalyPercent: anomalyPct,
        anomalyZScore: zScore,
        isRecordAnomaly: isRecordYear && isPeakMonth,
        activeSensor,
        wildfireCount,
        anthropogenicCount,
        wildfirePercent,
        anthropogenicPercent,
      });
    }
  }

  return records;
}

/**
 * Generates sample spatial active fire hotspots for the 2D interactive map
 */
export function generateSpatialHotspots(
  region: FireRegion,
  count: number = 120,
  regimeFilter: 'all' | 'wildfire' | 'anthropogenic' = 'all'
): SpatialFireHotspot[] {
  const hotspots: SpatialFireHotspot[] = [];
  const latSpan = region.latMax - region.latMin;
  const lonSpan = region.lonMax - region.lonMin;

  for (let i = 0; i < count; i++) {
    // Semi-clustered distribution simulating fire perimeters
    const clusterLat = region.latMin + latSpan * (0.2 + 0.6 * ((i * 17) % 100) / 100);
    const clusterLon = region.lonMin + lonSpan * (0.2 + 0.6 * ((i * 29) % 100) / 100);

    const latOffset = (Math.sin(i * 3.7) * 0.35 + Math.cos(i * 1.9) * 0.15) * latSpan * 0.12;
    const lonOffset = (Math.cos(i * 4.3) * 0.35 + Math.sin(i * 2.1) * 0.15) * lonSpan * 0.12;

    const lat = Number((clusterLat + latOffset).toFixed(4));
    const lon = Number((clusterLon + lonOffset).toFixed(4));

    const isWildfire = (i % 3 !== 0);
    const regime: 'wildfire' | 'anthropogenic' = isWildfire ? 'wildfire' : 'anthropogenic';

    if (regimeFilter !== 'all' && regime !== regimeFilter) continue;

    const frp = Math.round((isWildfire ? 25 + (i * 31) % 180 : 8 + (i * 13) % 45) * 10) / 10;
    const brightnessTempK = Math.round(315 + frp * 0.45);
    const confidence = Math.min(100, Math.round(70 + (i * 7) % 30));

    hotspots.push({
      id: `fire_${region.id}_${i}`,
      lat,
      lon,
      frp,
      brightnessTempK,
      confidence,
      date: `2024-09-${String(1 + (i % 28)).padStart(2, '0')}`,
      sensor: i % 2 === 0 ? 'Harmonized (VIIRS+MODIS)' : (i % 3 === 0 ? 'MODIS' : 'VIIRS'),
      regime,
      landCover: isWildfire ? 'Dense Forest / Woodland' : 'Agricultural Land Clearing',
    });
  }

  return hotspots;
}

export interface AnnualFireSummary {
  year: number;
  totalHarmonized: number;
  totalRawModis?: number;
  totalRawViirs?: number;
  peakMonth: number;
  peakMonthCount: number;
  annualAnomalyPct: number;
  wildfireTotal: number;
  anthropogenicTotal: number;
}

export function calculateAnnualSummaries(records: MonthlyFireRecord[]): AnnualFireSummary[] {
  const yearMap = new Map<number, MonthlyFireRecord[]>();
  for (const r of records) {
    if (!yearMap.has(r.year)) yearMap.set(r.year, []);
    yearMap.get(r.year)!.push(r);
  }

  const summaries: AnnualFireSummary[] = [];
  const baselineAnnualTotal = records.slice(0, 12).reduce((s, r) => s + r.baselineMean, 0);

  for (const [year, mRecords] of yearMap.entries()) {
    const totalHarmonized = mRecords.reduce((sum, r) => sum + r.harmonizedCount, 0);
    const totalWildfire = mRecords.reduce((sum, r) => sum + r.wildfireCount, 0);
    const totalAnthropogenic = mRecords.reduce((sum, r) => sum + r.anthropogenicCount, 0);

    const hasModis = mRecords.some((r) => r.rawModisCount !== undefined);
    const totalRawModis = hasModis
      ? mRecords.reduce((sum, r) => sum + (r.rawModisCount ?? 0), 0)
      : undefined;

    const hasViirs = mRecords.some((r) => r.rawViirsCount !== undefined);
    const totalRawViirs = hasViirs
      ? mRecords.reduce((sum, r) => sum + (r.rawViirsCount ?? 0), 0)
      : undefined;

    let peakMonth = 1;
    let peakCount = 0;
    for (const r of mRecords) {
      if (r.harmonizedCount > peakCount) {
        peakCount = r.harmonizedCount;
        peakMonth = r.month;
      }
    }

    const annualAnomalyPct = Number(
      (((totalHarmonized - baselineAnnualTotal) / Math.max(1, baselineAnnualTotal)) * 100).toFixed(1)
    );

    summaries.push({
      year,
      totalHarmonized,
      totalRawModis,
      totalRawViirs,
      peakMonth,
      peakMonthCount: peakCount,
      annualAnomalyPct,
      wildfireTotal: totalWildfire,
      anthropogenicTotal: totalAnthropogenic,
    });
  }

  return summaries.sort((a, b) => a.year - b.year);
}

export function calculateHistoricalMedian(records: MonthlyFireRecord[], targetMonth: number): number {
  const monthCounts = records
    .filter((r) => r.month === targetMonth)
    .map((r) => r.harmonizedCount)
    .sort((a, b) => a - b);
  if (monthCounts.length === 0) return 0;
  const mid = Math.floor(monthCounts.length / 2);
  return monthCounts.length % 2 !== 0
    ? monthCounts[mid]
    : Math.round((monthCounts[mid - 1] + monthCounts[mid]) / 2);
}

export function filterRecordsByDateRange(
  records: MonthlyFireRecord[],
  startYM: string,
  endYM: string
): MonthlyFireRecord[] {
  const [startY, startM] = startYM.split('-').map(Number);
  const [endY, endM] = endYM.split('-').map(Number);
  const startDecimal = startY + (startM - 1) / 12;
  const endDecimal = endY + (endM) / 12;

  return records.filter((r) => {
    const rDecimal = r.year + (r.month - 0.5) / 12;
    return rDecimal >= startDecimal && rDecimal <= endDecimal;
  });
}

/**
 * Generates downloadable spatial & temporal hotspot CSV text
 */
export function generateHotspotsCSV(region: FireRegion, records: MonthlyFireRecord[]): string {
  const headers = [
    'Year',
    'Month',
    'Region_ID',
    'Region_Name',
    'Date_YM',
    'Latitude_Center',
    'Longitude_Center',
    'Harmonized_Hotspot_Count',
    'Wildfire_Count',
    'Anthropogenic_Count',
    'Wildfire_Pct',
    'Anthropogenic_Pct',
    'Raw_MODIS_1km_Count',
    'Raw_VIIRS_375m_Count',
    'Mean_FRP_MW',
    'Total_FRE_GJ',
    'Baseline_Mean_2000_2020',
    'Anomaly_Percent',
    'Anomaly_Z_Score',
    'Active_Sensor_Regime',
  ];

  const latCenter = ((region.latMin + region.latMax) / 2).toFixed(4);
  const lonCenter = ((region.lonMin + region.lonMax) / 2).toFixed(4);

  const rows = records.map((r) => {
    const dateYM = `${r.year}-${String(r.month).padStart(2, '0')}`;
    return [
      r.year,
      r.month,
      region.id,
      `"${region.name.replace(/"/g, '""')}"`,
      dateYM,
      latCenter,
      lonCenter,
      r.harmonizedCount,
      r.wildfireCount,
      r.anthropogenicCount,
      r.wildfirePercent,
      r.anthropogenicPercent,
      r.rawModisCount ?? 'NA',
      r.rawViirsCount ?? 'NA',
      r.meanFRP,
      r.totalFRE,
      r.baselineMean,
      r.anomalyPercent,
      r.anomalyZScore,
      r.activeSensor,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export function generateAnalyticsJSON(
  region: FireRegion,
  records: MonthlyFireRecord[],
  dateRange: { start: string; end: string }
): string {
  const filtered = filterRecordsByDateRange(records, dateRange.start, dateRange.end);
  const totalHarmonized = filtered.reduce((acc, r) => acc + r.harmonizedCount, 0);
  const totalModisRaw = filtered.reduce((acc, r) => acc + (r.rawModisCount ?? 0), 0);
  const totalViirsRaw = filtered.reduce((acc, r) => acc + (r.rawViirsCount ?? 0), 0);
  const annualSummaries = calculateAnnualSummaries(filtered);

  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      initiative: 'NASA Space Apps Challenge 2026',
      problemStatement: 'Harmonization of MODIS and VIIRS Active Fire Hotspots',
      areaOfInterest: {
        id: region.id,
        name: region.name,
        country: region.country,
        biome: region.biome,
        bounds: {
          latMin: region.latMin,
          latMax: region.latMax,
          lonMin: region.lonMin,
          lonMax: region.lonMax,
        },
      },
      searchDateRange: dateRange,
    },
    harmonizationAnalytics: {
      totalHotspotsHarmonized: totalHarmonized,
      totalHotspotsRawModis: totalModisRaw,
      totalHotspotsRawViirs: totalViirsRaw,
      reconciliationRatio: totalViirsRaw > 0 ? Number((totalViirsRaw / Math.max(1, totalHarmonized)).toFixed(2)) : 1.0,
      historicalRecordYear: region.historicRecordYear,
      recordYearNote: region.historicRecordNote,
      annualSummaries,
    },
    monthlyTimeSeries: filtered,
  };

  return JSON.stringify(report, null, 2);
}
