import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GLOBAL_FIRE_CLUSTERS,
  DECADE_METADATA,
  FireDecade,
} from './decadeFireHeatmap';

test('Decade Fire Heatmap: defines global clusters with valid coordinates and intensities', () => {
  assert.ok(GLOBAL_FIRE_CLUSTERS.length >= 8);
  for (const c of GLOBAL_FIRE_CLUSTERS) {
    assert.ok(c.lat >= -90 && c.lat <= 90);
    assert.ok(c.lon >= -180 && c.lon <= 180);
    assert.ok(c.intensity['2000s'] >= 0 && c.intensity['2000s'] <= 1.5);
    assert.ok(c.intensity['2010s'] >= 0 && c.intensity['2010s'] <= 1.5);
    assert.ok(c.intensity['2020s'] >= 0 && c.intensity['2020s'] <= 1.5);
  }
});

test('Decade Fire Heatmap: 2020s shows elevated boreal and wetland burning', () => {
  const pantanal = GLOBAL_FIRE_CLUSTERS.find(c => c.id === 'pantanal')!;
  assert.ok(pantanal);
  assert.ok(pantanal.intensity['2020s'] > pantanal.intensity['2000s']);

  const canada = GLOBAL_FIRE_CLUSTERS.find(c => c.id === 'boreal_canada')!;
  assert.ok(canada);
  assert.ok(canada.intensity['2020s'] > canada.intensity['2000s']);
});

test('Decade Fire Heatmap: metadata covers all four decade modes', () => {
  const decades: FireDecade[] = ['2000s', '2010s', '2020s', 'all'];
  for (const d of decades) {
    const meta = DECADE_METADATA[d];
    assert.ok(meta);
    assert.ok(meta.globalAverageIndex > 50);
    assert.ok(meta.dominantEpicenter.length > 5);
  }
});
