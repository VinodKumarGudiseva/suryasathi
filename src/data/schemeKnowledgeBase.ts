import { SchemeKnowledgeItem } from '../types/solar';

export const SCHEME_KNOWLEDGE_BASE: SchemeKnowledgeItem[] = [
  {
    id: 'pm-surya-ghar-eligibility',
    topic: 'PM Surya Ghar: Muft Bijli Yojana Eligibility',
    keywords: ['eligibility', 'eligible', 'qualify', 'who can apply', 'criteria', 'residential', 'consumer', 'meter', 'tenant', 'ownership'],
    summary: 'Central government scheme providing direct financial subsidy for residential rooftop solar systems across India.',
    details: `Based on the official PM Surya Ghar: Muft Bijli Yojana guidelines:
1. Must be an Indian citizen with a residential electricity connection in their own or family name.
2. The roof where solar panels are to be installed must have clear ownership or authorization (free of title disputes).
3. The consumer must have a valid active domestic consumer number (CA number) with the local DISCOM.
4. Only grid-connected rooftop solar systems with bi-directional net metering are eligible for central DBT subsidy.
5. Panels must be installed through an empaneled vendor registered on the National Portal (pmsuryaghar.gov.in).
Please verify current rules and state-specific criteria on the official national portal before applying.`,
    officialReference: 'National Portal for Rooftop Solar (pmsuryaghar.gov.in) & MNRE Guidelines',
    eligibilityNotes: [
      'Domestic residential consumers only (Commercial and industrial consumers have separate non-subsidy frameworks).',
      'The consumer must have an active bank account linked to Aadhaar for direct DBT transfer.'
    ]
  },
  {
    id: 'pm-surya-ghar-subsidy-slabs',
    topic: 'Subsidy Rates & Financial Assistance Slabs',
    keywords: ['subsidy', 'amount', 'rate', 'how much', 'money', 'financial aid', 'cost', 'slabs', '78000', '30000', '60000', 'dbt'],
    summary: 'Direct Benefit Transfer (DBT) central subsidy structure: ₹30,000 for 1 kW, ₹60,000 for 2 kW, and up to ₹78,000 for 3 kW and higher residential systems.',
    details: `Based on available scheme information from MNRE:
- For rooftop systems up to 1 kW capacity: ₹30,000 central subsidy.
- For systems between >1 kW and up to 2 kW capacity: ₹60,000 central subsidy.
- For systems between >2 kW and up to 3 kW capacity (or higher residential): Fixed at ₹78,000 maximum central subsidy.
- Group Housing Societies / Resident Welfare Associations (GHS/RWA): ₹18,000 per kW for common facilities (EV charging, common lights) up to 500 kW capacity.
Subsidy is credited directly to the beneficiary's bank account via DBT typically within 30 days of DISCOM inspection and commissioning report submission. Please verify current disbursement timelines on the official portal.`,
    officialReference: 'MNRE PM Surya Ghar Muft Bijli Yojana Notification No. 318/17/2024-GCRT',
    eligibilityNotes: [
      'Subsidy applies only to systems using Made in India (DCR - Domestic Content Requirement) solar photovoltaic modules.',
      'Inverters must conform to BIS standards (IS 16221 / IS 16169).'
    ]
  },
  {
    id: 'net-metering-process',
    topic: 'Net Metering & How Electricity Billing Works',
    keywords: ['net metering', 'bi-directional meter', 'export', 'import', 'grid', 'units', 'discom', 'surplus', 'banking', 'settlement'],
    summary: 'A bi-directional meter records units imported from the grid when solar is low and units exported to the grid when solar generation exceeds household usage.',
    details: `Based on standard State Electricity Regulatory Commission (SERC) net-metering regulations:
1. Daytime Solar Generation: Your solar panels power your home appliances directly first.
2. Surplus Generation: Any excess electricity generated during peak afternoon hours is fed back into the DISCOM grid through a smart bi-directional meter.
3. Night / Rainy Usage: When solar is not generating, power is seamlessly drawn from the grid as usual.
4. Monthly Billing: Your DISCOM bill calculates Net Units = (Units Imported from Grid) - (Units Exported to Grid). If you exported more than you consumed, units carry forward as credit to future billing cycles or are settled annually at the approved average power purchase cost (APPC).
Please check with your local DISCOM (e.g. MSEDCL, BESCOM, BSES, TANGEDCO) regarding their specific annual settlement cutoff date.`,
    officialReference: 'SERC Net Metering Regulations & Forum of Regulators Model Guidelines'
  },
  {
    id: 'documents-required',
    topic: 'Documents Required for Application & Subsidy',
    keywords: ['documents', 'checklist', 'aadhaar', 'bill', 'photo', 'proof', 'papers', 'bank account', 'cheque', 'what to submit', 'apply'],
    summary: 'Essential documents include latest electricity bill, identity proof (Aadhaar), rooftop photo, property ownership proof, and bank cancelled cheque.',
    details: `Based on the National Portal documentation checklist, you will need:
1. Latest Electricity Bill (showing consumer number, billing address, and sanctioned load).
2. Aadhaar Card of the registered electricity account holder.
3. Electricity Bill connection must match the name on the Aadhaar card (or succession/family declaration).
4. Bank Account Details (Cancelled cheque or passbook copy) with name matching the applicant for DBT transfer.
5. Recent Photograph of the rooftop area.
6. Vendor Installation Agreement (signed with an empaneled installer).
7. Joint Inspection & Commissioning Certificate (signed by installer and DISCOM testing officer post-installation).
Always keep clear PDF or JPG scans ready under 2 MB each.`,
    officialReference: 'National Portal for Rooftop Solar User Manual'
  },
  {
    id: 'steps-to-install',
    topic: 'Step-by-Step Installation & Application Roadmap',
    keywords: ['steps', 'next steps', 'process', 'how to install', 'roadmap', 'timeline', 'procedure', 'how to get solar', 'journey'],
    summary: '7-step journey from national portal registration, vendor selection, feasibility approval, physical installation, inspection, to DBT subsidy credit.',
    details: `Based on standard DISCOM and PM Surya Ghar workflows:
Step 1: Register on pmsuryaghar.gov.in with your Mobile Number, State, DISCOM, and Consumer Account Number.
Step 2: Submit Technical Feasibility Request online for your desired capacity (1 kW, 2 kW, 3 kW, etc.).
Step 3: DISCOM issues Technical Feasibility Approval (TFA) typically within 15-20 days.
Step 4: Select an empaneled vendor from the portal's approved list and sign the standard tripartite/vendor contract.
Step 5: Physical rooftop installation, wiring, inverter mounting, and earthing pit construction (takes 1-3 days).
Step 6: Submit Work Completion report; DISCOM inspects installation and installs the Bi-directional Net Meter.
Step 7: DISCOM generates online Commissioning Certificate. You enter bank details on the portal to receive your DBT subsidy.
Overall timeframe typically ranges from 4 to 8 weeks depending on local DISCOM workload.`,
    officialReference: 'PM Surya Ghar National Portal Standard Operating Procedure'
  },
  {
    id: 'system-sizing-guidelines',
    topic: 'How to Choose the Right Solar System Size',
    keywords: ['size', 'capacity', '1kw', '2kw', '3kw', '5kw', 'how many panels', 'how much do i need', 'sizing', 'consumption'],
    summary: 'Each 1 kW typically requires 9-10 sq.m of shadow-free roof and generates approx 120-130 kWh per month (4 units/day).',
    details: `Based on Indian solar insolation averages:
- 1 kW System: Requires ~100 sq ft (9.3 sq m) roof; generates ~120 units/month. Ideal for small 1-2 BHK with ~100-150 units/month consumption.
- 2 kW System: Requires ~200 sq ft (18.6 sq m) roof; generates ~240-260 units/month. Ideal for 2-3 BHK with 1-2 ceiling fans, refrigerator, washing machine, LED lights.
- 3 kW System: Requires ~300 sq ft (28 sq m) roof; generates ~360-400 units/month. Most popular for Indian 3 BHK households with 1 AC, refrigerator, mixer, TVs, geysers. Qualifies for maximum ₹78,000 subsidy!
- 4-5 kW System: Requires 400-500 sq ft roof; generates ~500-650 units/month. Recommended for homes with multiple 1.5 ton split ACs or electric vehicle (EV) charging.
Rule of thumb: Your system size in kW should ideally not exceed your sanctioned connected load from DISCOM without applying for load enhancement.`,
    officialReference: 'MNRE Rooftop Solar Technical Handbook'
  },
  {
    id: 'maintenance-and-lifespan',
    topic: 'Maintenance, Warranties, and Durability',
    keywords: ['maintenance', 'warranty', 'cleaning', 'life', 'lifespan', 'durability', 'breakdown', 'repairs', 'rain', 'hail', 'monsoon'],
    summary: 'Tier-1 solar modules have a 25-year performance warranty with minimal maintenance needed beyond periodic water cleaning.',
    details: `Based on standard industry specifications:
1. Solar Panel Lifespan: High quality Tier-1 Mono PERC panels feature 10-12 year product warranty and 25-year linear power warranty (guaranteeing >=80% efficiency after 25 years).
2. Inverter Lifespan: Grid-tie string inverters typically have 5 to 10 year manufacturer warranties; may need capacitor/fan service or replacement around year 10-12.
3. Routine Maintenance: Rooftop solar has zero moving parts. Simply spray clean water every 2 to 4 weeks during dry dusty seasons to prevent dust/soiling losses. During monsoons, rain naturally cleans the panels.
4. Extreme Weather: Tier-1 mounting structures are hot-dip galvanized and engineered to withstand cyclonic wind speeds up to 150 km/h.`,
    officialReference: 'MNRE Quality Control Standards for Grid-Tied Rooftop PV Systems'
  },
  {
    id: 'roof-suitability-and-shading',
    topic: 'Rooftop Types, Shading, and Area Requirements',
    keywords: ['roof', 'terrace', 'suitability', 'shading', 'shadow', 'area', 'sq ft', 'sq m', 'rcc', 'tin', 'sheet', 'obstruction'],
    summary: 'Flat concrete (RCC) terraces or pitched metal roofs with south-facing unobstructed sun exposure are ideal for residential solar.',
    details: `Based on rooftop engineering standards:
1. Area Rule: Approx 9.29 sq. meters (~100 sq. ft) of shadow-free rooftop space is required per 1 kW capacity.
2. Roof Types: Flat RCC concrete terraces are most convenient for standard tilted aluminum/GI mounting structures. Sloped tin/metal sheds are also suitable using trapezoidal clamps without roof puncture.
3. Shadows: Parapet walls, water tanks, trees, and adjacent buildings that cast shadows during peak sun hours (9 AM to 4 PM) must be avoided to prevent hotspotting and string derating.
4. Orientation: In the northern hemisphere (India), true South orientation at a 12° to 25° tilt angle yields optimum year-round generation.`,
    officialReference: 'National Institute of Solar Energy (NISE) Best Practices Guide'
  },
  {
    id: 'financial-savings-and-roi',
    topic: 'Electricity Bill Savings & Payback Calculation',
    keywords: ['savings', 'payback', 'roi', 'return on investment', 'bill reduction', 'free electricity', 'worth it'],
    summary: 'Residential solar typically pays for itself within 3 to 5 years, yielding over 20 years of essentially free electricity.',
    details: `Based on CERC and state tariff benchmarks:
1. Direct Bill Displacement: Solar units power your home loads first at zero marginal cost, eliminating top-tier tariff slabs (often ₹7 to ₹10/unit).
2. Payback Period: Calculated as Net Investment (Gross Cost minus DBT Subsidy) divided by Annual Electricity Savings. Typical payback is 3 to 4.5 years.
3. 25-Year Cumulative Returns: With retail electricity tariffs historically escalating at 3% to 5% annually, a 3 kW system saves over ₹5,00,000 to ₹7,00,000 across its 25-year operational life.`,
    officialReference: 'CERC Benchmark Capital Cost & Tariff Determination Guidelines'
  }
];

export function searchKnowledgeBase(query: string): SchemeKnowledgeItem[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return SCHEME_KNOWLEDGE_BASE.slice(0, 3);

  const words = normalizedQuery.split(/\s+/).filter(w => w.length > 2);

  const scored = SCHEME_KNOWLEDGE_BASE.map(item => {
    let score = 0;
    const itemText = (item.topic + ' ' + item.summary + ' ' + item.details + ' ' + item.keywords.join(' ')).toLowerCase();

    for (const word of words) {
      if (item.keywords.some(k => k.includes(word) || word.includes(k))) score += 5;
      if (item.topic.toLowerCase().includes(word)) score += 6;
      if (item.summary.toLowerCase().includes(word)) score += 3;
      if (itemText.includes(word)) score += 1;
    }
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const matched = scored.filter(s => s.score > 0).map(s => s.item);
  return matched.length > 0 ? matched.slice(0, 3) : SCHEME_KNOWLEDGE_BASE.slice(0, 2);
}
