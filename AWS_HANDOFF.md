# SuryaSathi — Production Readiness & AWS Handoff Guide

SuryaSathi is an AI-powered rooftop solar feasibility companion for Indian residential consumers. This document provides complete architectural specifications, service interface contracts, and the step-by-step procedure for wiring real AWS services after exporting the project to VS Code.

---

## 1. Architectural Overview & Boundaries

The codebase is built on strict **Interface-Driven Decoupling**. UI components and application workflows never depend on mock implementations or proprietary third-party SDKs directly; they interact exclusively with TypeScript service contracts.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                             SuryaSathi UI Layer                            │
│  Assessment Wizard → Results Dashboard → AI Advisor Drawer → Plan Report   │
└─────────────────────────────────┬──────────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                        Service Contracts & Abstractions                    │
│    • IBillExtractionService       • IRoofAnalysisService                   │
│    • ISolarAdvisorService         • ISchemeKnowledgeService                │
│    • ISolarPlanStorageService     • ISolarCalculationService               │
└──────────────┬──────────────────┬──────────────────┬───────────────────────┘
               │                  │                  │
               ▼                  ▼                  ▼
┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐
│  Current Local /     │ │  Backend Express │ │   Future AWS Production      │
│  Deterministic Engine│ │   Proxy Routes   │ │   Cloud Adapters             │
│                      │ │                  │ │                              │
│ • MockBillAdapter    │ │ POST /extract    │ │ • AWS Textract               │
│ • MockRoofAdapter    │ │ POST /analyze    │ │ • Amazon SageMaker (YOLOv8)  │
│ • LocalAdvisorAdapter│ │ POST /advisor    │ │ • Amazon Bedrock (Claude 3.5)│
│ • LocalStorageAdapter│ │ GET  /knowledge  │ │ • Amazon DynamoDB            │
└──────────────────────┘ └──────────────────┘ └──────────────────────────────┘
```

---

## 2. Service Interface Map & Adapter Boundaries

| Service Domain | TypeScript Interface | Current Local Implementation | Future AWS Adapter File | AWS Cloud Service |
| :--- | :--- | :--- | :--- | :--- |
| **Bill OCR** | `IBillExtractionService` | `MockBillExtractionAdapter` | `src/services/textractAdapter.ts` | **AWS Textract** (`AnalyzeDocument` / Queries) |
| **Rooftop Analysis** | `IRoofAnalysisService` | `MockRoofAnalysisAdapter` | `src/services/sageMakerAdapter.ts` | **Amazon SageMaker** (Segmentation Endpoint) |
| **AI Advisor** | `ISolarAdvisorService` | `LocalSolarAdvisorAdapter` | `src/services/bedrockAdvisorAdapter.ts` | **Amazon Bedrock** (Converse API / Claude 3.5 Sonnet) |
| **Scheme Knowledge** | `ISchemeKnowledgeService` | `LocalSchemeKnowledgeAdapter` | `src/data/schemeKnowledgeBase.ts` | **Amazon Bedrock Knowledge Base** (RAG + OpenSearch) |
| **Plan Storage** | `ISolarPlanStorageService` | `LocalStorageSolarPlanAdapter` | `src/services/storageService.ts` | **Amazon DynamoDB** (DocumentClient) |
| **Solar Calculations** | `ISolarCalculationService` | `DeterministicSolarEngine` | `src/services/solarCalculationService.ts` | Centralized Logic / **AWS Lambda** |

---

## 3. Single Source of Truth for Calculations

All solar sizing, financial benefits, government subsidies, and carbon emissions are computed **exclusively** by `solarCalculationService.ts` grounded in `solarAssumptions.ts`:
- **Recommended System Capacity (kW)**: Matched to annual consumption offset capped by shadow-free rooftop limits.
- **PM Surya Ghar Subsidies**: ₹30,000 for 1 kW, ₹60,000 for 2 kW, capped at ₹78,000 for 3 kW+ residential systems.
- **Annual Savings & Payback**: Derived from state DISCOM tariff slabs, 3.5% grid inflation, and benchmark ₹52,000/kW turnkey capital cost.
- **AI Advisor Context**: The advisor receives a structured `AdvisorContext` from the active `SolarPlan` and is strictly prohibited from inventing or modifying numerical figures.

---

## 4. Backend Express Proxy Endpoints (`server.ts`)

The Express server (`server.ts`) handles request sanitization, payload limits, and acts as the secure server-side boundary:

1. `POST /api/extract-bill`
   - Accepts: `{ fileName, fileSize, fileType }`
   - Payload limit: 10 MB validation
   - Production target: Invokes AWS Textract via `@aws-sdk/client-textract`.
2. `POST /api/analyze-roof`
   - Accepts: `{ fileName, fileSize, fileType }`
   - Payload limit: 15 MB validation
   - Production target: Invokes Amazon SageMaker runtime endpoint via `@aws-sdk/client-sagemaker-runtime`.
3. `POST /api/calculate-solar`
   - Accepts: `{ location, monthlyConsumptionKwh, monthlyBillAmount, roofAreaSqM }`
   - Invokes: `solarCalculationService.calculateSolarPlan`.
4. `POST /api/advisor`
   - Accepts: `{ question, context, history }`
   - Production target: Invokes Amazon Bedrock Converse API via `@aws-sdk/client-bedrock-runtime`.
5. `GET /api/scheme-knowledge?q=query`
   - Returns: Grounded PM Surya Ghar regulatory guidelines and DISCOM net-metering citations.
6. `GET /api/health`
   - Health check with AWS mapping status.

---

## 5. Security & Privacy Boundaries

- **Zero Hardcoded Secrets**: No AWS access keys, secret keys, or credentials exist in the source code.
- **Client Security Boundary**: React frontend never invokes AWS SDKs directly. All calls flow through the Express server routes where credentials reside securely in server environment variables.
- **PII Sanitization**: `src/services/advisorContext.ts` sanitizes data before passing context to LLM models:
  - Consumer account numbers and personal names are excluded.
  - Complete street addresses are omitted; only city, state, and DISCOM are shared.

---

## 6. AWS Production Migration Checklist (For VS Code)

When opening the project in VS Code to connect live AWS resources:

### Step 1: Install AWS SDK Dependencies
```bash
npm install @aws-sdk/client-textract @aws-sdk/client-sagemaker-runtime @aws-sdk/client-bedrock-runtime @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @aws-sdk/client-s3
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env` and provide your AWS credentials:
```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_TEXTRACT_S3_BUCKET=suryasathi-bills-prod
AWS_SAGEMAKER_ROOF_ENDPOINT=suryasathi-roof-segmentation-v1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
AWS_BEDROCK_KNOWLEDGE_BASE_ID=...
AWS_DYNAMODB_TABLE_PLANS=SuryaSathiPlans
```

### Step 3: Wire Server-Side Adapters in `server.ts`
Replace the local mock responses in `server.ts` with direct AWS SDK calls or switch the default service instances:
- In `/api/extract-bill`: Call `TextractClient.send(new AnalyzeDocumentCommand(...))` and pass output to `normalizeTextractResponse()` in `src/services/textractAdapter.ts`.
- In `/api/analyze-roof`: Call `SageMakerRuntimeClient.send(new InvokeEndpointCommand(...))` and pass output to `normalizeSageMakerResponse()` in `src/services/sageMakerAdapter.ts`.
- In `/api/advisor`: Call `BedrockRuntimeClient.send(new ConverseCommand(...))` with payload from `buildBedrockPayload()` and pass output to `normalizeBedrockResponse()` in `src/services/bedrockAdvisorAdapter.ts`.

---

## 7. Verification & Automated Test Suites

The project includes unit test suites confirming mathematical precision, edge-case safety, and adapter normalization:
- `npx tsx src/services/solarCalculation.test.ts` (8 scenarios: small, medium, high consumption, constrained roof, low tariff, zero inputs)
- `npx tsx src/services/roofAnalysis.test.ts` (13 scenarios: validation, suitability classification, area constraints)
- `npx tsx src/services/billExtraction.test.ts` (10 scenarios: format checks, OCR fallbacks, DISCOM parsing)
- `npx tsx src/services/advisorAudit.test.ts` (10 scenarios: context building, grounding adherence, Bedrock payload structures)

All test suites pass 100% with zero errors.
