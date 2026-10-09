import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { DEFAULT_SOLAR_ASSUMPTIONS, calculatePmSuryaGharSubsidy } from './src/config/solarAssumptions.js';
import { INDIAN_STATES_DATA, getStateData } from './src/data/indianStates.js';
import { searchKnowledgeBase } from './src/data/schemeKnowledgeBase.js';
import { solarCalculationService } from './src/services/solarCalculationService.js';
import { solarAdvisorService } from './src/services/solarAdvisorService.js';
import { getAiProvider, AiServiceError } from './server/ai/config.js';
import { extractBillFromFile } from './server/ai/billExtractor.js';
import { analyzeRoofFromFile } from './server/ai/roofAnalyzer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '15mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'SuryaSathi Rooftop Solar Backend',
    version: '1.0.0',
    aiProvider: getAiProvider(),
    timestamp: new Date().toISOString(),
    awsMapping: {
      textract: 'MockBillExtractionAdapter -> AWS Textract',
      sagemaker: 'MockRoofAnalysisAdapter -> Amazon SageMaker / Rekognition',
      bedrock: 'LocalSolarAdvisorAdapter -> Amazon Bedrock',
      dynamodb: 'LocalStorageSolarPlanAdapter -> Amazon DynamoDB',
      s3: 'ReportExport -> Amazon S3',
    },
  });
});

// Bill Extraction API (AWS Textract adapter)
app.post('/api/extract-bill', async (req: Request, res: Response) => {
  try {
    // Real extraction path (AI_PROVIDER=gemini). Never falls back to fake data.
    if (getAiProvider() === 'gemini') {
      const { fileName, fileType, base64 } = req.body || {};
      if (typeof base64 !== 'string' || !base64) {
        return res.status(400).json({
          success: false,
          error: 'File content is missing. The upload must include the file as base64.',
        });
      }
      const data = await extractBillFromFile({ fileName, fileType, base64 });
      return res.json({ success: true, data });
    }

    const { fileName = 'bill.pdf', fileSize = 250000, fileType = 'application/pdf' } = req.body || {};
    const fileNameLower = String(fileName).toLowerCase();

    // 1. Validation
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    if (!hasValidExt && !['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'].includes(String(fileType).toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported file format. Please upload a PDF, JPG, or PNG electricity bill.',
      });
    }

    if (Number(fileSize) > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 10 MB limit.',
      });
    }

    if (fileNameLower.includes('corrupt') || fileNameLower.includes('fail') || fileNameLower.includes('unreadable')) {
      return res.status(422).json({
        success: false,
        error: 'Unable to extract text from this bill scan. Please enter your bill details manually.',
      });
    }

    if (fileNameLower.includes('partial') || fileNameLower.includes('unclear') || fileNameLower.includes('blurry')) {
      return res.json({
        success: true,
        data: {
          provider: 'State Electricity Board',
          consumerNumber: 'CA-9812401',
          billingPeriod: 'Previous Cycle',
          billAmount: 2150,
          unitsConsumedKwh: undefined,
          monthlyConsumptionKwh: 250,
          confidence: 0.52,
          extractedFields: ['provider', 'consumerNumber', 'billAmount'],
          extractedFieldsCount: 3,
          isUserConfirmed: false,
          source: 'extracted',
          notes: 'Low OCR confidence: Monthly units consumed could not be reliably extracted. Please confirm your consumption manually.',
        },
      });
    }

    let provider = 'State Electricity Distribution Co. (DISCOM)';
    let monthlyConsumptionKwh = 285;
    let billAmount = 2280;
    let sanctionedLoadKw = 3.0;
    let consumerNumber = '1029485721';
    let previousReading = 14200;
    let currentReading = 14485;

    if (fileNameLower.includes('msedcl') || fileNameLower.includes('mahavitaran')) {
      provider = 'Maharashtra State Electricity Distribution Co. Ltd. (MSEDCL)';
      monthlyConsumptionKwh = 310;
      billAmount = 2635;
      sanctionedLoadKw = 4.0;
      consumerNumber = '012948271034';
      previousReading = 18200;
      currentReading = 18510;
    } else if (fileNameLower.includes('bescom') || fileNameLower.includes('karnataka')) {
      provider = 'Bangalore Electricity Supply Company (BESCOM)';
      monthlyConsumptionKwh = 270;
      billAmount = 2160;
      sanctionedLoadKw = 3.0;
      consumerNumber = '983726154';
      previousReading = 12400;
      currentReading = 12670;
    } else if (fileNameLower.includes('bses') || fileNameLower.includes('delhi')) {
      provider = 'BSES Rajdhani Power Limited (BRPL - Delhi)';
      monthlyConsumptionKwh = 340;
      billAmount = 2550;
      sanctionedLoadKw = 5.0;
      consumerNumber = '100492817';
      previousReading = 21000;
      currentReading = 21340;
    } else if (fileNameLower.includes('tangedco') || fileNameLower.includes('chennai')) {
      provider = 'Tamil Nadu Generation and Distribution Corp (TANGEDCO)';
      monthlyConsumptionKwh = 290;
      billAmount = 2262;
      sanctionedLoadKw = 3.0;
      consumerNumber = '07-024-004-918';
      previousReading = 15300;
      currentReading = 15590;
    } else {
      const variance = (Number(fileSize) || 500) % 80;
      monthlyConsumptionKwh = 240 + variance;
      billAmount = Math.round(monthlyConsumptionKwh * 7.8);
      sanctionedLoadKw = monthlyConsumptionKwh > 350 ? 5.0 : 3.0;
      consumerNumber = `DL-${1000000 + ((Number(fileSize) || 100) % 899999)}`;
      previousReading = 11000;
      currentReading = 11000 + monthlyConsumptionKwh;
    }

    const currentYear = new Date().getFullYear();
    const tariffRate = monthlyConsumptionKwh > 0 ? Math.round((billAmount / monthlyConsumptionKwh) * 10) / 10 : 7.8;

    res.json({
      success: true,
      data: {
        provider,
        consumerNumber,
        billingPeriod: `Cycle: 01/${currentYear} - 30/${currentYear}`,
        billAmount,
        unitsConsumedKwh: monthlyConsumptionKwh,
        monthlyConsumptionKwh,
        previousReading,
        currentReading,
        tariffRate,
        tariffRatePerKwh: tariffRate,
        sanctionedLoadKw,
        confidence: 0.94,
        extractedFields: ['unitsConsumedKwh', 'billAmount', 'provider', 'consumerNumber', 'billingPeriod'],
        extractedFieldsCount: 5,
        isUserConfirmed: false,
        source: 'extracted',
        notes: 'Extracted via OCR document adapter. Future AWS service: AWS Textract AnalyzeDocument.',
      },
    });
  } catch (err: any) {
    const status = err instanceof AiServiceError ? err.status : 500;
    res.status(status).json({ success: false, error: err.message || 'Bill extraction failed' });
  }
});

// Rooftop Analysis API (Amazon SageMaker / CV adapter)
app.post('/api/analyze-roof', async (req: Request, res: Response) => {
  try {
    // Real analysis path (AI_PROVIDER=gemini). Never falls back to fake data.
    if (getAiProvider() === 'gemini') {
      const { fileName, fileType, base64 } = req.body || {};
      if (typeof base64 !== 'string' || !base64) {
        return res.status(400).json({
          success: false,
          error: 'Image content is missing. The upload must include the photo as base64.',
        });
      }
      const data = await analyzeRoofFromFile({ fileName, fileType, base64 });
      return res.json({ success: true, data });
    }

    const { fileName = 'roof.jpg', fileSize = 350000, fileType = 'image/jpeg' } = req.body || {};
    const fileNameLower = String(fileName).toLowerCase();

    // 1. Validation
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const hasValidExt = validExtensions.some((ext) => fileNameLower.endsWith(ext));
    if (!hasValidExt && !['image/jpeg', 'image/jpg', 'image/png'].includes(String(fileType).toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported file format. Please upload a JPG, JPEG, or PNG rooftop photograph.',
      });
    }

    if (Number(fileSize) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Uploaded image file is empty (0 bytes).',
      });
    }

    if (Number(fileSize) > 15 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image file size exceeds 15 MB limit.',
      });
    }

    if (fileNameLower.includes('corrupt') || fileNameLower.includes('fail') || fileNameLower.includes('broken')) {
      return res.status(422).json({
        success: false,
        error: 'Unable to analyze rooftop image. Please adjust terrace area manually.',
      });
    }

    let suitability: 'Suitable' | 'Partially Suitable' | 'Not Suitable' = 'Suitable';
    let usableAreaSqM = 35.0;
    let confidence = 0.92;
    let explanation = 'AI-assisted rooftop suitability estimate: Open RCC terrace with favorable sun exposure and minimal parapet shading.';
    let roofType = 'RCC Flat Concrete';
    let obstructions: 'None/Minimal' | 'Moderate' | 'Potentially Limiting' = 'None/Minimal';
    let shading: 'Minimal (Favorable)' | 'Moderate' | 'Potentially Limiting' = 'Minimal (Favorable)';
    let orientation: 'Favorable (South/South-West)' | 'Moderate (East/West)' | 'Potentially Limiting (North)' = 'Favorable (South/South-West)';

    if (fileNameLower.includes('unsuitable') || fileNameLower.includes('small') || fileNameLower.includes('tiny')) {
      suitability = 'Not Suitable';
      usableAreaSqM = 6.5;
      confidence = 0.88;
      obstructions = 'Potentially Limiting';
      shading = 'Potentially Limiting';
      roofType = 'Clay Tile';
      explanation = `AI-assisted rooftop suitability estimate: Available unshaded area (${usableAreaSqM} m²) is below the minimum ~${DEFAULT_SOLAR_ASSUMPTIONS.areaRequiredPerKwSqM} m² required for standard 1 kW residential solar installation.`;
    } else if (fileNameLower.includes('shade') || fileNameLower.includes('tree') || fileNameLower.includes('partial')) {
      suitability = 'Partially Suitable';
      usableAreaSqM = 18.0;
      confidence = 0.86;
      obstructions = 'Moderate';
      shading = 'Moderate';
      orientation = 'Moderate (East/West)';
      explanation = 'AI-assisted rooftop suitability estimate: Terrace has moderate afternoon shading from adjacent high-rise or overhead water tank structure.';
    } else if (fileNameLower.includes('shed') || fileNameLower.includes('metal')) {
      suitability = 'Suitable';
      usableAreaSqM = 48.0;
      confidence = 0.93;
      roofType = 'Sloped Metal Sheet';
      explanation = 'AI-assisted rooftop suitability estimate: Sloped tin/metal sheet roof identified with favorable azimuth orientation for solar clamps.';
    } else {
      const modulo = (Number(fileSize) || 100) % 25;
      usableAreaSqM = Math.round((28 + modulo * 1.1) * 10) / 10;
      explanation = `AI-assisted rooftop suitability estimate: Spacious ${roofType} identified. Detected approximately ${Math.round(usableAreaSqM * 10.764)} sq.ft of shadow-free installation area.`;
    }

    const usableAreaSqFt = Math.round(usableAreaSqM * 10.764);
    const estimatedPanelCount = Math.floor(usableAreaSqM / DEFAULT_SOLAR_ASSUMPTIONS.panelAreaSqM);
    const estimatedCapacityKw = Math.max(
      0,
      Math.round(((estimatedPanelCount * DEFAULT_SOLAR_ASSUMPTIONS.panelEfficiencyWatts) / 1000) * 10) / 10
    );

    const factors = {
      estimatedUsableArea: `${usableAreaSqM} m² (~${usableAreaSqFt} sq.ft)`,
      obstructions,
      shading,
      orientation,
    };

    res.json({
      success: true,
      data: {
        suitability,
        usableAreaSqM,
        usableAreaSqFt,
        estimatedPanelCount,
        estimatedCapacityKw,
        confidence,
        factors,
        explanation,
        source: 'ai_assisted_estimate',
        roofType,
        shadingAssessment: shading,
        orientation,
        isUserConfirmed: false,
      },
    });
  } catch (err: any) {
    const status = err instanceof AiServiceError ? err.status : 500;
    res.status(status).json({ success: false, error: err.message || 'Roof analysis failed' });
  }
});

// Solar Calculation API (AWS Lambda adapter)
app.post('/api/calculate-solar', async (req: Request, res: Response) => {
  try {
    const { location, monthlyConsumptionKwh, monthlyBillAmount, roofAreaSqM } = req.body || {};
    const plan = await solarCalculationService.calculateSolarPlan({
      location: {
        state: location?.state || 'Maharashtra',
        city: location?.city || 'Pune',
        pincode: location?.pincode,
      },
      monthlyConsumptionKwh,
      monthlyBillAmount,
      roofAreaSqM,
    });

    res.json({
      success: true,
      data: plan,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Calculation error' });
  }
});

// Scheme Knowledge API (Amazon Bedrock Knowledge Base adapter)
app.get('/api/scheme-knowledge', (req: Request, res: Response) => {
  const query = String(req.query.q || '');
  const results = searchKnowledgeBase(query);
  res.json({
    success: true,
    query,
    count: results.length,
    results,
  });
});

// Solar Advisor API (Amazon Bedrock Converse / Assistant adapter)
app.post('/api/advisor', async (req: Request, res: Response) => {
  try {
    const { question, context, history } = req.body || {};
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Question is required.',
      });
    }

    const advisorResponse = await solarAdvisorService.askSolarAdvisor(
      question,
      context,
      history
    );

    res.json({
      success: true,
      data: advisorResponse,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: err.message || 'AI Advisor inference failed.',
    });
  }
});

// Configure Vite middleware in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SuryaSathi] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[SuryaSathi] Failed to start server:', err);
  process.exit(1);
});
