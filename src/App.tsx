import React, { useState } from 'react';
import { IMAGES } from './assets/images';
import { AiAgronomistDrawer } from './components/AiAgronomistDrawer';
import { FloraDatabase } from './components/FloraDatabase';
import { SiteDossierModal } from './components/SiteDossierModal';
import { TopBar } from './components/TopBar';
import { TranshumancePlanner } from './components/TranshumancePlanner';
import { TunisiaHeatmapMap } from './components/TunisiaHeatmapMap';
import { YieldPredictor } from './components/YieldPredictor';
import { HARVEST_SITES, MELLIFEROUS_FLORA, TUNISIA_GOVERNORATES } from './data/tunisiaData';
import { HarvestSite, Season } from './types/apiculture';
import {
  Award,
  Calendar,
  CloudRain,
  Compass,
  Droplets,
  Layers,
  MapPin,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'map' | 'yield' | 'transhumance' | 'flora'>('map');

  // Language state: 'fr' (default), 'ar', 'en'
  const [language, setLanguage] = useState<'fr' | 'ar' | 'en'>('fr');

  // Currently selected harvest site (default to Djebel Zaghouan - premier Rosemary honey terroir)
  const [selectedSite, setSelectedSite] = useState<HarvestSite>(HARVEST_SITES[0]);

  // Site modal for detailed inspection
  const [inspectingSite, setInspectingSite] = useState<HarvestSite | null>(null);

  // Active season for bloom kernel
  const [selectedSeason, setSelectedSeason] = useState<Season>('spring');

  // Active transhumance circuit sites
  const [transhumanceCircuit, setTranshumanceCircuit] = useState<HarvestSite[]>([
    HARVEST_SITES[2], // Béni Khiar (Citrus - Spring)
    HARVEST_SITES[0], // Djebel Zaghouan (Rosemary - Spring/Summer)
    HARVEST_SITES[4], // Tabarka (Eucalyptus - Summer)
  ]);

  // AI Agronomist Modal state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState<boolean>(false);
  const [aiConsultationParams, setAiConsultationParams] = useState<{
    site: HarvestSite;
    hiveCount: number;
    predictedYieldKg: number;
  }>({
    site: HARVEST_SITES[0],
    hiveCount: 60,
    predictedYieldKg: 17.5,
  });

  const handleOpenAiConsultation = (params?: {
    site: HarvestSite;
    hiveCount: number;
    predictedYieldKg: number;
  }) => {
    if (params) {
      setAiConsultationParams(params);
    } else {
      setAiConsultationParams({
        site: selectedSite,
        hiveCount: 60,
        predictedYieldKg: 18.0,
      });
    }
    setIsAiDrawerOpen(true);
  };

  const handleSelectSiteFromMap = (site: HarvestSite) => {
    setSelectedSite(site);
    setInspectingSite(site);
  };

  const handleSendToYieldSimulator = (site: HarvestSite) => {
    setSelectedSite(site);
    setInspectingSite(null);
    setActiveTab('yield');
  };

  const handleToggleTranshumanceSite = (site: HarvestSite) => {
    if (transhumanceCircuit.some((s) => s.id === site.id)) {
      setTranshumanceCircuit(transhumanceCircuit.filter((s) => s.id !== site.id));
    } else {
      setTranshumanceCircuit([...transhumanceCircuit, site]);
    }
  };

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950"
    >
      {/* Top Bar (Complies with 3-Zone Top Bar Contract) */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        language={language}
        onLanguageChange={setLanguage}
        onOpenAiConsultation={() => handleOpenAiConsultation()}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Editorial Context Banner */}
        <section className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* Left Prose Info */}
            <div className="lg:col-span-7 p-6 sm:p-8 space-y-3">
              <div className="flex items-center gap-2 text-xs text-amber-500 font-semibold tracking-wider uppercase">
                <span>Système Décisionnel Apicole</span>
                <span aria-hidden="true">·</span>
                <span>INRAT &amp; CRDA Terroirs</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-balance">
                {language === 'ar'
                  ? 'منصة توجيه النحالة بتونس: اختيار أفضل مواقع الجني حسب التنوع الزهري والمناخ'
                  : 'Optimisation Pastorale & Prédiction des Récoltes de Miel en Tunisie'}
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
                {language === 'ar'
                  ? 'حلل الخرائط الحرارية التفاعلية لـ 24 ولاية تونسية، استكشف فترات إزهار الإكليل والزهر والكاليتوس والسدر، وتوقع المردودية الاقتصادية لكل خلية مع مراعاة مخاطر الشهيلي والجفاف.'
                  : 'Croisez les gradients bioclimatiques des 24 gouvernorats avec les dynamiques florales (Romarin de Zaghouan, Zhar du Cap Bon, Eucalyptus des Mogods, Sidr du Centre). Planifiez vos transhumances nocturnes pour maximiser les rendements tout en préservant la race locale Apis mellifera intermissa.'}
              </p>

              {/* Unboxed Metadata Metrics */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono tabular-nums">
                <div>
                  <strong className="text-amber-400 font-bold text-sm">26</strong> Stations pastorales
                </div>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <div>
                  <strong className="text-amber-400 font-bold text-sm">24</strong> Gouvernorats
                </div>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <div>
                  <strong className="text-amber-400 font-bold text-sm">8</strong> Grands crus de miel
                </div>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <div>
                  <strong className="text-emerald-400 font-bold text-sm">100%</strong> Données bioclimatiques
                </div>
              </div>
            </div>

            {/* Right Landscape Media Asset with Contrast Scrim */}
            <div className="lg:col-span-5 relative h-56 lg:h-full min-h-[220px]">
              <img
                src={IMAGES.landscape}
                alt="Paysage apicole tunisien des montagnes de Zaghouan"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-l from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute bottom-3 right-4 text-[11px] text-slate-300 bg-slate-950/80 px-2.5 py-1 rounded backdrop-blur-sm border border-slate-800">
                Terroir du Djebel Zaghouan
              </div>
            </div>
          </div>
        </section>

        {/* View Switcher Tabs (Segmented interactive buttons) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'map'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'الخريطة الحرارية للمواقع' : 'Carte Interactive & Heatmaps'}
            </button>
            <button
              onClick={() => setActiveTab('yield')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'yield'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'محاكي المحصول والعائدات' : 'Simulateur de Rendement (kg/TND)'}
            </button>
            <button
              onClick={() => setActiveTab('transhumance')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'transhumance'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'مخطط الترحال الرعوي' : 'Circuits de Transhumance'}
            </button>
            <button
              onClick={() => setActiveTab('flora')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'flora'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'روزنامة النباتات العسلية' : 'Phénologie & Plantes'}
            </button>
          </div>

          {/* Quick Active Station Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Station active :</span>
            <span className="font-semibold text-amber-400">{selectedSite.name}</span>
            <span className="font-mono text-slate-500">({selectedSite.governorate})</span>
          </div>
        </div>

        {/* Tab 1: Interactive Heatmap Map & Station Selector */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            <TunisiaHeatmapMap
              selectedSite={selectedSite}
              onSelectSite={handleSelectSiteFromMap}
              selectedSeason={selectedSeason}
              onSeasonChange={setSelectedSeason}
              transhumanceRouteSites={transhumanceCircuit}
              language={language}
            />

            {/* Quick Station Grid Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200">
                  {language === 'ar' ? 'المحطات الرعوية الكبرى بتونس' : 'Sélection Rapide des Stations Apicoles Clés'}
                </h3>
                <span className="text-xs text-slate-400">
                  Cliquez pour inspecter ou charger dans le simulateur
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {HARVEST_SITES.slice(0, 6).map((site) => {
                  const isCurrent = selectedSite.id === site.id;
                  return (
                    <button
                      key={site.id}
                      onClick={() => setSelectedSite(site)}
                      className={`p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs truncate">
                        {language === 'ar' ? site.arabicName : site.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {site.governorate} · {site.suitabilityScore}/100
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Seasonal Yield Predictor & Simulator */}
        {activeTab === 'yield' && (
          <YieldPredictor
            selectedSite={selectedSite}
            onSelectSite={setSelectedSite}
            onRequestAiConsultation={handleOpenAiConsultation}
            language={language}
          />
        )}

        {/* Tab 3: Transhumance Circuit Planner */}
        {activeTab === 'transhumance' && (
          <TranshumancePlanner
            currentCircuit={transhumanceCircuit}
            onChangeCircuit={setTranshumanceCircuit}
            onSelectStationToInspect={handleSelectSiteFromMap}
            language={language}
          />
        )}

        {/* Tab 4: Melliferous Flora Database & Gantt Phenology */}
        {activeTab === 'flora' && (
          <FloraDatabase
            onSelectFloraFilter={() => {}}
            language={language}
          />
        )}

        {/* Supporting Visual & Terroir Storytelling Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-1/2 h-44 sm:h-auto relative">
              <img
                src={IMAGES.honeycomb}
                alt="Rayon de miel brut et fleurs de romarin"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent sm:hidden" />
            </div>
            <div className="sm:w-1/2 p-5 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-xs text-amber-500 font-semibold uppercase">
                  Qualité & Terroir
                </span>
                <h4 className="text-sm font-bold text-white mt-1">
                  Les Crus Monofloraux de Tunisie
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  Le miel d'Ékليل de Zaghouan et le miel de Thym du Djebel Bargou figurent parmi les plus recherchés du bassin méditerranéen pour leur pureté pollinique (&gt;70%).
                </p>
              </div>
              <button
                onClick={() => setActiveTab('flora')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 text-left cursor-pointer"
              >
                Explorer la flore associée →
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-1/2 h-44 sm:h-auto relative">
              <img
                src={IMAGES.beekeeper}
                alt="Apiculteur tunisien inspectant un cadre de ruche Langstroth"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent sm:hidden" />
            </div>
            <div className="sm:w-1/2 p-5 flex flex-col justify-between space-y-2">
              <div>
                <span className="text-xs text-emerald-400 font-semibold uppercase">
                  Savoir-Faire Pastoral
                </span>
                <h4 className="text-sm font-bold text-white mt-1">
                  L'Abeille Noire Tellienne
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-1">
                  <em>Apis mellifera intermissa</em> est parfaitement adaptée aux chaleurs estivales et aux arrêts de ponte en période de sécheresse. Elle réagit rapidement dès les premières pluies d'automne.
                </p>
              </div>
              <button
                onClick={() => handleOpenAiConsultation()}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 text-left cursor-pointer"
              >
                Consulter l'agronome IA →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Station Detailed Dossier Modal */}
      <SiteDossierModal
        site={inspectingSite}
        onClose={() => setInspectingSite(null)}
        onSendToYieldSimulator={handleSendToYieldSimulator}
        onAddToTranshumance={handleToggleTranshumanceSite}
        isInTranshumance={
          inspectingSite ? transhumanceCircuit.some((s) => s.id === inspectingSite.id) : false
        }
        language={language}
      />

      {/* AI Apiary Agronomist Drawer */}
      <AiAgronomistDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        site={aiConsultationParams.site}
        hiveCount={aiConsultationParams.hiveCount}
        season={selectedSeason}
        predictedYieldKg={aiConsultationParams.predictedYieldKg}
        language={language}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            Atlas Apicole Tunisie · Décisions pastorales &amp; modélisation prédictive des récoltes de miel.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>24 Gouvernorats</span>
            <span aria-hidden="true">·</span>
            <span>Apis mellifera intermissa</span>
            <span aria-hidden="true">·</span>
            <span>Agronomie Pastorale</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
