import React, { useState } from 'react';
import { HARVEST_SITES, MELLIFEROUS_FLORA } from '../data/tunisiaData';
import { HarvestSite, HoneyType, Season } from '../types/apiculture';
import {
  ArrowRight,
  Calendar,
  Check,
  Fuel,
  Info,
  MapPin,
  Moon,
  Plus,
  Route,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from 'lucide-react';

interface TranshumancePlannerProps {
  currentCircuit: HarvestSite[];
  onChangeCircuit: (sites: HarvestSite[]) => void;
  onSelectStationToInspect: (site: HarvestSite) => void;
  language?: 'fr' | 'ar' | 'en';
}

// Preset recommended circuits practiced by experienced Tunisian beekeepers
const PRESET_CIRCUITS: {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  siteIds: string[];
}[] = [
  {
    id: 'grand_nord_dorsale',
    name: 'Circuit d’Excellence · Cap Bon, Zaghouan & Kroumirie',
    arabicName: 'مسار الامتياز: الوطن القبلي، زغوان وخمير',
    description:
      'Le circuit roi en Tunisie : débute au Cap Bon (Zhar), monte à Zaghouan (Romarin), puis bascule à Tabarka (Eucalyptus).',
    siteIds: [
      'site_beni_khiar_citrus',
      'site_zaghouan_djebel',
      'site_tabarka_coastal_eucalyptus',
    ],
  },
  {
    id: 'terroir_medicinal',
    name: 'Circuit Miels Rares & Monofloraux · Thym, Romarin & Sidr',
    arabicName: 'مسار الأعسال العلاجية النادرة: زعتر، إكليل وسدر',
    description:
      'Axé sur les miels à forte valeur marchande (85 - 95 TND/kg). Massifs de Zaghouan, crêtes de Bargou puis plaines de Regueb.',
    siteIds: [
      'site_zaghouan_djebel',
      'site_djebel_bargou_thyme',
      'site_regueb_sidr',
    ],
  },
  {
    id: 'forestier_humide',
    name: 'Circuit Humide & Sous-Bois · Ain Draham & Mogods',
    arabicName: 'مسار الغابات الرطبة: عين دراهم ونفزة وسجنان',
    description:
      'Pour les colonies vigoureuses : bruyère de printemps, fleurs sauvages de Nefza et eucalyptus estival.',
    siteIds: [
      'site_ain_draham_forest',
      'site_nefza_valleys',
      'site_sejnane_peatland',
    ],
  },
];

export const TranshumancePlanner: React.FC<TranshumancePlannerProps> = ({
  currentCircuit,
  onChangeCircuit,
  onSelectStationToInspect,
  language = 'fr',
}) => {
  const [hiveFleetSize, setHiveFleetSize] = useState<number>(80);

  // Apply a preset
  const handleApplyPreset = (siteIds: string[]) => {
    const sites = siteIds
      .map((id) => HARVEST_SITES.find((s) => s.id === id))
      .filter((s): s is HarvestSite => Boolean(s));
    onChangeCircuit(sites);
  };

  // Add a stop to the circuit
  const handleAddStop = (siteId: string) => {
    const site = HARVEST_SITES.find((s) => s.id === siteId);
    if (!site) return;
    if (currentCircuit.some((s) => s.id === site.id)) return;
    onChangeCircuit([...currentCircuit, site]);
  };

  // Remove a stop
  const handleRemoveStop = (siteId: string) => {
    onChangeCircuit(currentCircuit.filter((s) => s.id !== siteId));
  };

  // Move stop up or down
  const handleMoveStop = (index: number, direction: 'up' | 'down') => {
    const newCircuit = [...currentCircuit];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCircuit.length) return;
    const temp = newCircuit[index];
    newCircuit[index] = newCircuit[targetIndex];
    newCircuit[targetIndex] = temp;
    onChangeCircuit(newCircuit);
  };

  // Calculate distances & yields
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  let totalDistanceKm = 0;
  for (let i = 1; i < currentCircuit.length; i++) {
    totalDistanceKm += calculateDistanceKm(
      currentCircuit[i - 1].lat,
      currentCircuit[i - 1].lng,
      currentCircuit[i].lat,
      currentCircuit[i].lng
    );
  }

  // Estimated combined yields
  const cumulativeKgPerHive = currentCircuit.reduce((acc, site) => {
    let stopKg = 15;
    if (site.primaryHoneyOutput === 'citrus') stopKg = 22;
    else if (site.primaryHoneyOutput === 'eucalyptus') stopKg = 18;
    else if (site.primaryHoneyOutput === 'rosemary') stopKg = 16;
    else if (site.primaryHoneyOutput === 'thyme') stopKg = 12;
    else if (site.primaryHoneyOutput === 'sidr') stopKg = 13;
    else if (site.primaryHoneyOutput === 'heather_forest') stopKg = 17;
    return acc + stopKg;
  }, 0);

  const totalCumulativeBatchKg = Math.round(cumulativeKgPerHive * hiveFleetSize);

  // Estimated revenue
  const totalCumulativeRevenueTND = currentCircuit.reduce((acc, site) => {
    const flora = MELLIFEROUS_FLORA.find((f) => f.honeyType === site.primaryHoneyOutput);
    const price = flora?.honeyProfile.avgPricePerKgTND || 50;
    let stopKg = 15;
    if (site.primaryHoneyOutput === 'citrus') stopKg = 22;
    else if (site.primaryHoneyOutput === 'eucalyptus') stopKg = 18;
    else if (site.primaryHoneyOutput === 'rosemary') stopKg = 16;
    else if (site.primaryHoneyOutput === 'thyme') stopKg = 12;
    else if (site.primaryHoneyOutput === 'sidr') stopKg = 13;
    else if (site.primaryHoneyOutput === 'heather_forest') stopKg = 17;
    return acc + stopKg * hiveFleetSize * price;
  }, 0);

  // Available sites not yet in circuit
  const availableSites = HARVEST_SITES.filter(
    (site) => !currentCircuit.some((s) => s.id === site.id)
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs text-amber-500 font-semibold tracking-wide uppercase">
            {language === 'ar' ? 'مخطط الترحال الرعوي للمناحل' : 'Logistique Pastorale & Transhumance'}
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {language === 'ar'
              ? 'تخطيط مسارات تنقل المناحل عبر الفصول في تونس'
              : 'Planificateur de Circuits de Transhumance Pastorale'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'تتيح حركة المناحل المدروسة مضاعفة الإنتاج 3 مرات مقارنة بالمناحل الثابتة.'
              : 'Enchaînez 2 à 4 miellées successives pour maximiser le potentiel de chaque colonie.'}
          </p>
        </div>

        {/* Fleet size input */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
          <label htmlFor="fleet-size-input" className="text-xs text-slate-400">Cheptel à transporter :</label>
          <input
            id="fleet-size-input"
            type="number"
            min="10"
            max="400"
            step="10"
            value={hiveFleetSize}
            onChange={(e) => setHiveFleetSize(Math.max(10, Number(e.target.value)))}
            className="w-16 bg-slate-900 border border-slate-700 text-xs font-mono font-semibold text-amber-400 rounded px-2 py-1 text-center"
          />
          <span className="text-xs text-slate-400">ruches</span>
        </div>
      </div>

      {/* Preset Circuits Selection */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400">
          {language === 'ar' ? 'المسارات الكلاسيكية الموصى بها :' : 'Circuits Éprouvés & Recommandés :'}
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESET_CIRCUITS.map((p) => {
            const isMatch =
              p.siteIds.length === currentCircuit.length &&
              p.siteIds.every((id, idx) => currentCircuit[idx]?.id === id);

            return (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p.siteIds)}
                className={`p-3.5 rounded-lg border text-left transition-all ${
                  isMatch
                    ? 'bg-amber-500/10 border-amber-500 text-white shadow-sm'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-xs text-amber-300">
                    {language === 'ar' ? p.arabicName : p.name}
                  </span>
                  {isMatch && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Circuit Stops Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            Étapes du Circuit Actif ({currentCircuit.length} stations)
          </span>
          <span className="text-[11px]">
            Astuce : Les lignes du circuit apparaissent automatiquement sur la carte interactive.
          </span>
        </div>

        {currentCircuit.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-lg border border-dashed border-slate-800 text-slate-500 text-xs">
            Aucune station sélectionnée. Choisissez un circuit prédéfini ci-dessus ou ajoutez des stations.
          </div>
        ) : (
          <div className="space-y-2">
            {currentCircuit.map((site, index) => {
              const flora = MELLIFEROUS_FLORA.find((f) => f.honeyType === site.primaryHoneyOutput);
              const legDist =
                index > 0
                  ? calculateDistanceKm(
                      currentCircuit[index - 1].lat,
                      currentCircuit[index - 1].lng,
                      site.lat,
                      site.lng
                    )
                  : 0;

              return (
                <div
                  key={site.id}
                  className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  {/* Step Index & Site Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                      {index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectStationToInspect(site)}
                          className="font-semibold text-slate-200 hover:text-amber-400 transition-colors text-left"
                        >
                          {language === 'ar' ? site.arabicName : site.name}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({site.governorate})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="text-amber-300">
                          {language === 'ar' ? flora?.arabicName : flora?.frenchName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Fenêtre : {site.optimalHarvestWindow}</span>
                        {index > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-sky-400 font-mono">+{legDist} km</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Reorder / Remove) */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveStop(index, 'up')}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded text-[10px]"
                    >
                      ▲
                    </button>
                    <button
                      disabled={index === currentCircuit.length - 1}
                      onClick={() => handleMoveStop(index, 'down')}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 rounded text-[10px]"
                    >
                      ▼
                    </button>
                    <button
                      onClick={() => handleRemoveStop(site.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Another Station Dropdown */}
        {availableSites.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleAddStop(e.target.value);
                e.target.value = '';
              }}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="" disabled>
                + Ajouter une étape à la transhumance...
              </option>
              {availableSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.governorate}) · {s.optimalHarvestWindow}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Aggregate Circuit Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800">
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Rendement Cumulé</span>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
            {cumulativeKgPerHive}{' '}
            <span className="text-xs font-sans font-normal text-slate-400">kg / ruche</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Total cheptel ({hiveFleetSize} ruches) : {totalCumulativeBatchKg.toLocaleString()} kg
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Distance Totale de Piste</span>
            <Fuel className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-sky-400 mt-2">
            {totalDistanceKm}{' '}
            <span className="text-xs font-sans font-normal text-slate-400">km</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Trajet routier nocturne entre stations
          </div>
        </div>

        <div className="bg-slate-950 p-4 rounded-lg border border-amber-500/30">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Chiffre d’Affaires Brut</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-2">
            {totalCumulativeRevenueTND.toLocaleString()}{' '}
            <span className="text-xs font-sans font-normal text-slate-400">TND</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Valorisation poly-miellées monoflorales
          </div>
        </div>
      </div>

      {/* Night Transport & Best Practices Briefing */}
      <div className="bg-slate-950/70 p-4 rounded-lg border border-slate-800 text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-amber-300">
          <Moon className="w-4 h-4 text-amber-400" />
          <span>Directives Pastorales pour le Transport en Tunisie</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 text-[11px] leading-relaxed">
          <div>
            <strong>1. Horaire de chargement :</strong> Attendre impérativement 1h après le coucher
            du soleil pour que 100% des butineuses soient rentrées. L'utilisation de grilles
            d'aération sur le toit évite l'asphyxie thermique pendant les trajets estivaux vers le nord.
          </div>
          <div>
            <strong>2. Formalités CRDA & Voisinage :</strong> Signaler l'emplacement du rucher au
            délégué agricole local (CRDA) pour être averti en amont de tout traitement insecticide sur
            les oliviers ou céréales avoisinantes.
          </div>
        </div>
      </div>
    </div>
  );
};
