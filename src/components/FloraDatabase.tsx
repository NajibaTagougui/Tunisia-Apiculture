import React, { useState } from 'react';
import { MELLIFEROUS_FLORA } from '../data/tunisiaData';
import { HoneyType, MelliferousFlora } from '../types/apiculture';
import { Award, Calendar, Droplets, Filter, Search, Sparkles } from 'lucide-react';

interface FloraDatabaseProps {
  onSelectFloraFilter?: (honeyType: HoneyType) => void;
  language?: 'fr' | 'ar' | 'en';
}

const MONTHS = [
  'Jan',
  'Fév',
  'Mar',
  'Avr',
  'Mai',
  'Juin',
  'Juil',
  'Août',
  'Sep',
  'Oct',
  'Nov',
  'Déc',
];

const MONTHS_AR = [
  'جانفي',
  'فيفري',
  'مارس',
  'أفريل',
  'ماي',
  'جوان',
  'جويلية',
  'أوت',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export const FloraDatabase: React.FC<FloraDatabaseProps> = ({
  onSelectFloraFilter,
  language = 'fr',
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHoneyFilter, setSelectedHoneyFilter] = useState<string>('all');
  const [selectedPlant, setSelectedPlant] = useState<MelliferousFlora | null>(
    MELLIFEROUS_FLORA[0]
  );

  const filteredFlora = MELLIFEROUS_FLORA.filter((item) => {
    const matchesSearch =
      item.frenchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.arabicName.includes(searchQuery);

    const matchesType =
      selectedHoneyFilter === 'all' || item.honeyType === selectedHoneyFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-200 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs text-amber-500 font-semibold tracking-wide uppercase">
            {language === 'ar' ? 'أطلس النباتات العسلية التونسية' : 'Botanique Pastorale & Phénologie'}
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {language === 'ar'
              ? 'روزنامة تزهير النباتات الرحيقية وأسعار العسل بتونس'
              : 'Calendrier Phénologique & Plantes Mellifères'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'ar'
              ? 'مؤشرات الرحيق وغبار الطلع، تركيز السكريات، وفترات التدفق الرحيقي عبر فصول السنة'
              : 'Indices nectarifères, concentration glucidique et profil sensoriel des crus tunisiens.'}
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'ابحث عن نبتة أو شجرة...' : 'Rechercher une plante...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>
      </div>

      {/* 12-Month Phenology Gantt Matrix */}
      <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto">
        <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center justify-between">
          <span>{language === 'ar' ? 'روزنامة التزهير السنوية (جانفي - ديسمبر)' : 'Chronogramme Annuel des Floraisons Mellifères'}</span>
          <span className="text-[11px] text-slate-400 font-normal">
            Barre ambrée = Période active de miellée
          </span>
        </div>

        <div className="min-w-[620px]">
          {/* Months header */}
          <div className="grid grid-cols-12 gap-1 text-[11px] font-mono text-slate-400 text-center pb-2 border-b border-slate-800">
            {(language === 'ar' ? MONTHS_AR : MONTHS).map((m, idx) => (
              <div key={idx} className="truncate">
                {m}
              </div>
            ))}
          </div>

          {/* Plant rows */}
          <div className="space-y-1.5 pt-2">
            {filteredFlora.map((flora) => {
              const isSelected = selectedPlant?.id === flora.id;
              return (
                <div
                  key={flora.id}
                  onClick={() => setSelectedPlant(flora)}
                  className={`grid grid-cols-12 gap-1 items-center p-1.5 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-amber-500/10 border border-amber-500/40' : 'hover:bg-slate-900'
                  }`}
                >
                  {/* Gantt Bars for 12 months */}
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const isBlooming =
                      flora.bloomStartMonth <= flora.bloomEndMonth
                        ? month >= flora.bloomStartMonth && month <= flora.bloomEndMonth
                        : month >= flora.bloomStartMonth || month <= flora.bloomEndMonth;

                    return (
                      <div key={month} className="h-6 flex items-center justify-center">
                        {isBlooming ? (
                          <div
                            className={`w-full h-4 rounded text-[9px] font-medium flex items-center justify-center text-slate-950 ${
                              month === Math.round((flora.bloomStartMonth + flora.bloomEndMonth) / 2)
                                ? 'bg-amber-400 font-bold shadow-sm'
                                : 'bg-amber-500/80'
                            }`}
                          >
                            {month === flora.bloomStartMonth ? '●' : ''}
                          </div>
                        ) : (
                          <div className="w-1 h-1 rounded-full bg-slate-800 mx-auto" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Plant Botanical Inspector Drawer */}
      {selectedPlant && (
        <div className="bg-slate-950/80 p-5 rounded-lg border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {language === 'ar' ? selectedPlant.arabicName : selectedPlant.frenchName}
                </h3>
                <span className="italic text-xs text-slate-400 font-serif">
                  ({selectedPlant.scientificName})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedPlant.botanicalNotes}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-emerald-400 bg-emerald-950/50 px-2.5 py-1 rounded border border-emerald-800/60">
                {selectedPlant.honeyProfile.avgPricePerKgTND} TND / kg
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            {/* Nectar rating */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1">Pouvoir Nectarifère</span>
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < selectedPlant.nectarRating ? 'text-amber-400' : 'text-slate-700'}>
                    ★
                  </span>
                ))}
                <span className="ml-1 text-slate-300 font-mono">
                  {selectedPlant.nectarRating}/5
                </span>
              </div>
            </div>

            {/* Pollen rating */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1">Richesse en Pollen</span>
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < selectedPlant.pollenRating ? 'text-amber-400' : 'text-slate-700'}>
                    ★
                  </span>
                ))}
                <span className="ml-1 text-slate-300 font-mono">
                  {selectedPlant.pollenRating}/5
                </span>
              </div>
            </div>

            {/* Sugar concentration */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1">Teneur en Sucres</span>
              <div className="font-mono font-bold text-slate-200 text-sm">
                {selectedPlant.sugarConcentrationPercent}%{' '}
                <span className="text-[10px] text-slate-400 font-normal">au brix</span>
              </div>
            </div>

            {/* Honey sensory profile */}
            <div className="p-3 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 block mb-1">Robe & Cristallisation</span>
              <div className="text-[11px] text-slate-300 truncate" title={selectedPlant.honeyProfile.color}>
                {selectedPlant.honeyProfile.color}
              </div>
            </div>
          </div>

          {/* Regional distribution */}
          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 pt-1">
            <span className="text-slate-300 font-medium">Régions de prédilection en Tunisie :</span>
            {selectedPlant.primaryRegions.map((region, idx) => (
              <span key={idx} className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800 text-slate-300">
                {region}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
