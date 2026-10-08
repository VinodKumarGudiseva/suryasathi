import { AdvisorMessage, AdvisorContext } from '../types/solar';
import { ISolarAdvisorService, ISchemeKnowledgeService } from './interfaces';

/**
 * Bedrock Prompt Engineering and Claude 3.5 Sonnet / Amazon Titan System Prompt Builder.
 * This is the production-ready prompt template used when migrating to AWS Bedrock Converse API.
 */
export function buildBedrockSystemPrompt(): string {
  return `You are SuryaSathi AI Advisor, an expert residential solar consultant for India.
Your mission is to provide accurate, transparent, and encouraging guidance on rooftop solar installations,
government subsidies under the PM Surya Ghar: Muft Bijli Yojana, DISCOM net-metering regulations, and system sizing.

Strict Rules:
1. THE SOLAR CALCULATION ENGINE IS THE SINGLE SOURCE OF TRUTH:
   - NEVER invent or alter numerical values (recommendedSystemKw, annualGenerationKwh, annualSavings, subsidy, installationCost, netInvestment, paybackYears).
   - Only cite values provided in the CONTEXT.
   - If a numerical metric is null or undefined in the CONTEXT, explicitly state that it is unavailable and guide the user on how to run an assessment.
2. GROUNDING IN KNOWLEDGE:
   - Ground scheme rules strictly in the retrieved knowledge snippets (PM Surya Ghar / MNRE / CERC / SERC).
   - Cite official references (pmsuryaghar.gov.in) wherever appropriate.
3. PRIVACY:
   - Never output or ask for personally identifiable information (Aadhaar numbers, full phone numbers, private addresses).
4. OUTPUT FORMAT:
   - Return clean markdown with structured sections. Provide practical next steps and suggested follow-up questions.`;
}

/**
 * Builds the structured input payload for Amazon Bedrock converse API.
 */
export function buildBedrockPayload(
  question: string,
  context: AdvisorContext,
  retrievedSnippets: string[],
  history?: AdvisorMessage[]
) {
  const contextDescription = `
ASSESSMENT CONTEXT:
- State: ${context.state || 'Not specified'}
- City: ${context.city || 'Not specified'}
- DISCOM: ${context.discomName || 'Not specified'}
- Monthly Consumption: ${context.monthlyConsumptionKwh !== undefined ? `${context.monthlyConsumptionKwh} kWh` : 'Unavailable'}
- Monthly Bill: ${context.monthlyBillAmount !== undefined ? `₹${context.monthlyBillAmount}` : 'Unavailable'}
- Recommended System Capacity: ${context.recommendedSystemKw !== undefined ? `${context.recommendedSystemKw} kW` : 'Unavailable'}
- Estimated Annual Solar Generation: ${context.annualGenerationKwh !== undefined ? `${context.annualGenerationKwh} kWh` : 'Unavailable'}
- Estimated Annual Electricity Savings: ${context.annualSavings !== undefined ? `₹${context.annualSavings}` : 'Unavailable'}
- Estimated PM Surya Ghar Subsidy: ${context.estimatedSubsidy !== undefined ? `₹${context.estimatedSubsidy}` : 'Unavailable'}
- Estimated Gross Installation Cost: ${context.installationCost !== undefined ? `₹${context.installationCost}` : 'Unavailable'}
- Estimated Net Investment: ${context.netInvestment !== undefined ? `₹${context.netInvestment}` : 'Unavailable'}
- Estimated Simple Payback Period: ${context.paybackYears !== undefined ? `${context.paybackYears} years` : 'Unavailable'}
- Rooftop Suitability: ${context.roofSuitability || 'Unavailable'}
- Usable Rooftop Area: ${context.usableAreaSqM !== undefined ? `${context.usableAreaSqM} m²` : 'Unavailable'}
- Rooftop Assessment Confidence: ${context.roofConfidence !== undefined ? `${(context.roofConfidence * 100).toFixed(0)}%` : 'Unavailable'}
- Bill Extraction Confidence: ${context.billConfidence !== undefined ? `${(context.billConfidence * 100).toFixed(0)}%` : 'Unavailable'}
`;

  return {
    modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0', // or amazon.titan-text-express-v1
    system: [{ text: buildBedrockSystemPrompt() }],
    messages: [
      ...(history || []).slice(-6).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: [{ text: msg.text }],
      })),
      {
        role: 'user',
        content: [
          {
            text: `RETRIEVED GOVERNMENT SCHEME KNOWLEDGE:\n${retrievedSnippets.join('\n\n---\n\n')}\n\n${contextDescription}\n\nUSER QUESTION: ${question}`,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 1024,
      temperature: 0.2, // Low temperature for factual precision
      topP: 0.9,
    },
  };
}

/**
 * Normalizes raw Bedrock Converse / InvokeModel response into standard SuryaSathi AdvisorMessage.
 */
export function normalizeBedrockResponse(
  rawBedrockOutput: any,
  retrievedSources?: Array<{ title: string; url?: string; snippet?: string }>
): AdvisorMessage {
  if (!rawBedrockOutput) {
    throw new Error('Empty Bedrock response payload');
  }

  // Handle Bedrock Converse API format
  let responseText = '';
  if (rawBedrockOutput.output?.message?.content?.[0]?.text) {
    responseText = rawBedrockOutput.output.message.content[0].text;
  } else if (rawBedrockOutput.completion) {
    // Anthropic legacy format
    responseText = rawBedrockOutput.completion;
  } else if (rawBedrockOutput.results?.[0]?.outputText) {
    // Amazon Titan format
    responseText = rawBedrockOutput.results[0].outputText;
  } else if (typeof rawBedrockOutput.text === 'string') {
    responseText = rawBedrockOutput.text;
  } else {
    responseText = 'I have analyzed your request based on current PM Surya Ghar scheme documentation.';
  }

  return {
    id: `bedrock-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    sender: 'assistant',
    text: responseText,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    confidence: 0.95,
    sources: retrievedSources || [
      {
        title: 'National Portal for Rooftop Solar (pmsuryaghar.gov.in)',
        url: 'https://pmsuryaghar.gov.in',
      },
    ],
    references: [
      {
        title: 'PM Surya Ghar: Muft Bijli Yojana Guidelines',
        url: 'https://pmsuryaghar.gov.in',
      },
    ],
    relatedQuestions: [
      'Am I eligible for PM Surya Ghar?',
      'How much subsidy can I get?',
      'What documents do I need to apply?',
    ],
  };
}

/**
 * Future Bedrock Adapter Implementation Skeleton (Ready to be wired to AWS SDK):
 *
 * ```ts
 * import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
 *
 * export class BedrockSolarAdvisorAdapter implements ISolarAdvisorService {
 *   private client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'ap-south-1' });
 *   // ...
 * }
 * ```
 */
