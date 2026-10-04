export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export type HoneyType =
  | 'rosemary' // عسل الإكليل - Romarin
  | 'citrus' // عسل الزهر / البرتقال - Oranger / Citrus
  | 'eucalyptus' // عسل الكاليتوس - Eucalyptus
  | 'thyme' // عسل الزعتر - Thym sauvage
  | 'sidr' // عسل السدر - Jujubier / Sidr
  | 'heather_forest' // عسل الغابة وخلنج - Bruyère & Chêne-liège
  | 'wildflower' // عسل متعدد الأزهار - Toutes Fleurs Sauvages
  | 'carob'; // عسل الخروب - Caroubier

export type BioclimaticZone =
  | 'Humid' // Kroumirie (Ain Draham, Tabarka)
  | 'Sub-Humid' // Mogods, Sejnane, Cap Bon Nord
  | 'Semi-Arid Upper' // Dorsale, Zaghouan, Béja, Siliana
  | 'Semi-Arid Lower' // Sahel, Sousse, Kairouan
  | 'Arid' // Steppes du Sud, Sidi Bouzid, Gafsa
  | 'Pre-Saharan'; // Dahar, Tozeur, Tataouine

export interface MelliferousFlora {
  id: string;
  scientificName: string;
  frenchName: string;
  arabicName: string;
  honeyType: HoneyType;
  bloomStartMonth: number; // 1-12
  bloomEndMonth: number; // 1-12
  nectarRating: 1 | 2 | 3 | 4 | 5;
  pollenRating: 1 | 2 | 3 | 4 | 5;
  sugarConcentrationPercent: number; // e.g. 42%
  primaryRegions: string[];
  honeyProfile: {
    color: string;
    taste: string;
    crystallization: string;
    avgPricePerKgTND: number;
  };
  botanicalNotes: string;
}

export interface HarvestSite {
  id: string;
  name: string;
  arabicName: string;
  governorate: string;
  bioclimaticZone: BioclimaticZone;
  lat: number;
  lng: number;
  elevationM: number;
  annualRainfallMm: number;
  avgSpringTempC: number;
  avgSummerTempC: number;
  chehiliDaysPerYear: number;
  windExposureScore: number; // 1 (sheltered valley) - 5 (windswept crest)
  suitabilityScore: number; // 0-100 composite index
  recommendedMaxHives: number;
  waterAccessRadiusKm: number;
  dominantFlora: MelliferousFlora[];
  primaryHoneyOutput: HoneyType;
  secondaryHoneyOutput?: HoneyType;
  peakBloomMonths: number[]; // e.g. [3, 4, 5]
  optimalHarvestWindow: string; // e.g. "20 Avril - 15 Mai"
  terrainDescription: string;
  accessRoadQuality: 'paved' | 'agricultural_track' | 'mountain_path';
}

export interface GovernorateData {
  id: string;
  name: string;
  arabicName: string;
  zone: BioclimaticZone;
  centerLat: number;
  centerLng: number;
  annualRainfallMm: number;
  beekeepersCount: number;
  registeredHives: number;
  primaryFlora: string[];
  dominantHoney: HoneyType;
  suitabilityIndex: number; // 0 - 100
  svgPath: string;
}

export interface HarvestPredictionInput {
  siteId: string;
  hiveCount: number;
  hiveType: 'langstroth' | 'dadant' | 'traditional';
  colonyVigor: 'exceptional' | 'standard' | 'divided';
  rainfallCondition: 'abundant' | 'normal' | 'drought' | 'severe_drought';
  chehiliHeatwaveOccurrence: boolean;
  supplementalWaterProvided: boolean;
  varroaControlStatus: 'treated_certified' | 'standard' | 'untreated';
}

export interface HarvestPredictionResult {
  yieldPerHiveKg: number;
  totalHoneyYieldKg: number;
  waxYieldKg: number;
  propolisYieldKg: number;
  estimatedRevenueTND: number;
  carryingCapacityStress: 'optimal' | 'moderate_competition' | 'overstocked';
  recommendedHarvestDate: string;
  moistureForecastPercent: number;
  factors: {
    floralPotential: number; // positive or negative kg
    rainfallImpact: number;
    thermalWindStress: number;
    colonyManagement: number;
    densityPenalty: number;
  };
}

export interface TranshumanceStop {
  id: string;
  siteId: string;
  siteName: string;
  governorate: string;
  honeyType: HoneyType;
  season: Season;
  arrivalMonth: string;
  departureMonth: string;
  expectedYieldKgPerHive: number;
  distanceFromPreviousKm: number;
}
