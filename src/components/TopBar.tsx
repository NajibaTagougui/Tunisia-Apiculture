import React from 'react';
import { Globe, Printer, Sparkles } from 'lucide-react';

interface TopBarProps {
  activeTab: 'map' | 'yield' | 'transhumance' | 'flora';
  onSelectTab: (tab: 'map' | 'yield' | 'transhumance' | 'flora') => void;
  language: 'fr' | 'ar' | 'en';
  onLanguageChange: (lang: 'fr' | 'ar' | 'en') => void;
  onOpenAiConsultation: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  language,
  onLanguageChange,
  onOpenAiConsultation,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('map');
        }}
        className="text-lg font-bold tracking-tight text-white hover:text-amber-400 transition-colors whitespace-nowrap"
      >
        Atlas Apicole Tunisie
      </a>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
        <button
          onClick={() => onSelectTab('map')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'map'
              ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-2 decoration-amber-400'
              : 'hover:text-white'
          }`}
        >
          {language === 'ar' ? 'الخريطة الحرارية' : 'Carte Interactive'}
        </button>

        <button
          onClick={() => onSelectTab('yield')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'yield'
              ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-2 decoration-amber-400'
              : 'hover:text-white'
          }`}
        >
          {language === 'ar' ? 'التنبؤ بالمحصول' : 'Simulateur Récolte'}
        </button>

        <button
          onClick={() => onSelectTab('transhumance')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'transhumance'
              ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-2 decoration-amber-400'
              : 'hover:text-white'
          }`}
        >
          {language === 'ar' ? 'مسارات الترحال' : 'Transhumance'}
        </button>

        <button
          onClick={() => onSelectTab('flora')}
          className={`cursor-pointer transition-colors ${
            activeTab === 'flora'
              ? 'text-amber-400 font-semibold underline underline-offset-8 decoration-2 decoration-amber-400'
              : 'hover:text-white'
          }`}
        >
          {language === 'ar' ? 'دليل النباتات' : 'Plantes Mellifères'}
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {/* Language segmented toggle */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => onLanguageChange('fr')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              language === 'fr' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            FR
          </button>
          <button
            onClick={() => onLanguageChange('ar')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              language === 'ar' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            عربي
          </button>
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-1 rounded font-medium transition-colors ${
              language === 'en' ? 'bg-slate-800 text-amber-400 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            EN
          </button>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onOpenAiConsultation}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shadow-sm cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'ar' ? 'الخبير الذكي' : 'Avis Agronome'}</span>
        </button>
      </div>
    </header>
  );
};
