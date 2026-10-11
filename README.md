# SuryaSathi: Rooftop Solar Assistant for Indian Homes

Track: Waste and Energy (rooftop solar). Team TerraTech: Riya Sharma, Vinod Kumar Gudiseva.

## The problem
Many Indian households want rooftop solar under PM Surya Ghar, but do not know what size to install, what it costs, how much subsidy they can get, or which documents to prepare.

## What it does
1. **Bill upload.** The user uploads an electricity bill (photo or PDF). Amazon Textract reads the text and Gemini structures it into units, amount, DISCOM and sanctioned load. The user reviews it. If the units cannot be read, the app asks for manual entry and does not generate a plan.
2. **Roof photo.** The AI estimates usable area, obstructions and shading from one photo. This is a rough estimate, so the user confirms or edits the area.
3. **Plan.** A deterministic calculation engine (no AI) gives system size, annual generation, savings, subsidy, payback and CO2 reduction.
4. **AI Advisor.** An agent built on the Strands Agents SDK searches PM Surya Ghar scheme knowledge and answers questions about eligibility, subsidy, documents and next steps. Plan numbers come from the calculation engine. If an answer contains a rupee amount that is not in the plan or the scheme data, it is flagged.
5. **Saved plans** are stored in Amazon DynamoDB.

## Where AWS fits
| Service | Use | Code |
|---|---|---|
| Amazon Textract | Reads text from the bill (DetectDocumentText) | `server/aws/textractText.ts`, `server/ai/billPipeline.ts` |
| Amazon DynamoDB | Stores plans per anonymous browser id; each record has an expiry timestamp | `server/aws/planStore.ts` |
| Strands Agents SDK (AWS open source) | Advisor agent with a scheme-search tool | `server/ai/advisorAgent.ts` |
| AWS IAM | Least-privilege user (Textract DetectDocumentText and four DynamoDB actions on one table) | |

The language model used for bill structuring, roof analysis and advisor replies is Google Gemini. The advisor has an Amazon Bedrock option (`AI_PROVIDER=aws`) that we could not test, because Bedrock model access was blocked on our new account.

## Honest limits
- Bill extraction was tested on a synthetic sample bill only. We make no accuracy claim.
- Roof area from a single photo is an estimate. The user must confirm it.
- Textract does not read Hindi script well. When Textract cannot be used, Gemini reads the bill image directly, and the result notes say which engine ran.
- Subsidy, cost and savings figures are estimates. Confirm them on pmsuryaghar.gov.in and with an installer.
- The app does not submit any government or DISCOM application. It gives guidance and checklists.

## Run it
```
npm install --legacy-peer-deps
npm run dev
```
Create a `.env` file (never commit it):
```
GEMINI_API_KEY=...
AI_PROVIDER=gemini
BILL_OCR=textract
PLAN_STORAGE=dynamodb
VITE_PLAN_STORAGE=dynamodb
VITE_ADVISOR=remote
AWS_REGION=us-east-1
```
AWS credentials come from the standard credential chain (`~/.aws/credentials`). Create a DynamoDB table `SuryaSathiPlans` in `us-east-1` with partition key `ownerId` (String) and sort key `id` (String). Without the AWS settings the app runs on local mock data.

Tests:
```
npm run lint
npx tsx server/ai/billExtractor.test.ts
npx tsx server/ai/roofAnalyzer.test.ts
npx tsx server/ai/advisorAgent.test.ts
npx tsx server/aws/aws.test.ts
```

## AI tools used
Google AI Studio (initial app scaffold), Claude by Anthropic (code assistance and review), Gemini API (runtime model).
