import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  HARVEST_SITES,
  latLngToMapCoords,
  mapCoordsToLatLng,
  MELLIFEROUS_FLORA,
  TUNISIA_GOVERNORATES,
} from '../data/tunisiaData';
import { GovernorateData, HarvestSite, HoneyType, Season } from '../types/apiculture';
import {
  Compass,
  Layers,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  RefreshCw,
  Sliders,
  Wind,
} from 'lucide-react';

export type HeatmapMode =
  | 'suitability'
  | 'nectar_density'
  | 'climatic_favorability'
  | 'chehili_risk'
  | 'honey_rosemary'
  | 'honey_citrus'
  | 'honey_eucalyptus'
  | 'honey_thyme'
  | 'honey_sidr'
  | 'honey_heather';

interface TunisiaHeatmapMapProps {
  selectedSite: HarvestSite | null;
  onSelectSite: (site: HarvestSite) => void;
  selectedSeason: Season;
  onSeasonChange: (season: Season) => void;
  transhumanceRouteSites?: HarvestSite[];
  language?: 'fr' | 'ar' | 'en';
}

export const TunisiaHeatmapMap: React.FC<TunisiaHeatmapMapProps> = ({
  selectedSite,
  onSelectSite,
  selectedSeason,
  onSeasonChange,
  transhumanceRouteSites = [],
  language = 'fr',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Map viewport dimensions
  const MAP_WIDTH = 640;
  const MAP_HEIGHT = 880;

  // View state: pan & zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Heatmap layer settings
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('suitability');
  const [heatRadius, setHeatRadius] = useState<number>(45);
  const [heatIntensity, setHeatIntensity] = useState<number>(0.9);
  const [heatOpacity, setHeatOpacity] = useState<number>(0.75);
  const [minSuitabilityFilter, setMinSuitabilityFilter] = useState<number>(50);

  // Layer toggles
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showGovernorates, setShowGovernorates] = useState<boolean>(true);
  const [showSitePins, setShowSitePins] = useState<boolean>(true);
  const [showRainZones, setShowRainZones] = useState<boolean>(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState<boolean>(false);

  // Hover state
  const [hoveredSite, setHoveredSite] = useState<HarvestSite | null>(null);
  const [hoveredGovernorate, setHoveredGovernorate] = useState<GovernorateData | null>(null);
  const [mouseMapPos, setMouseMapPos] = useState<{ x: number; y: number } | null>(null);

  // Custom click analysis position
  const [customPoint, setCustomPoint] = useState<{
    lat: number;
    lng: number;
    suitability: number;
    estimatedRain: number;
  } | null>(null);

  // Compute season flower factor for each site
  const getSiteSeasonWeight = useCallback(
    (site: HarvestSite, mode: HeatmapMode, season: Season): number => {
      // Month map for seasons:
      // Spring: March (3) to May (5)
      // Summer: June (6) to August (8)
      // Autumn: September (9) to November (11)
      // Winter: December (12) to February (2)
      const seasonMonths: Record<Season, number[]> = {
        spring: [3, 4, 5],
        summer: [6, 7, 8],
        autumn: [9, 10, 11],
        winter: [12, 1, 2],
      };

      const months = seasonMonths[season];
      const hasSeasonalBloom = site.peakBloomMonths.some((m) => months.includes(m));

      if (mode.startsWith('honey_')) {
        const targetHoney = mode.replace('honey_', '');
        if (site.primaryHoneyOutput === targetHoney) return 1.0;
        if (site.secondaryHoneyOutput === targetHoney) return 0.55;
        return 0;
      }

      switch (mode) {
        case 'suitability':
          return site.suitabilityScore / 100;
        case 'nectar_density': {
          let score = hasSeasonalBloom ? 0.9 : 0.25;
          if (season === 'spring' && (site.primaryHoneyOutput === 'citrus' || site.primaryHoneyOutput === 'rosemary')) score = 1.0;
          if (season === 'summer' && site.primaryHoneyOutput === 'eucalyptus') score = 0.98;
          if (season === 'autumn' && site.primaryHoneyOutput === 'carob') score = 0.95;
          return score;
        }
        case 'climatic_favorability': {
          const rainScore = Math.min(1.0, site.annualRainfallMm / 700);
          const windPenalty = (site.windExposureScore - 1) * 0.1;
          const chehiliPenalty = (site.chehiliDaysPerYear / 20) * 0.25;
          return Math.max(0.1, rainScore * 0.7 + 0.3 - windPenalty - chehiliPenalty);
        }
        case 'chehili_risk':
          return Math.min(1.0, (site.chehiliDaysPerYear / 16) * 0.9 + (site.avgSummerTempC > 33 ? 0.3 : 0.1));
        default:
          return site.suitabilityScore / 100;
      }
    },
    []
  );

  // Render Heatmap on Canvas using Gaussian radial gradients and color palette mapping
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showHeatmap) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

    // Create offscreen gray alpha accumulator canvas
    const offscreen = document.createElement('canvas');
    offscreen.width = MAP_WIDTH;
    offscreen.height = MAP_HEIGHT;
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    // Filter sites by minimum suitability
    const activeSites = HARVEST_SITES.filter((s) => s.suitabilityScore >= minSuitabilityFilter);

    // Also inject governorate centers as background diffuse nodes
    TUNISIA_GOVERNORATES.forEach((gov) => {
      const coords = latLngToMapCoords(gov.centerLat, gov.centerLng, MAP_WIDTH, MAP_HEIGHT);
      let weight = gov.suitabilityIndex / 100;
      if (heatmapMode === 'chehili_risk') {
        weight = gov.zone === 'Pre-Saharan' || gov.zone === 'Arid' ? 0.9 : 0.2;
      } else if (heatmapMode === 'climatic_favorability') {
        weight = gov.annualRainfallMm / 1000;
      }

      const radius = heatRadius * 1.5;
      const grad = offCtx.createRadialGradient(coords.x, coords.y, 0, coords.x, coords.y, radius);
      grad.addColorStop(0, `rgba(0,0,0,${Math.min(1, weight * 0.25 * heatIntensity)})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(coords.x, coords.y, radius, 0, Math.PI * 2);
      offCtx.fill();
    });

    // Draw high-intensity kernels around real apicultural sites
    activeSites.forEach((site) => {
      const coords = latLngToMapCoords(site.lat, site.lng, MAP_WIDTH, MAP_HEIGHT);
      const weight = getSiteSeasonWeight(site, heatmapMode, selectedSeason);
      if (weight <= 0.05) return;

      const radius = heatRadius;
      const grad = offCtx.createRadialGradient(coords.x, coords.y, 0, coords.x, coords.y, radius);
      const alpha = Math.min(1, weight * 0.7 * heatIntensity);
      grad.addColorStop(0, `rgba(0,0,0,${alpha})`);
      grad.addColorStop(0.5, `rgba(0,0,0,${alpha * 0.45})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      offCtx.fillStyle = grad;
      offCtx.beginPath();
      offCtx.arc(coords.x, coords.y, radius, 0, Math.PI * 2);
      offCtx.fill();
    });

    // Build 256-step color lookup gradient
    const paletteCanvas = document.createElement('canvas');
    paletteCanvas.width = 256;
    paletteCanvas.height = 1;
    const pCtx = paletteCanvas.getContext('2d');
    if (!pCtx) return;

    const pGrad = pCtx.createLinearGradient(0, 0, 256, 0);

    if (heatmapMode === 'chehili_risk') {
      // Risk palette: Pale yellow -> Orange -> Crimson -> Deep Red
      pGrad.addColorStop(0.0, 'rgba(254, 240, 138, 0)');
      pGrad.addColorStop(0.2, 'rgba(253, 224, 71, 0.4)');
      pGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.75)');
      pGrad.addColorStop(0.8, 'rgba(220, 38, 38, 0.9)');
      pGrad.addColorStop(1.0, 'rgba(153, 27, 27, 0.98)');
    } else {
      // Apicultural Suitability & Nectar Palette: Soft Turquoise -> Leaf Green -> Honey Amber -> Deep Warm Saffron
      pGrad.addColorStop(0.0, 'rgba(16, 185, 129, 0)');
      pGrad.addColorStop(0.2, 'rgba(20, 184, 166, 0.35)');
      pGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.65)');
      pGrad.addColorStop(0.65, 'rgba(245, 158, 11, 0.85)');
      pGrad.addColorStop(0.85, 'rgba(234, 88, 12, 0.92)');
      pGrad.addColorStop(1.0, 'rgba(180, 83, 9, 0.98)');
    }

    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 256, 1);
    const paletteData = pCtx.getImageData(0, 0, 256, 1).data;

    // Colorize the offscreen canvas into the main canvas
    const imgData = offCtx.getImageData(0, 0, MAP_WIDTH, MAP_HEIGHT);
    const pixels = imgData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha > 0) {
        const offset = alpha * 4;
        pixels[i] = paletteData[offset];
        pixels[i + 1] = paletteData[offset + 1];
        pixels[i + 2] = paletteData[offset + 2];
        pixels[i + 3] = Math.round(paletteData[offset + 3] * heatOpacity);
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [
    showHeatmap,
    heatmapMode,
    heatRadius,
    heatIntensity,
    heatOpacity,
    minSuitabilityFilter,
    selectedSeason,
    getSiteSeasonWeight,
  ]);

  // Handle pan & drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const localX = (e.clientX - rect.left - pan.x) / zoom;
      const localY = (e.clientY - rect.top - pan.y) / zoom;
      setMouseMapPos({ x: localX, y: localY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click on map to analyze any custom coordinate
  const handleMapClick = (e: React.MouseEvent) => {
    if (isDragging) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const localX = (e.clientX - rect.left - pan.x) / zoom;
      const localY = (e.clientY - rect.top - pan.y) / zoom;

      const { lat, lng } = mapCoordsToLatLng(localX, localY, MAP_WIDTH, MAP_HEIGHT);
      if (lat >= 30.0 && lat <= 37.5 && lng >= 7.5 && lng <= 11.8) {
        // Interpolate estimated rain and suitability based on latitude gradient
        const estimatedRain = Math.max(
          80,
          Math.round(80 + Math.pow((lat - 30.0) / 7.5, 2.1) * 950)
        );
        const suitability = Math.min(
          96,
          Math.max(40, Math.round(35 + ((lat - 30.0) / 7.5) * 55 + (lng > 9.5 ? 8 : 0)))
        );
        setCustomPoint({ lat, lng, suitability, estimatedRain });
      }
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(3.5, z + 0.3));
  const handleZoomOut = () => setZoom((z) => Math.max(0.8, z - 0.3));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCustomPoint(null);
  };

  // Color helper for honey markers
  const getHoneyPinColor = (honey: HoneyType) => {
    switch (honey) {
      case 'citrus':
        return '#f97316'; // orange
      case 'rosemary':
        return '#6366f1'; // indigo/rosemary violet
      case 'eucalyptus':
        return '#0d9488'; // teal
      case 'thyme':
        return '#a855f7'; // purple
      case 'sidr':
        return '#d97706'; // amber
      case 'heather_forest':
        return '#78350f'; // deep brown
      case 'carob':
        return '#854d0e'; // dark yellow
      default:
        return '#10b981'; // emerald
    }
  };

  const getHoneyLabel = (honey: HoneyType) => {
    const item = MELLIFEROUS_FLORA.find((f) => f.honeyType === honey);
    if (!item) return honey;
    if (language === 'ar') return item.arabicName;
    return item.frenchName;
  };

  return (
    <div className="relative w-full h-[720px] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 select-none flex flex-col">
      {/* Top Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 z-20">
        {/* Metric Layer Selectors */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none">
          <button
            onClick={() => setHeatmapMode('suitability')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              heatmapMode === 'suitability'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {language === 'ar' ? 'مؤشر الملاءمة الرعوية' : 'Indice Global Apicole'}
          </button>
          <button
            onClick={() => setHeatmapMode('nectar_density')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              heatmapMode === 'nectar_density'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {language === 'ar' ? 'كثافة التدفق الرحيقي' : 'Densité Miellée'}
          </button>
          <button
            onClick={() => setHeatmapMode('climatic_favorability')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              heatmapMode === 'climatic_favorability'
                ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {language === 'ar' ? 'الملاءمة المناخية والأمطار' : 'Climat & Pluviométrie'}
          </button>
          <button
            onClick={() => setHeatmapMode('chehili_risk')}
            className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
              heatmapMode === 'chehili_risk'
                ? 'bg-rose-500 text-white font-semibold shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {language === 'ar' ? 'خطر رياح الشهيلي' : 'Risque Chehili / Canicule'}
          </button>
        </div>

        {/* Seasonal Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700">
          {(
            [
              { key: 'spring', fr: 'Printemps', ar: 'الربيع' },
              { key: 'summer', fr: 'Été', ar: 'الصيف' },
              { key: 'autumn', fr: 'Automne', ar: 'الخريف' },
              { key: 'winter', fr: 'Hiver', ar: 'الشتاء' },
            ] as const
          ).map((s) => (
            <button
              key={s.key}
              onClick={() => onSeasonChange(s.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                selectedSeason === s.key
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {language === 'ar' ? s.ar : s.fr}
            </button>
          ))}
        </div>

        {/* Controls Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowControlsDrawer((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md border transition-colors ${
              showControlsDrawer
                ? 'bg-slate-700 text-white border-slate-600'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'ضبط المعايير' : 'Calibrage'}</span>
          </button>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleMapClick}
        className="relative flex-1 cursor-grab active:cursor-grabbing overflow-hidden bg-slate-950 flex items-center justify-center"
      >
        {/* Transformable Canvas & SVG Container */}
        <div
          style={{
            width: `${MAP_WIDTH}px`,
            height: `${MAP_HEIGHT}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
          className="relative pointer-events-auto"
        >
          {/* Base SVG Map of Tunisia with Governorates */}
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            className="absolute inset-0 w-full h-full pointer-events-auto"
          >
            <defs>
              <linearGradient id="tunisiaLandGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="45%" stopColor="#1e293b" />
                <stop offset="75%" stopColor="#1c2536" />
                <stop offset="100%" stopColor="#141a29" />
              </linearGradient>

              {/* Mediterranean Sea Pattern */}
              <pattern id="seaGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <circle cx="15" cy="15" r="0.6" fill="#334155" opacity="0.3" />
              </pattern>
            </defs>

            {/* Sea Grid Background */}
            <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#seaGrid)" opacity="0.4" />

            {/* Approximate Silhouette of Tunisia Territory */}
            <path
              d="
                M 120 40
                Q 200 15 320 25
                C 390 28 430 40 450 75
                C 490 85 530 110 520 160
                C 510 190 480 210 470 240
                C 475 270 510 290 525 325
                C 545 370 520 420 480 470
                C 460 500 480 540 505 570
                C 525 595 500 630 460 670
                C 420 720 370 780 340 850
                C 320 840 280 770 260 710
                C 245 660 210 610 170 560
                C 140 510 110 440 100 370
                C 95 310 90 250 85 190
                C 80 140 95 90 120 40
                Z
              "
              fill="url(#tunisiaLandGradient)"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Chott El Djerid Salt Lake Basin Depiction */}
            <ellipse
              cx="190"
              cy="530"
              rx="65"
              ry="25"
              fill="#0f172a"
              stroke="#475569"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              opacity="0.6"
            />
            <text x="190" y="534" textAnchor="middle" fill="#64748b" fontSize="8" letterSpacing="1">
              CHOTT EL DJERID
            </text>

            {/* Governorates Boundary Polygons */}
            {showGovernorates &&
              TUNISIA_GOVERNORATES.map((gov) => {
                const coords = latLngToMapCoords(gov.centerLat, gov.centerLng, MAP_WIDTH, MAP_HEIGHT);
                const isHovered = hoveredGovernorate?.id === gov.id;
                return (
                  <g
                    key={gov.id}
                    onMouseEnter={() => setHoveredGovernorate(gov)}
                    onMouseLeave={() => setHoveredGovernorate(null)}
                    className="cursor-pointer"
                  >
                    {/* Centroid indicator circle */}
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={isHovered ? 7 : 4}
                      fill={isHovered ? '#fbbf24' : '#475569'}
                      opacity={isHovered ? 0.9 : 0.4}
                      stroke="#0f172a"
                      strokeWidth="1"
                    />

                    {/* Governorate Name Label */}
                    <text
                      x={coords.x}
                      y={coords.y + 12}
                      textAnchor="middle"
                      fill={isHovered ? '#fbbf24' : '#94a3b8'}
                      fontSize={isHovered ? 9.5 : 8}
                      fontWeight={isHovered ? '600' : '400'}
                      className="transition-all select-none pointer-events-none drop-shadow"
                    >
                      {language === 'ar' ? gov.arabicName : gov.name}
                    </text>
                  </g>
                );
              })}

            {/* Climatic Isohyet Lines (Rainfall) */}
            {showRainZones && (
              <g opacity="0.65" strokeDasharray="4 4" strokeWidth="1.2">
                {/* 800mm isohyet north (Kroumirie) */}
                <path d="M 90 90 Q 200 80 340 120" stroke="#38bdf8" fill="none" />
                <text x="345" y="122" fill="#38bdf8" fontSize="8">
                  800 mm
                </text>

                {/* 400mm isohyet (Dorsale / Zaghouan) */}
                <path d="M 85 240 Q 260 230 460 270" stroke="#fbbf24" fill="none" />
                <text x="465" y="272" fill="#fbbf24" fontSize="8">
                  400 mm
                </text>

                {/* 200mm isohyet (Pre-Sahara) */}
                <path d="M 100 480 Q 280 460 490 510" stroke="#f87171" fill="none" />
                <text x="495" y="512" fill="#f87171" fontSize="8">
                  200 mm
                </text>
              </g>
            )}

            {/* Transhumance Circuit Lines if Active */}
            {transhumanceRouteSites.length > 1 && (
              <g>
                {transhumanceRouteSites.map((site, index) => {
                  if (index === 0) return null;
                  const prev = transhumanceRouteSites[index - 1];
                  const p1 = latLngToMapCoords(prev.lat, prev.lng, MAP_WIDTH, MAP_HEIGHT);
                  const p2 = latLngToMapCoords(site.lat, site.lng, MAP_WIDTH, MAP_HEIGHT);
                  return (
                    <g key={`leg-${index}`}>
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                        className="animate-pulse"
                      />
                      <circle
                        cx={(p1.x + p2.x) / 2}
                        cy={(p1.y + p2.y) / 2}
                        r="3"
                        fill="#f59e0b"
                      />
                    </g>
                  );
                })}
              </g>
            )}
          </svg>

          {/* HTML5 Heatmap Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            className="absolute inset-0 pointer-events-none"
            style={{ mixBlendMode: 'screen' }}
          />

          {/* Harvest Site Interactive Pins */}
          {showSitePins &&
            HARVEST_SITES.map((site) => {
              const coords = latLngToMapCoords(site.lat, site.lng, MAP_WIDTH, MAP_HEIGHT);
              const isSelected = selectedSite?.id === site.id;
              const isHovered = hoveredSite?.id === site.id;
              const pinColor = getHoneyPinColor(site.primaryHoneyOutput);

              return (
                <div
                  key={site.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSite(site);
                  }}
                  onMouseEnter={() => setHoveredSite(site)}
                  onMouseLeave={() => setHoveredSite(null)}
                  style={{
                    left: `${coords.x}px`,
                    top: `${coords.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute cursor-pointer transition-transform duration-150 z-10"
                >
                  {/* Ripple pulse on selected site */}
                  {isSelected && (
                    <div
                      style={{ borderColor: pinColor }}
                      className="absolute -inset-2.5 rounded-full border-2 animate-ping pointer-events-none"
                    />
                  )}

                  {/* Pin Dot */}
                  <div
                    style={{
                      backgroundColor: pinColor,
                      boxShadow: isSelected
                        ? `0 0 16px ${pinColor}, 0 0 4px white`
                        : isHovered
                        ? `0 0 10px ${pinColor}`
                        : '0 2px 5px rgba(0,0,0,0.5)',
                    }}
                    className={`rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'w-6 h-6 border-2 border-white'
                        : isHovered
                        ? 'w-5 h-5 border border-white'
                        : 'w-3.5 h-3.5 border border-slate-900/60'
                    }`}
                  >
                    {isSelected && <span className="w-2 h-2 bg-white rounded-full" />}
                  </div>

                  {/* Compact Title Tag */}
                  {(isSelected || isHovered) && (
                    <div className="absolute left-1/2 -top-7 -translate-x-1/2 whitespace-nowrap bg-slate-900/95 text-slate-100 text-[11px] font-medium px-2 py-0.5 rounded shadow-lg border border-slate-700 pointer-events-none">
                      {language === 'ar' ? site.arabicName : site.name}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Custom Point Marker if clicked outside presets */}
          {customPoint && (
            <div
              style={{
                left: `${latLngToMapCoords(customPoint.lat, customPoint.lng, MAP_WIDTH, MAP_HEIGHT).x}px`,
                top: `${latLngToMapCoords(customPoint.lat, customPoint.lng, MAP_WIDTH, MAP_HEIGHT).y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-10 pointer-events-none"
            >
              <div className="w-5 h-5 rounded-full border-2 border-amber-400 bg-amber-500/30 flex items-center justify-center animate-bounce">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
              </div>
            </div>
          )}
        </div>

        {/* Hover Inspector Tooltip (pinned to bottom-left) */}
        {hoveredSite && (
          <div className="absolute bottom-4 left-4 max-w-sm bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg p-3 text-slate-200 shadow-xl z-20 pointer-events-none">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h4 className="font-semibold text-sm text-amber-400">
                {language === 'ar' ? hoveredSite.arabicName : hoveredSite.name}
              </h4>
              <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">
                {hoveredSite.suitabilityScore}/100
              </span>
            </div>

            <div className="text-xs text-slate-400 space-y-0.5">
              <div className="flex items-center justify-between">
                <span>Gouvernorat :</span>
                <span className="text-slate-200 font-medium">{hoveredSite.governorate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Miel Principal :</span>
                <span className="text-amber-300 font-medium">
                  {getHoneyLabel(hoveredSite.primaryHoneyOutput)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pluviométrie & Altitude :</span>
                <span className="font-mono tabular-nums text-slate-300">
                  {hoveredSite.annualRainfallMm} mm · {hoveredSite.elevationM} m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Fenêtre de Récolte :</span>
                <span className="text-emerald-400">{hoveredSite.optimalHarvestWindow}</span>
              </div>
            </div>
          </div>
        )}

        {/* Custom GPS inspection banner if clicked */}
        {customPoint && !hoveredSite && (
          <div className="absolute bottom-4 left-4 max-w-xs bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-lg p-3 text-slate-200 shadow-xl z-20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-amber-400">
                {language === 'ar' ? 'تحليل النقطة الجغرافية' : 'Point Cartographique'}
              </span>
              <button
                onClick={() => setCustomPoint(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-0.5 font-mono tabular-nums">
              <div>GPS: {customPoint.lat.toFixed(3)}°N, {customPoint.lng.toFixed(3)}°E</div>
              <div>Pluie estimée: {customPoint.estimatedRain} mm / an</div>
              <div>Médiation pastorale: {customPoint.suitability}/100</div>
            </div>
          </div>
        )}

        {/* Map Viewport Navigation Controls */}
        <div className="absolute right-4 bottom-4 flex flex-col gap-1.5 z-20">
          <button
            onClick={handleZoomIn}
            aria-label="Zoom in"
            className="w-8 h-8 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 shadow"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            aria-label="Zoom out"
            className="w-8 h-8 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 shadow"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            aria-label="Reset view"
            className="w-8 h-8 rounded bg-slate-800/90 hover:bg-slate-700 text-slate-200 flex items-center justify-center border border-slate-700 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Compass Rose */}
        <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 border border-slate-800 text-slate-400 text-[10px] font-mono z-10">
          <Compass className="w-3.5 h-3.5 text-amber-500" />
          <span>NORD</span>
        </div>

        {/* Heatmap Legend */}
        <div className="absolute top-4 left-4 bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-xs text-slate-300 z-10">
          <div className="text-[11px] font-medium text-slate-400 mb-1">
            {heatmapMode === 'chehili_risk'
              ? 'Échelle Risque Chehili'
              : language === 'ar'
              ? 'مقياس جودة المرعى'
              : 'Potentiel Mellifère'}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400">Faible</span>
            <div
              className={`h-2 w-28 rounded ${
                heatmapMode === 'chehili_risk'
                  ? 'bg-gradient-to-r from-yellow-300 via-orange-500 to-red-700'
                  : 'bg-gradient-to-r from-emerald-600 via-amber-400 to-red-600'
              }`}
            />
            <span className="text-[10px] text-slate-400">Optimal</span>
          </div>
        </div>
      </div>

      {/* Slide-out Calibrator Drawer */}
      {showControlsDrawer && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 z-20 text-xs">
          {/* Layer toggles */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-300">Couches Cartographiques</span>
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Heatmap Dynamique</span>
              </label>
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSitePins}
                  onChange={(e) => setShowSitePins(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Ruchers & Stations ({HARVEST_SITES.length})</span>
              </label>
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRainZones}
                  onChange={(e) => setShowRainZones(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                />
                <span>Isohyètes Pluviométriques</span>
              </label>
            </div>
          </div>

          {/* Heat Radius */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Rayon de Diffusion</span>
              <span className="font-mono tabular-nums">{heatRadius} px</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={heatRadius}
              onChange={(e) => setHeatRadius(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Heat Intensity */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Intensité Thermique</span>
              <span className="font-mono tabular-nums">{Math.round(heatIntensity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="2.0"
              step="0.1"
              value={heatIntensity}
              onChange={(e) => setHeatIntensity(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          {/* Min Suitability Threshold */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Seuil Minimal d’Indice</span>
              <span className="font-mono tabular-nums">{minSuitabilityFilter} / 100</span>
            </div>
            <input
              type="range"
              min="40"
              max="90"
              value={minSuitabilityFilter}
              onChange={(e) => setMinSuitabilityFilter(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
