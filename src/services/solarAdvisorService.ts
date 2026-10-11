import { searchKnowledgeBase } from '../data/schemeKnowledgeBase';
import { AdvisorMessage, SolarPlan, AdvisorContext, AdvisorSource } from '../types/solar';
import { ISolarAdvisorService } from './interfaces';
import { RemoteSolarAdvisorAdapter } from './remoteAdvisorService';
import { buildAdvisorContext } from './advisorContext';

/**
 * Prompt Template for Amazon Bedrock Claude 3.5 Sonnet / Amazon Titan:
 *
 * ```text
 * System: You are SuryaSathi AI Advisor, an expert residential solar consultant for India.
 * Ground your answers strictly in the official PM Surya Ghar: Muft Bijli Yojana rules and the user's solar assessment context.
 * NEVER invent or alter numerical values (system size, subsidy, savings, cost, payback). Use the values provided in CONTEXT.
 * If a value is not available in the context, state clearly that it is unavailable and guide the user on how to calculate it.
 * Tone: helpful, objective, authoritative, encouraging.
 *
 * CONTEXT:
 * {contextJson}
 *
 * RETRIEVED KNOWLEDGE:
 * {knowledgeSnippets}
 *
 * USER QUESTION:
 * {question}
 * ```
 */

export class LocalSolarAdvisorAdapter implements ISolarAdvisorService {
  async askSolarAdvisor(
    question: string,
    context?: Partial<SolarPlan> | AdvisorContext,
    conversationHistory?: AdvisorMessage[]
  ): Promise<AdvisorMessage> {
    // Brief reasoning latency simulation (can be replaced by Bedrock invokeModel)
    await new Promise((resolve) => setTimeout(resolve, 350));

    const qLower = question.toLowerCase().trim();
    const ctx = buildAdvisorContext(context);

    // Retrieve relevant knowledge snippets from the local knowledge repository
    const knowledgeResults = searchKnowledgeBase(question);
    const topDoc = knowledgeResults[0];

    const sources: AdvisorSource[] = knowledgeResults.slice(0, 2).map((k) => ({
      title: k.officialReference || k.topic,
      url: 'https://pmsuryaghar.gov.in',
      snippet: k.summary,
    }));

    // Context variable extraction with rigorous availability checking
    const state = ctx.state || 'your state';
    const discom = ctx.discomName || 'your local electricity distribution company (DISCOM)';
    const monthlyKwh = ctx.monthlyConsumptionKwh;
    const systemKw = ctx.recommendedSystemKw;
    const subsidy = ctx.estimatedSubsidy;
    const netCost = ctx.netInvestment;
    const grossCost = ctx.installationCost;
    const savings = ctx.annualSavings;
    const payback = ctx.paybackYears;
    const roofArea = ctx.usableAreaSqM;
    const roofSuitability = ctx.roofSuitability;
    const co2Reduction = ctx.co2ReductionKg;

    let answerText = '';
    let confidence = 0.90;
    let relatedQuestions: string[] = [
      'Am I eligible for PM Surya Ghar?',
      'How much subsidy can I get?',
      'What documents do I need to apply?',
    ];

    // Intent routing
    if (qLower.includes('eligible') || qLower.includes('eligibility') || qLower.includes('qualify') || qLower.includes('criteria')) {
      confidence = 0.95;
      answerText = `Based on the official PM Surya Ghar: Muft Bijli Yojana guidelines:

1. **Residential Domestic Consumer**: You must have an active residential connection with ${discom} in ${state}. Commercial and industrial meters are not eligible for this domestic subsidy.
2. **Rooftop Ownership / Authorization**: You must own or have legal authorization to use the rooftop or terrace area for solar installation.
3. **Aadhaar-Linked Bank Account**: The bank account for the Direct Benefit Transfer (DBT) must match the registered electricity consumer.
4. **Grid Connection Feasibility**: The installation must be a grid-tied system with a bi-directional net meter approved by ${discom}.`;

      if (monthlyKwh !== undefined && systemKw !== undefined) {
        answerText += `\n\nFor your household's monthly consumption of **${monthlyKwh} kWh**, your recommended system size of **${systemKw} kW** fits standard residential feasibility thresholds.`;
      } else {
        answerText += `\n\n*Note: Complete your electricity bill assessment to determine your exact recommended system size.*`;
      }

      relatedQuestions = [
        'How much subsidy can I get for my system?',
        'What documents do I need to submit?',
        'How does net metering work with my DISCOM?',
      ];
    } else if (
      qLower.includes('subsidy') ||
      qLower.includes('dbt') ||
      qLower.includes('78000') ||
      qLower.includes('30000') ||
      qLower.includes('60000') ||
      qLower.includes('central financial')
    ) {
      confidence = 0.96;
      answerText = `Under the central PM Surya Ghar: Muft Bijli Yojana framework:
- **1 kW System**: ₹30,000 central subsidy
- **2 kW System**: ₹60,000 central subsidy
- **3 kW and above**: ₹78,000 fixed maximum central subsidy`;

      if (systemKw !== undefined && subsidy !== undefined) {
        answerText += `\n\nFor your assessed **${systemKw} kW system**:
- **Estimated Central Subsidy**: **₹${subsidy.toLocaleString('en-IN')}**
- **Estimated Turnkey Installation**: ${grossCost ? `₹${grossCost.toLocaleString('en-IN')}` : 'Estimated based on system sizing'}
- **Estimated Net Out-of-Pocket**: ${netCost ? `₹${netCost.toLocaleString('en-IN')}` : `₹${Math.max(0, (grossCost || systemKw * 52000) - subsidy).toLocaleString('en-IN')}`}`;
      } else {
        answerText += `\n\n*Your specific system size has not yet been calculated. Run a quick assessment to get your exact eligible subsidy amount.*`;
      }

      answerText += `\n\n*The subsidy is credited via Direct Benefit Transfer (DBT) into your bank account within ~30 days of the DISCOM commissioning certificate.*`;

      relatedQuestions = [
        'What documents are required to claim the subsidy?',
        'What is my estimated payback period?',
        'What are the next steps to apply?',
      ];
    } else if (qLower.includes('cost') || qLower.includes('price') || qLower.includes('investment') || qLower.includes('out of pocket') || qLower.includes('budget')) {
      confidence = 0.94;
      if (grossCost !== undefined && subsidy !== undefined && netCost !== undefined && systemKw !== undefined) {
        answerText = `Based on your solar assessment:
- **Recommended System**: **${systemKw} kW**
- **Estimated Turnkey Cost**: **₹${grossCost.toLocaleString('en-IN')}** (includes Tier-1 modules, grid-tie inverter, mounting structure, cabling, and installation)
- **PM Surya Ghar Subsidy**: **-₹${subsidy.toLocaleString('en-IN')}**
- **Net Out-of-Pocket Investment**: **₹${netCost.toLocaleString('en-IN')}**`;
      } else {
        answerText = `Standard turnkey residential solar installations in India benchmark at approximately ₹50,000 to ₹55,000 per kW before subsidies.

*To see your exact cost and net investment after the ₹78,000 central subsidy, please complete the assessment wizard.*`;
      }

      relatedQuestions = [
        'What is the expected payback period?',
        'How much will I save each year?',
        'What documents do I need to apply?',
      ];
    } else if (qLower.includes('document') || qLower.includes('checklist') || qLower.includes('paper') || qLower.includes('aadhaar') || qLower.includes('what to submit')) {
      confidence = 0.96;
      answerText = `To apply smoothly on the National Portal (pmsuryaghar.gov.in), you need the following standard documents:

1. **Latest Electricity Bill**: From ${discom} showing your consumer number and sanctioned load.
2. **Aadhaar Card**: Matching the name on the electricity connection.
3. **Property Ownership Proof**: House tax receipt, sale deed, or NOC from the society.
4. **Bank Account Proof**: Cancelled cheque or passbook copy with IFSC code for DBT transfer.
5. **Rooftop Photo**: Showing clear shadow-free space on your terrace.

*Keep clear PDF or JPG scans under 2 MB each ready when applying.*`;

      relatedQuestions = [
        'What is the step-by-step application process?',
        'How long does DISCOM approval take?',
        'How much subsidy will I receive?',
      ];
    } else if (
      qLower.includes('net meter') ||
      qLower.includes('bi-directional') ||
      qLower.includes('export') ||
      qLower.includes('grid') ||
      qLower.includes('settlement')
    ) {
      confidence = 0.93;
      answerText = `How net metering works with ${discom}:

1. **Solar First**: Daytime solar generation powers your lights, fans, refrigerator, and AC directly first.
2. **Export Surplus**: Excess energy not consumed at home is automatically exported into the ${discom} grid. The bi-directional meter records these exported units.
3. **Night / Monsoons**: You draw grid electricity normally when the sun is down.
4. **Billing**: Your monthly DISCOM bill is calculated on *(Units Imported - Units Exported)*. Any extra export rolls over as a credit or is settled annually.`;

      if (systemKw !== undefined && ctx.annualGenerationKwh !== undefined) {
        answerText += `\n\nYour **${systemKw} kW system** is estimated to generate **~${Math.round(ctx.annualGenerationKwh / 12)} units/month** (~${ctx.annualGenerationKwh.toLocaleString('en-IN')} units/year), which can offset most of your monthly electricity bill!`;
      }

      relatedQuestions = [
        'What documents do I need for net-metering?',
        'What are the next steps to get approval?',
        'How much will I save each year?',
      ];
    } else if (qLower.includes('next') || qLower.includes('step') || qLower.includes('procedure') || qLower.includes('how to start') || qLower.includes('roadmap') || qLower.includes('apply')) {
      confidence = 0.95;
      answerText = `Here is your official 5-step roadmap:

1. **Step 1 - Register Online**: Visit the National Portal at **pmsuryaghar.gov.in** with your mobile number and ${discom} Consumer Number.
2. **Step 2 - Technical Feasibility**: Submit a request for your ${systemKw ? `${systemKw} kW` : 'recommended'} grid connection. ${discom} typically approves within 15 days.
3. **Step 3 - Select Empaneled Installer**: Choose an MNRE-approved solar installer in ${state} from the portal directory.
4. **Step 4 - Installation & Net Meter**: Installer mounts panels and ${discom} installs the bi-directional net meter.
5. **Step 5 - Subsidy Disbursement**: Submit commissioning report; your subsidy ${subsidy ? `(₹${subsidy.toLocaleString('en-IN')})` : ''} is credited directly via DBT!`;

      relatedQuestions = [
        'What documents are required to register?',
        'Am I eligible for PM Surya Ghar?',
        'How much will I save per year?',
      ];
    } else if (
      qLower.includes('saving') ||
      qLower.includes('payback') ||
      qLower.includes('roi') ||
      qLower.includes('worth it') ||
      qLower.includes('financial')
    ) {
      confidence = 0.95;
      if (savings !== undefined && payback !== undefined && netCost !== undefined) {
        answerText = `Financial projection based on your assessment:
- **Estimated Annual Savings**: **₹${savings.toLocaleString('en-IN')} / year**
- **Net Investment**: **₹${netCost.toLocaleString('en-IN')}** (after ₹${(subsidy || 0).toLocaleString('en-IN')} subsidy)
- **Simple Payback Period**: **${payback} years**
- **25-Year Operational Lifespan**: Panels produce free power for 20+ years after recouping capital costs!`;
      } else {
        answerText = `Rooftop solar in India typically pays for itself within 3.5 to 5.0 years, saving households ₹20,000 to ₹50,000 annually depending on consumption and system size.

*Run an assessment to view your exact personalized payback and 25-year financial breakdown.*`;
      }

      relatedQuestions = [
        'How much subsidy can I get?',
        'Is my recommended system size suitable?',
        'What documents do I need?',
      ];
    } else if (qLower.includes('size') || qLower.includes('capacity') || qLower.includes('kw') || qLower.includes('how many panels') || qLower.includes('consumption')) {
      confidence = 0.94;
      if (systemKw !== undefined && monthlyKwh !== undefined) {
        answerText = `Sizing assessment for your home:
- **Monthly Consumption**: ~${monthlyKwh} kWh
- **Recommended System Capacity**: **${systemKw} kW**
- **Estimated Area Needed**: ~${Math.round(systemKw * 9.29)} m² (~${Math.round(systemKw * 100)} sq.ft)
- **Estimated Annual Generation**: ~${ctx.annualGenerationKwh ? ctx.annualGenerationKwh.toLocaleString('en-IN') : Math.round(systemKw * 1450)} kWh/year

*This sizing is computed to match your household consumption while respecting your rooftop area constraint.*`;
      } else {
        answerText = `As a general engineering rule:
- 1 kW needs ~100 sq.ft and generates ~120 units/month (for small 1-2 BHK).
- 2 kW needs ~200 sq.ft and generates ~240 units/month (for 2-3 BHK).
- 3 kW needs ~300 sq.ft and generates ~360-400 units/month (qualifies for maximum ₹78,000 subsidy).

*Complete the assessment to receive your specific system recommendation.*`;
      }

      relatedQuestions = [
        'How much subsidy can I get?',
        'Is my roof suitable for this system?',
        'What will my annual savings be?',
      ];
    } else if (qLower.includes('roof') || qLower.includes('terrace') || qLower.includes('shade') || qLower.includes('shading') || qLower.includes('area') || qLower.includes('sq ft')) {
      confidence = 0.92;
      if (roofArea !== undefined || roofSuitability !== undefined) {
        answerText = `Rooftop analysis summary:
- **Suitability**: **${roofSuitability || 'Suitable'}**
- **Usable Shadow-Free Area**: **${roofArea ? `${roofArea} m² (~${Math.round(roofArea * 10.764)} sq.ft)` : 'Estimated'}**
- **Rule of Thumb**: Approximately 9.29 m² (~100 sq.ft) is required per 1 kWp installed capacity.
- **Recommended System**: ${systemKw ? `${systemKw} kW (requires ~${Math.round(systemKw * 9.29)} m²)` : 'Calculated based on your area'}

*Note: Rooftop assessment is an AI-assisted planning estimate. A physical survey by an empaneled installer is required before installation.*`;
      } else {
        answerText = `Rooftop solar requires shadow-free terrace or roof space facing South or South-West.
- **Area Requirement**: ~100 sq.ft (9.3 m²) per 1 kWp capacity.
- **Surfaces**: Flat concrete (RCC) terraces or pitched tin/galvanized sheet roofs are both supported.
- **Obstructions**: Ensure clear distance from water tanks, parapet walls, and neighboring tall structures.`;
      }

      relatedQuestions = [
        'Is my recommended system size suitable?',
        'What documents do I need?',
        'How does net metering work?',
      ];
    } else if (qLower.includes('maintenance') || qLower.includes('cleaning') || qLower.includes('warranty') || qLower.includes('lifespan') || qLower.includes('repair')) {
      confidence = 0.95;
      answerText = `Maintenance and warranty information:
1. **Solar Panels**: 25-year linear performance warranty (Tier-1 modules guarantee >=80% efficiency after 25 years).
2. **Inverter**: 5 to 10 year manufacturer warranty. Inverters typically require capacitor or fan service around Year 10-12.
3. **Routine Maintenance**: Zero moving parts. Periodic water spraying every 2 to 4 weeks during dry/dusty seasons is sufficient to maintain maximum yield.
4. **Rain / Monsoon**: Rain naturally washes away dust without harmful residue.`;

      relatedQuestions = [
        'What is the payback period?',
        'What documents do I need?',
        'How does net metering work?',
      ];
    } else if (qLower.includes('environment') || qLower.includes('co2') || qLower.includes('carbon') || qLower.includes('tree') || qLower.includes('green')) {
      confidence = 0.94;
      if (co2Reduction !== undefined && systemKw !== undefined) {
        const trees = Math.round(co2Reduction / 22);
        answerText = `Environmental impact of your proposed **${systemKw} kW** system:
- **Annual CO2 Avoided**: **~${(co2Reduction / 1000).toFixed(1)} metric tonnes** (${co2Reduction.toLocaleString('en-IN')} kg)
- **Equivalent Trees Planted**: **~${trees} mature trees** sequestering carbon annually
- **Coal Displacement**: Displaces ~${Math.round((ctx.annualGenerationKwh || systemKw * 1450) * 0.65).toLocaleString('en-IN')} kg of thermal coal burning every year.`;
      } else {
        answerText = `Every 1 kW of solar in India displaces approximately 1.2 metric tonnes of CO2 emissions annually (equivalent to planting ~54 trees) by replacing coal-fired thermal generation on the national grid.`;
      }

      relatedQuestions = [
        'What are the financial savings?',
        'How much subsidy can I get?',
        'What should I do next?',
      ];
    } else {
      // General grounded fallback
      confidence = 0.85;
      answerText = `Based on the official PM Surya Ghar: Muft Bijli Yojana guidelines:
${topDoc ? topDoc.details : 'Rooftop solar provides residential consumers with direct financial subsidies, net-metering credits, and significant long-term electricity bill reductions.'}

${
  systemKw && savings
    ? `For your home in ${state}, your assessed **${systemKw} kW system** provides estimated annual savings of **₹${savings.toLocaleString('en-IN')}** with an estimated payback of **${payback} years**.`
    : `Please feel free to ask about eligibility, subsidy slabs, required documents, rooftop sizing, or net metering.`
}

*Always confirm specific billing tariffs and net-metering settlement dates with ${discom} or on pmsuryaghar.gov.in.*`;

      relatedQuestions = [
        'Am I eligible for PM Surya Ghar?',
        'How much subsidy can I get?',
        'What documents do I need?',
        'What are the next steps?',
      ];
    }

    const timestamp = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      id: `adv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      sender: 'assistant',
      text: answerText,
      timestamp,
      suggestedActions: relatedQuestions,
      confidence,
      sources,
      references: [
        {
          title: topDoc?.officialReference || 'National Portal for Rooftop Solar (pmsuryaghar.gov.in)',
          url: 'https://pmsuryaghar.gov.in',
        },
      ],
      relatedQuestions,
    };
  }
}

export const solarAdvisorService: ISolarAdvisorService =
  (import.meta as any).env?.VITE_ADVISOR === 'remote' ? new RemoteSolarAdvisorAdapter() : new LocalSolarAdvisorAdapter();
