import React from 'react';
import { HarvestSite } from '../types/apiculture';
import {
  Calendar,
  CloudRain,
  Compass,
  Droplets,
  MapPin,
  Mountain,
  Navigation,
  Sparkles,
  Thermometer,
  Wind,
  X,
} from 'lucide-react';

interface SiteDossierModalProps {
  site: HarvestSite | null;
  onClose: () => void;
  onSendToYieldSimulator: (site: HarvestSite) => void;
  onAddToTranshumance: (site: HarvestSite) => void;
  isInTranshumance: boolean;
  language?: 'fr' | 'ar' | 'en';
}

export const SiteDossierModal: React.FC<SiteDossierModalProps> = ({
  site,
  onClose,
  onSendToYieldSimulator,
  onAddToTranshumance,
  isInTranshumance,
  language = 'fr',
}) => {
  if (!site) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl shadow-2xl text-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div>
            <div className="text-[11px] text-amber-500 font-semibold uppercase tracking-wider">
              {site.bioclimaticZone} · {site.governorate}
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              {language === 'ar' ? site.arabicName : site.name}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          {/* Top Terrain Overview */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-300 block">Topographie & Terroir</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">{site.terrainDescription}</p>
            <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-400">
              <span>Accès camion :</span>
              <span className="text-slate-200 capitalize">
                {site.accessRoadQuality.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Microclimatic Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span>Pluviométrie</span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-200 tabular-nums">
                {site.annualRainfallMm} mm
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Mountain className="w-3.5 h-3.5 text-amber-400" />
                <span>Altitude</span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-200 tabular-nums">
                {site.elevationM} m
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Thermometer className="w-3.5 h-3.5 text-orange-400" />
                <span>T° Été Max</span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-200 tabular-nums">
                {site.avgSummerTempC}°C
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1.5 mb-1">
                <Wind className="w-3.5 h-3.5 text-rose-400" />
                <span>Jours Chehili</span>
              </div>
              <div className="font-mono text-sm font-bold text-slate-200 tabular-nums">
                {site.chehiliDaysPerYear} j/an
              </div>
            </div>
          </div>

          {/* Flora & Harvest Period */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300">Flore Mellifère Dominante</span>
              <span className="text-emerald-400 font-medium">
                Récolte : {site.optimalHarvestWindow}
              </span>
            </div>

            <div className="space-y-2">
              {site.dominantFlora.map((flora) => (
                <div
                  key={flora.id}
                  className="p-2 rounded bg-slate-900 border border-slate-800/80 flex items-center justify-between text-[11px]"
                >
                  <div>
                    <span className="font-medium text-slate-200">
                      {language === 'ar' ? flora.arabicName : flora.frenchName}
                    </span>
                    <span className="text-slate-500 italic ml-1">({flora.scientificName})</span>
                  </div>
                  <div className="font-mono text-amber-400 font-semibold">
                    {flora.honeyProfile.avgPricePerKgTND} TND/kg
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pastoral Advice & Water radius */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-sky-400" />
              <span>
                Point d’eau le plus proche : <strong>{site.waterAccessRadiusKm} km</strong>
              </span>
            </div>
            <div>
              Capacité max conseillée : <strong>{site.recommendedMaxHives} ruches</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={() => onAddToTranshumance(site)}
            className={`px-3 py-2 rounded-lg font-medium transition-colors border ${
              isInTranshumance
                ? 'bg-slate-800 border-slate-700 text-slate-400'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {isInTranshumance ? '✓ Présent dans la transhumance' : '+ Ajouter à la transhumance'}
          </button>

          <button
            onClick={() => onSendToYieldSimulator(site)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Simuler le Rendement de cette Station →
          </button>
        </div>
      </div>
    </div>
  );
};
