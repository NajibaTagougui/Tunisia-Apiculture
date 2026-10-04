import React, { useState } from 'react';
import { calculatePredictedYield, HARVEST_SITES, MELLIFEROUS_FLORA } from '../data/tunisiaData';
import { HarvestSite } from '../types/apiculture';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Droplets,
  HelpCircle,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface YieldPredictorProps {
  selectedSite: HarvestSite;
  onSelectSite: (site: HarvestSite) => void;
  onRequestAiConsultation: (params: {
    site: HarvestSite;
    hiveCount: number;
    predictedYieldKg: number;
  }) => void;
  language?: 'fr' | 'ar' | 'en';
}

export const YieldPredictor: React.FC<YieldPredictorProps> = ({
  selectedSite,
  onSelectSite,
  onRequestAiConsultation,
  language = 'fr',
}) => {
  // Input parameters
  const [hiveCount, setHiveCount] = useState<number>(60);
  const [colonyVigor, setColonyVigor] = useState<'exceptional' | 'standard' | 'divided'>('standard');
  const [rainfallCondition, setRainfallCondition] = useState<
    'abundant' | 'normal' | 'drought' | 'severe_drought'
  >('normal');
  const [chehiliOccurrence, setChehiliOccurrence] = useState<boolean>(false);
  const [waterStationProvided, setWaterStationProvided] = useState<boolean>(true);
  const [varroaTreated, setVarroaTreated] = useState<'treated_certified' | 'standard' | 'untreated'>(
    'standard'
  );

  // Compute prediction
  const result = calculatePredictedYield(
    selectedSite,
    hiveCount,
    rainfallCondition,
    colonyVigor,
    chehiliOccurrence,
    waterStationProvided,
    varroaTreated
  );

  const dominantFloraItem = MELLIFEROUS_FLORA.find(
    (f) => f.honeyType === selectedSite.primaryHoneyOutput
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs text-amber-500 font-semibold tracking-wide uppercase">
            {language === 'ar' ? 'نموذج التنبؤ بالإنتاج' : 'Simulateur Agronomique de Rendement'}
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {language === 'ar'
              ? `تقدير إنتاج عسل ${dominantFloraItem?.arabicName || ''}`
              : `Prédiction de Récolte · ${selectedSite.name}`}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'حساب الإنتاجية بالاعتماد على التنوع النباتي المحلي، الرطوبة، والضغط الحراري لرياح الشهيلي'
              : 'Basé sur les coefficients de nectarification et la capacité biotique de charge pastorale.'}
          </p>
        </div>

        {/* Site Picker Shortcut */}
        <div className="flex items-center gap-2">
          <label htmlFor="harvest-site-select" className="text-xs text-slate-400">Station :</label>
          <select
            id="harvest-site-select"
            value={selectedSite.id}
            onChange={(e) => {
              const site = HARVEST_SITES.find((s) => s.id === e.target.value);
              if (site) onSelectSite(site);
            }}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
          >
            {HARVEST_SITES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.governorate})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Controls Left (40%), Forecast Analytics Right (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left Column: Simulation Controls */}
        <div className="lg:col-span-5 space-y-5 bg-slate-950/60 p-5 rounded-lg border border-slate-800/80">
          <h3 className="text-sm font-semibold text-slate-300">
            {language === 'ar' ? 'معايير المنحل والموسم' : 'Paramètres du Rucher & Conditions'}
          </h3>

          {/* Number of Hives Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {language === 'ar' ? 'عدد الخلايا (Langstroth)' : 'Taille du Rucher (Ruches Langstroth)'}
              </span>
              <span className="font-mono text-amber-400 font-semibold text-sm tabular-nums">
                {hiveCount} {language === 'ar' ? 'خلية' : 'ruches'}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="350"
              step="5"
              value={hiveCount}
              onChange={(e) => setHiveCount(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>10 ruches</span>
              <span>
                Capacité max recommandée: {selectedSite.recommendedMaxHives} ruches
              </span>
            </div>
          </div>

          {/* Pluviometric Condition */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400">
              {language === 'ar' ? 'الحالة المطرية الشتوية السابقة' : 'Pluviométrie Hivernale Cumulée'}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'abundant', label: 'Abondante (+25%)', ar: 'ممطرة جداً (+25%)' },
                { key: 'normal', label: 'Normale / Moyenne', ar: 'عادية متوازنة' },
                { key: 'drought', label: 'Sécheresse (-30%)', ar: 'جفاف خفيف (-30%)' },
                { key: 'severe_drought', label: 'Déficit Critique (-60%)', ar: 'جفاف حاد (-60%)' },
              ].map((c) => (
                <button
                  key={c.key}
                  onClick={() => setRainfallCondition(c.key as typeof rainfallCondition)}
                  className={`px-2.5 py-1.5 text-xs rounded-md border text-left transition-colors ${
                    rainfallCondition === c.key
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-medium'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {language === 'ar' ? c.ar : c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colony Strength & Queen Vigor */}
          <div className="space-y-1.5">
            <span className="text-xs text-slate-400">
              {language === 'ar' ? 'قوة الطائفة وعمر الملكة' : 'Vigueur des Colonies & Âge de la Reine'}
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { key: 'exceptional', label: 'Reine 1 an (Élite)', ar: 'ملكة شابة قوية' },
                { key: 'standard', label: 'Standard (2 ans)', ar: 'متوسطة (سنتين)' },
                { key: 'divided', label: 'Essaim divisé', ar: 'طرود حديثة التقسيم' },
              ].map((v) => (
                <button
                  key={v.key}
                  onClick={() => setColonyVigor(v.key as typeof colonyVigor)}
                  className={`px-2 py-1.5 text-[11px] rounded-md border text-center transition-colors ${
                    colonyVigor === v.key
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 font-medium'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {language === 'ar' ? v.ar : v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Climatic Stress & Field Management */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>{language === 'ar' ? 'موجة حرارة / رياح شهيلي خلال الإزهار' : 'Épisode de Sirocco / Chehili pendant floraison'}</span>
              <input
                type="checkbox"
                checked={chehiliOccurrence}
                onChange={(e) => setChehiliOccurrence(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>{language === 'ar' ? 'توفير نقطة ماء عذب ومظلل بالمنحل' : 'Abreuvoir d’eau fraîche installé (<100m)'}</span>
              <input
                type="checkbox"
                checked={waterStationProvided}
                onChange={(e) => setWaterStationProvided(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
              />
            </label>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Traitement Varroa :</span>
              <select
                value={varroaTreated}
                onChange={(e) => setVarroaTreated(e.target.value as typeof varroaTreated)}
                className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded px-2 py-1"
              >
                <option value="treated_certified">Traité certifié bio/acide oxalique</option>
                <option value="standard">Standard d’automne</option>
                <option value="untreated">Non traité récent</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Predictive Results & Revenue Metrics */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          {/* Top Big Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Yield per Hive */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Rendement / Ruche</span>
                <Scale className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
                {result.yieldPerHiveKg}{' '}
                <span className="text-xs font-sans font-normal text-slate-400">kg/ruche</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Potentiel station : {result.factors.basePotential} kg
              </div>
            </div>

            {/* Total Honey Yield */}
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Production Totale</span>
                <Droplets className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-2">
                {result.totalHoneyYieldKg.toLocaleString()}{' '}
                <span className="text-xs font-sans font-normal text-slate-400">kg</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Cire : {result.waxYieldKg} kg · Propolis : {result.propolisYieldKg} kg
              </div>
            </div>

            {/* Total Revenue in TND */}
            <div className="bg-slate-950 p-4 rounded-lg border border-amber-500/30">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Revenu Brut Estimé</span>
                <Award className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-2">
                {result.estimatedRevenueTND.toLocaleString()}{' '}
                <span className="text-xs font-sans font-normal text-slate-400">TND</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Cours moyen : {result.pricePerKgTND} TND/kg
              </div>
            </div>
          </div>

          {/* Carrying Capacity Alert Indicator */}
          <div
            className={`p-3.5 rounded-lg border flex items-start gap-3 ${
              result.carryingCapacityStress === 'optimal'
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                : result.carryingCapacityStress === 'moderate_competition'
                ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
            }`}
          >
            {result.carryingCapacityStress === 'optimal' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-semibold">
                {result.carryingCapacityStress === 'optimal'
                  ? 'Capacité de Charge Optimale'
                  : result.carryingCapacityStress === 'moderate_competition'
                  ? 'Concurrence Pastorale Modérée'
                  : 'Surcharge Pastorale Détectée'}
              </div>
              <div className="text-slate-300 mt-0.5 leading-relaxed">
                {result.carryingCapacityStress === 'optimal'
                  ? `Avec ${hiveCount} ruches, la densité reste en-deçà du seuil critique (${selectedSite.recommendedMaxHives} ruches). Chaque colonie dispose d'un rayon de butinage sans compétition stérile.`
                  : result.carryingCapacityStress === 'moderate_competition'
                  ? `La taille de votre rucher approche la capacité florale du terroir. Les butineuses devront voler plus loin (+600 m), réduisant légèrement le rendement moyen.`
                  : `Attention : ${hiveCount} ruches dépasse significativement le seuil durable de cette zone (${selectedSite.recommendedMaxHives} max). Risque de pillage, de carence pollinique et de baisse de 32% du miel par ruche.`}
              </div>
            </div>
          </div>

          {/* Sensitivity Impact Factors Table */}
          <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 text-xs">
            <div className="font-semibold text-slate-300 mb-2">
              Décomposition des Facteurs de Rendement
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400 block">Impact Pluie</span>
                <span
                  className={`font-mono font-semibold ${
                    result.factors.rainImpactPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {result.factors.rainImpactPct > 0 ? '+' : ''}
                  {result.factors.rainImpactPct}%
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400 block">Vigueur Reine</span>
                <span
                  className={`font-mono font-semibold ${
                    result.factors.vigorImpactPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {result.factors.vigorImpactPct > 0 ? '+' : ''}
                  {result.factors.vigorImpactPct}%
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400 block">Stress Chehili</span>
                <span
                  className={`font-mono font-semibold ${
                    result.factors.thermalStressPct >= 0 ? 'text-slate-300' : 'text-rose-400'
                  }`}
                >
                  {result.factors.thermalStressPct}%
                </span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800/80">
                <span className="text-slate-400 block">Concurrence</span>
                <span
                  className={`font-mono font-semibold ${
                    result.factors.densityPenaltyPct >= 0 ? 'text-slate-300' : 'text-amber-400'
                  }`}
                >
                  {result.factors.densityPenaltyPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Action Button: AI Agronomist Consultation */}
          <div className="pt-2">
            <button
              onClick={() =>
                onRequestAiConsultation({
                  site: selectedSite,
                  hiveCount,
                  predictedYieldKg: result.yieldPerHiveKg,
                })
              }
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-lg shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {language === 'ar'
                  ? 'طلب استشارة الخبير الزراعي الذكي لهذه المحطة'
                  : 'Générer l’Avis Agronomique Intelligent pour cette Station'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
