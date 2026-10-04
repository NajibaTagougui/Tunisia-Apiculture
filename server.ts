import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// AI Harvest Advisor Endpoint
app.post('/api/ai-advisor', async (req, res) => {
  const {
    governorate,
    regionName,
    season,
    hiveCount,
    dominantFlora,
    honeyType,
    rainfall,
    tempMax,
    chehiliRisk,
    language = 'fr',
  } = req.body;

  const prompt = `
You are an expert Senior Agro-Apicultural Agronomist specializing in Tunisian beekeeping (Apis mellifera intermissa - North African black bee / النحل التلي) and transhumance pastoral movements in Tunisia.

Analyze the following harvest station scenario:
- Target Location: ${regionName} (${governorate}, Tunisia)
- Target Season: ${season}
- Apiary Hive Size: ${hiveCount} Langstroth hives
- Predominant Melliferous Flora: ${dominantFlora}
- Desired Honey Classification: ${honeyType}
- Average Precipitation: ${rainfall} mm
- Summer/Spring Max Temperature: ${tempMax}°C
- Sirocco / Chehili Wind Risk Level: ${chehiliRisk}
- Preferred Language: ${language} (fr, ar, or en)

Provide a structured, highly practical agricultural briefing with:
1. "assessment": An expert evaluation of this site's nectar potential and ecological carrying capacity for ${hiveCount} hives.
2. "flowPeriod": The optimal flowering peak and extraction timeframe for ${honeyType}.
3. "risksAndMitigation": Concrete risks (e.g. Sirocco/Chehili hot desiccating winds, pesticide exposure from wheat/olive treatments, Asian hornet or European bee-eater 'Guêpier d'Europe' pressure) and practical mitigation steps.
4. "transhumanceAdvice": Recommendation on when to move hives into this site, optimal night transport timing, and where to transhume next in the Tunisian seasonal cycle.
5. "estimatedYieldPerHive": A realistic yield estimate in kg per hive under normal versus dry conditions.

Respond strictly in JSON format matching this schema:
{
  "assessment": "string",
  "flowPeriod": "string",
  "risksAndMitigation": ["string", "string", "string"],
  "transhumanceAdvice": "string",
  "estimatedYieldPerHive": "string",
  "agronomistTip": "string"
}
`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction:
            'You are a premier Tunisian apiculture expert. Provide rigorous, realistic botanical, climatic, and beekeeping guidance grounded in Tunisian geography, regional CRDA directives, and native bee biology.',
        },
      });

      const text = response.text || '{}';
      try {
        const parsed = JSON.parse(text);
        return res.json({ success: true, data: parsed, isAiGenerated: true });
      } catch {
        return res.json({
          success: true,
          data: {
            assessment: text,
            flowPeriod: 'Peak flow occurs during main botanical bloom window.',
            risksAndMitigation: ['Monitor heat stress and ensure fresh water supply.'],
            transhumanceAdvice: 'Plan night transport when foragers have all returned.',
            estimatedYieldPerHive: '12 - 18 kg/hive',
            agronomistTip: 'Check comb capping ratio (>80%) before super extraction.',
          },
          isAiGenerated: true,
        });
      }
    } else {
      // Deterministic agronomic expert fallback if API key is not yet configured
      const fallbackReport = generateAgronomicFallback(req.body);
      return res.json({ success: true, data: fallbackReport, isAiGenerated: false });
    }
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Gemini advisor error:', err.message);
    const fallbackReport = generateAgronomicFallback(req.body);
    return res.json({
      success: true,
      data: fallbackReport,
      isAiGenerated: false,
      fallbackReason: err.message,
    });
  }
});

function generateAgronomicFallback(params: {
  regionName?: string;
  governorate?: string;
  season?: string;
  hiveCount?: number;
  dominantFlora?: string;
  honeyType?: string;
  chehiliRisk?: string;
  language?: string;
}) {
  const loc = params.regionName || 'Tunisie';
  const gov = params.governorate || 'Zaghouan';
  const flora = params.dominantFlora || 'Romarin sauvage & Thym';
  const honey = params.honeyType || 'Miel de Romarin';
  const hives = params.hiveCount || 50;
  const isAr = params.language === 'ar';
  const isEn = params.language === 'en';

  if (isAr) {
    return {
      assessment: `الموقع الرعوي في ${loc} (${gov}) يتميز بتنوع نباتي عالي بفضل ${flora}. الكثافة الحالية البالغة ${hives} خلية متوازنة مع السعة البيئية للمنطقة دون ضغط على الموارد الرحيقية.`,
      flowPeriod: 'ذروة التدفق الرحيقي من أواخر مارس إلى منتصف ماي حسب هطول الأمطار الشتوية.',
      risksAndMitigation: [
        'خطر رياح الشهيلي الجافة: تركيب مصدات رياح وتوفير نقاط مياه عذبة ظليلة على مسافة أقل من 100 متر.',
        'خطر طائر الوروار (Guêpier d’Europe) في الربيع: فحص مستمر لنشاط السروح عند الظهيرة.',
        'مخاطر الرش الكيميائي في الحقول المجاورة: التنسيق المسبق مع المزارعين المحليين بالمنطقة.',
      ],
      transhumanceAdvice:
        'نقل الصناديق ليلاً بعد غروب الشمس بساعة على الأقل لضمان عودة كامل الشغالات، مع تثبيت الأطر جيداً لتفادي انهيار الأقراص الشمعية الحديثة.',
      estimatedYieldPerHive: '14 - 22 كغ / خلية (في سنة مناخية عادية)',
      agronomistTip:
        'تأكد من إغلاق النحل لأكثر من 75% من العيون السداسية لضمان نسبة رطوبة أقل من 18% وجودة صنفية ممتازة للعسل.',
    };
  }

  if (isEn) {
    return {
      assessment: `The forage territory around ${loc} (${gov}) boasts rich nectar reserves of ${flora}. A hive density of ${hives} colonies aligns well with local floral carrying capacity.`,
      flowPeriod: 'Main nectar flow spans from late March through mid-May, heavily governed by winter cumulative rainfall.',
      risksAndMitigation: [
        'Sirocco (Chehili) hot dry winds: install shade tarps and maintain freshwater stations within 100m.',
        'European Bee-eater (Merops apiaster) predation in spring migration: monitor afternoon flight activity.',
        'Pesticide drift from adjacent cereal or olive treatments: coordinate with local agricultural delegates (CRDA).',
      ],
      transhumanceAdvice:
        'Execute transhumance moves exclusively at night after full worker return. Secure Langstroth frames tightly to prevent comb fracture on rugged mountain tracks.',
      estimatedYieldPerHive: '14 - 22 kg / hive (standard climatic year)',
      agronomistTip:
        'Harvest only supers with at least 80% operculated cells to guarantee moisture levels below 18% for premium grade certification.',
    };
  }

  // French default
  return {
    assessment: `La zone de butinage de ${loc} (${gov}) présente une excellente densité mellifère grâce à ${flora}. L'implantation de ${hives} ruches reste dans la capacité de charge biotique du terroir.`,
    flowPeriod:
      'La miellée principale se déroule entre fin mars et fin mai, étroitement corrélée aux précipitations hivernales cumulées.',
    risksAndMitigation: [
      'Vent de Chehili (Sirocco) : installer des ombrières et des abreuvoirs d’eau fraîche à moins de 100 m du rucher.',
      'Pression migratoire du Guêpier d’Europe (Merops apiaster) : surveiller le blocage de ponte au printemps.',
      'Dérive de traitements phytosanitaires dans les cultures avoisinantes : contact préalable avec les céréaliers et la CRDA locale.',
    ],
    transhumanceAdvice:
      'Transhumance à réaliser impérativement de nuit après rentrée complète des butineuses. Sanglez fermement les corps Langstroth pour amortir les pistes de montagne.',
    estimatedYieldPerHive: '14 - 22 kg / ruche (année pluviométrique normale)',
    agronomistTip:
      'Extraire uniquement les hausses operculées à plus de 80% afin de garantir une teneur en eau inférieure à 18% et préserver le profil floral.',
  };
}

// Development with Vite vs Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
