import React from 'react';
import { X, Download, ExternalLink, CheckCircle2 } from 'lucide-react';

interface PipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PipelineArchitectureModal: React.FC<PipelineModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const stages = [
    {
      num: '01',
      title: 'Top-of-Atmosphere (TOA) Radiometric Calibration',
      input: 'MODIS L1B (MOD02/MYD02) & VIIRS SDR (VNP02/VJ102)',
      output: 'Calibrated TOA Spectral Radiances / Reflectances',
      detail:
        'Cross-calibration against onboard solar diffusers, lunar viewing maneuvers, and CEOS RadCalNet pseudo-invariant desert sites (Railroad Valley). Re-calibrates Terra post-2020 orbital drift.',
    },
    {
      num: '02',
      title: 'Atmospheric Radiative Transfer & Cloud Masking',
      input: 'TOA Reflectance + MERRA-2 / GEOS-FP Atmospheric Profiles',
      output: 'Surface Reflectance (SR) + QA Flags',
      detail:
        '6S (Second Simulation of a Satellite Signal in the Solar Spectrum) vector radiative transfer code. Corrects for Rayleigh scattering, aerosol optical depth (AOD), water vapor absorption, and thin cirrus detection.',
    },
    {
      num: '03',
      title: 'Directional BRDF Normalization (NBAR)',
      input: 'Directional Surface Reflectance + Viewing Geometry (VZA, SZA, RAA)',
      output: 'Nadir BRDF-Adjusted Reflectance (NBAR) at VZA = 0°, SZA = 45°',
      detail:
        'Applies the RossThick-LiSparse-R (RTLSR) semi-empirical kernel-driven model using a 16-day rolling multi-angle inversion. Computes c-factor ratios to standardize views and eliminate sun-angle drift biases.',
    },
    {
      num: '04',
      title: 'Spectral Band Adjustment Factor (SBAF) Translation',
      input: 'VIIRS NBAR Reflectances',
      output: 'MODIS-Equivalent Harmonized Surface Reflectance',
      detail:
        'Applies hyper-spectral convolution polynomial regressions across 6 key spectral domains (Red, NIR, Blue, Green, SWIR-1, SWIR-2), accounting for VIIRS I1/M5 passband offsets.',
    },
    {
      num: '05',
      title: 'Spatial Bowtie Mitigation & Grid Resampling',
      input: 'Variable-Footprint Observations',
      output: 'Unified 500m / 1km Sinusoidal & 0.05° Climate Modeling Grid (CMG)',
      detail:
        'Point Spread Function (PSF)-weighted area integration replaces nearest-neighbor resampling. Constrains MODIS edge-of-scan bowtie pixel expansion and integrates VIIRS 3:1/2:1 aggregated cells.',
    },
    {
      num: '06',
      title: 'Science Product Generation & Uncertainty Propagation',
      input: 'Harmonized Surface Reflectance Bands',
      output: 'Unified Multi-Decadal CDRs (NDVI, EVI, LST, Burned Area)',
      detail:
        'Generates standard science products with rigorous per-pixel uncertainty metrics, cloud contamination flags, and sensor attribution provenance.',
    },
  ];

  const handleDownloadSpec = () => {
    const specContent = `NASA Space Apps Challenge 2026 - MODIS & VIIRS Harmonization Specification
Document ID: HMV-NASA-SPEC-2026-V1.0
Authors: NASA Earth Science Data Systems (ESDS) / Harmonized MODIS-VIIRS Team
Date: November 2026

1. MISSION OBJECTIVE
Seamless multi-decadal continuity of Moderate Resolution Earth Observation Records (2000-2026+) bridging Terra/Aqua MODIS and Suomi-NPP / NOAA-20 / NOAA-21 VIIRS.

2. RADIOMETRIC HARMONIZATION (SBAF)
- Red Domain: R_MODIS = 0.9824 * R_VIIRS(I1) + 0.0031 (R^2 = 0.992)
- NIR Domain: R_MODIS = 0.9912 * R_VIIRS(I2) + 0.0025 (R^2 = 0.995)
- Blue Domain: R_MODIS = 0.9540 * R_VIIRS(M3) + 0.0068 (R^2 = 0.981)
- Green Domain: R_MODIS = 0.9978 * R_VIIRS(M4) + 0.0008 (R^2 = 0.996)

3. BRDF NORMALIZATION
Model: RossThick-LiSparse-R (RTLSR)
Target Geometry: View Zenith Angle = 0 deg, Solar Zenith Angle = 45 deg, Relative Azimuth = 0 deg.
C-Factor: c = R_model(0, 45, 0) / R_model(VZA, SZA, RAA)

4. SPATIAL RESAMPLING
Projection: Global Sinusoidal Grid (EPSG:6842) / CMG 0.05 degree.
Interpolation: Area-weighted Point Spread Function (PSF) convolution.

5. VERIFICATION TARGETS
Residual Bias: < 0.005 in surface reflectance
NDVI Continuity Discontinuity: < 0.008
Target RMSE: < 0.010 across all non-snow terrestrial surfaces.`;

    const blob = new Blob([specContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'NASA_MODIS_VIIRS_Harmonization_Spec_2026.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#faf7f2] border border-[#e6ded5] rounded-3xl shadow-[0_24px_48px_-12px_rgba(180,160,135,0.4),inset_0_1.5px_0_rgba(255,255,255,0.95)] overflow-hidden flex flex-col text-stone-800">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6ded5] bg-[#ede5da]/80">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight font-display">
              Harmonization Pipeline Architecture (HMV Specification)
            </h2>
            <div className="flex items-center gap-2 text-xs text-stone-600 mt-0.5">
              <span>NASA Earth Science Data Systems</span>
              <span>·</span>
              <span>Terra/Aqua to Suomi-NPP &amp; NOAA-20/21</span>
              <span>·</span>
              <span className="text-blue-700 font-semibold">Challenge 2026</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-stone-500 hover:text-stone-900 rounded-xl hover:bg-white/80 transition-colors border border-transparent hover:border-stone-300"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-700 text-sm">
          {/* Executive Overview */}
          <div className="p-4 bg-white/90 border border-blue-200/80 rounded-2xl shadow-sm space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-800 font-display">
              The Continuity Challenge
            </h3>
            <p className="text-xs leading-relaxed text-stone-600">
              MODIS has provided continuous global observations since 2000 (Terra) and 2002 (Aqua). With both satellites drifting and approaching decommissioning, the VIIRS sensors on Suomi-NPP, NOAA-20, and NOAA-21 ensure operational continuity. However, differences in <strong>Spectral Response Functions (SRF)</strong>, <strong>scan angle pixel footprint growth</strong>, and <strong>BRDF viewing geometry</strong> create systematic data discontinuities. This pipeline harmonizes both archives into a unified, publication-grade Climate Data Record (CDR).
            </p>
          </div>

          {/* Pipeline Flow Stages */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Standard 6-Stage Processing Flow
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {stages.map((st) => (
                <div
                  key={st.num}
                  className="p-3.5 bg-white/80 border border-stone-200 rounded-2xl shadow-sm space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-700">STAGE {st.num}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-900">{st.title}</h4>
                  <div className="text-[11px] font-mono text-stone-600">
                    <span className="text-stone-400">In:</span> {st.input}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-700 font-semibold">
                    <span className="text-stone-400">Out:</span> {st.output}
                  </div>
                  <p className="text-xs text-stone-600 pt-1 leading-relaxed">{st.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Academic Citations & Benchmark Standards */}
          <div className="p-4 bg-[#ede5da]/60 border border-stone-200 rounded-2xl space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 font-display">
              Key Scientific Literature &amp; Methodologies
            </h3>
            <ul className="text-xs text-stone-600 space-y-1.5 list-disc list-inside">
              <li>
                <strong className="text-stone-900">Vermote et al. (2016)</strong>: Toward a Daily Global Harmonized Surface Reflectance (HSR) Product from MODIS and VIIRS. <em>IEEE TGRS</em>.
              </li>
              <li>
                <strong className="text-stone-900">Roy et al. (2016)</strong>: Characterization of Landsat-7 to Landsat-8 and Sentinel-2 BRDF and SBAF spectral adjustment factors. <em>RSE</em>.
              </li>
              <li>
                <strong className="text-stone-900">Wolfe et al. (2013)</strong>: Suomi NPP VIIRS prelaunch and on-orbit geometric calibration and pixel aggregation schemes. <em>JGR Atmospheres</em>.
              </li>
              <li>
                <strong className="text-stone-900">Schaaf et al. (2002)</strong>: First operational BRDF, albedo and nadir reflectance products from MODIS. <em>Remote Sensing of Environment</em>.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e6ded5] bg-[#ede5da]/80">
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span>NASA Space Apps Challenge 2026</span>
            <span>·</span>
            <span className="text-emerald-700 font-bold">Open Science Compliant</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadSpec}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-700 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Download Spec (.txt)
            </button>
            <button
              onClick={onClose}
              className="px-5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-md active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
