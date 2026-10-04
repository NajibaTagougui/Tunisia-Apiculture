import React, { useEffect, useState } from 'react';
import { HarvestSite } from '../types/apiculture';
import {
  AlertCircle,
  Award,
  CheckCircle,
  Copy,
  Download,
  Loader2,
  Printer,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

interface AiAgronomistReport {
  assessment: string;
  flowPeriod: string;
  risksAndMitigation: string[];
  transhumanceAdvice: string;
  estimatedYieldPerHive: string;
  agronomistTip: string;
}

interface AiAgronomistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  site: HarvestSite;
  hiveCount: number;
  season: string;
  predictedYieldKg: number;
  language?: 'fr' | 'ar' | 'en';
}

export const AiAgronomistDrawer: React.FC<AiAgronomistDrawerProps> = ({
  isOpen,
  onClose,
  site,
  hiveCount,
  season,
  predictedYieldKg,
  language = 'fr',
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<AiAgronomistReport | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchAdvisory = async () => {
      try {
        const res = await fetch('/api/ai-advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            governorate: site.governorate,
            regionName: site.name,
            season,
            hiveCount,
            dominantFlora: site.dominantFlora.map((f) => f.frenchName).join(', '),
            honeyType: site.primaryHoneyOutput,
            rainfall: site.annualRainfallMm,
            tempMax: site.avgSummerTempC,
            chehiliRisk: site.chehiliDaysPerYear > 8 ? 'Élevé' : 'Modéré',
            language,
          }),
        });

        const data = await res.json();
        if (isMounted) {
          if (data.success && data.data) {
            setReport(data.data);
            setIsAiGenerated(Boolean(data.isAiGenerated));
          } else {
            throw new Error(data.message || 'Impossible de générer le rapport.');
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError((err as Error).message || 'Erreur de connexion.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAdvisory();

    return () => {
      isMounted = false;
    };
  }, [isOpen, site, hiveCount, season, language]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!report) return;
    const text = `
=== DOSSIER AGRONOMIQUE APICOLE · ${site.name} (${site.governorate}) ===
Cheptel: ${hiveCount} ruches | Saison: ${season}
Rendement prévu: ${predictedYieldKg} kg / ruche

ÉVALUATION DU TERROIR:
${report.assessment}

PÉRIODE OPTIMALE DE MIELLÉE:
${report.flowPeriod}

RISQUES & MESURES PRÉVENTIVES:
${report.risksAndMitigation?.map((r) => `- ${r}`).join('\n')}

CONSEIL DE TRANSHUMANCE:
${report.transhumanceAdvice}

CONSEIL PRATIQUE DE L'AGRONOME:
${report.agronomistTip}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {language === 'ar' ? 'الاستشارة الزراعية الذكية للرعي العسلي' : 'Avis Agronomique Intelligent'}
              </h3>
              <p className="text-xs text-slate-400">
                {site.name} ({site.governorate}) · {hiveCount} ruches
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report && (
              <>
                <button
                  onClick={handleCopy}
                  title="Copier le rapport"
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={handlePrint}
                  title="Imprimer le dossier"
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
              <div className="text-sm font-medium text-slate-300">
                Analyse agro-climatique en cours pour {site.name}...
              </div>
              <p className="text-xs text-slate-500">
                Évaluation des bilans hydriques, de la dynamique florale et des risques Chehili.
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Erreur d'analyse :</span> {error}
              </div>
            </div>
          ) : report ? (
            <div className="space-y-4 text-xs">
              {/* Top Banner */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-400">Rendement Modélisé :</span>
                <span className="font-mono text-sm font-bold text-amber-400">
                  {report.estimatedYieldPerHive || `${predictedYieldKg} kg/ruche`}
                </span>
              </div>

              {/* Assessment Section */}
              <div className="space-y-1">
                <h4 className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Évaluation du Terroir & Capacité Pastorale</span>
                </h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded border border-slate-800/80">
                  {report.assessment}
                </p>
              </div>

              {/* Flow Period */}
              <div className="space-y-1">
                <h4 className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Dynamique de la Miellée & Récolte</span>
                </h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded border border-slate-800/80">
                  {report.flowPeriod}
                </p>
              </div>

              {/* Risks & Mitigations */}
              <div className="space-y-1">
                <h4 className="font-semibold text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Vigilance Sanitaire & Facteurs Météo (Sirocco / Prédateurs)</span>
                </h4>
                <ul className="space-y-1.5 bg-slate-950/50 p-3 rounded border border-slate-800/80">
                  {report.risksAndMitigation?.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-300">
                      <span className="text-amber-500 font-bold shrink-0">·</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Transhumance Directive */}
              <div className="space-y-1">
                <h4 className="font-semibold text-sky-400">Logistique de Déplacement Nocturne</h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded border border-slate-800/80">
                  {report.transhumanceAdvice}
                </p>
              </div>

              {/* Agronomist Pro-Tip */}
              {report.agronomistTip && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-amber-200">
                  <span className="font-semibold block mb-0.5">Le Conseil de l'Agronome :</span>
                  <span>{report.agronomistTip}</span>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            {isAiGenerated ? 'Généré par le modèle agronomique Gemini 3.8' : 'Expertise agronomique intégrée'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
