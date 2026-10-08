export interface IndianStateData {
  state: string;
  majorCities: string[];
  discoms: string[];
  averageInsolationKwhPerSqm: number; // Daily kWh/m2
  averageTariffPerKwh: number; // In INR ₹
  stateSubsidyBonus: number; // Additional state top-up subsidy in INR
  solarYieldFactor: number; // Annual kWh generated per 1 kWp installed
  notes?: string;
}

export const INDIAN_STATES_DATA: IndianStateData[] = [
  {
    state: 'Maharashtra',
    majorCities: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Thane', 'Aurangabad', 'Kolhapur'],
    discoms: ['MSEDCL (Mahavitaran)', 'Tata Power (Mumbai)', 'Adani Electricity (Mumbai)', 'BEST'],
    averageInsolationKwhPerSqm: 5.2,
    averageTariffPerKwh: 8.5,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1480,
    notes: 'High residential electricity slabs (above 300 units tariff can exceed ₹11/unit), high payback speed.'
  },
  {
    state: 'Gujarat',
    majorCities: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Gandhinagar'],
    discoms: ['UGVCL', 'DGVCL', 'MGVCL', 'PGVCL', 'Torrent Power (Ahmedabad/Surat)'],
    averageInsolationKwhPerSqm: 5.6,
    averageTariffPerKwh: 7.2,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1560,
    notes: 'Pioneer in Surya Gujarat with streamlined fast-track net-metering approvals.'
  },
  {
    state: 'Karnataka',
    majorCities: ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi'],
    discoms: ['BESCOM (Bengaluru)', 'MESCOM', 'HESCOM', 'GESCOM', 'CESC'],
    averageInsolationKwhPerSqm: 5.3,
    averageTariffPerKwh: 8.0,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1490,
    notes: 'KERC simplified net-metering guidelines for systems under 10 kW.'
  },
  {
    state: 'Delhi (NCT)',
    majorCities: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'Dwarka', 'Rohini'],
    discoms: ['BSES Rajdhani (BRPL)', 'BSES Yamuna (BYPL)', 'Tata Power DDL (TPDDL)', 'NDMC'],
    averageInsolationKwhPerSqm: 5.0,
    averageTariffPerKwh: 7.5,
    stateSubsidyBonus: 2000, // Delhi Solar Policy generation-based incentive (GBI)
    solarYieldFactor: 1420,
    notes: 'Delhi Solar Policy offers GBI (Generation Based Incentive) of ₹2-3 per unit of solar generated.'
  },
  {
    state: 'Tamil Nadu',
    majorCities: ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli'],
    discoms: ['TANGEDCO'],
    averageInsolationKwhPerSqm: 5.4,
    averageTariffPerKwh: 7.8,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1520,
    notes: 'High solar insolation throughout the year, network charges applicable as per TNERC order.'
  },
  {
    state: 'Rajasthan',
    majorCities: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer'],
    discoms: ['JVVNL (Jaipur Discom)', 'AVVNL (Ajmer Discom)', 'JdVVNL (Jodhpur Discom)'],
    averageInsolationKwhPerSqm: 5.8,
    averageTariffPerKwh: 7.6,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1600,
    notes: 'Highest solar radiation in the country; generates over 1,600 units per kW annually.'
  },
  {
    state: 'Uttar Pradesh',
    majorCities: ['Lucknow', 'Noida', 'Greater Noida', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Ghaziabad'],
    discoms: ['MVVNL (Lucknow)', 'PVVNL (Meerut/Noida)', 'DVVNL (Agra)', 'PuVVNL (Varanasi)', 'NPCL (Greater Noida)'],
    averageInsolationKwhPerSqm: 4.9,
    averageTariffPerKwh: 7.4,
    stateSubsidyBonus: 15000, // UP state government top-up subsidy up to ₹15,000
    solarYieldFactor: 1410,
    notes: 'UP government provides additional state top-up subsidy of up to ₹15,000 for residential systems.'
  },
  {
    state: 'Kerala',
    majorCities: ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam'],
    discoms: ['KSEB (Kerala State Electricity Board)'],
    averageInsolationKwhPerSqm: 4.8,
    averageTariffPerKwh: 7.3,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1380,
    notes: 'Monsoon variations factored into annual generation estimates; popular Soura subsidy scheme.'
  },
  {
    state: 'Telangana',
    majorCities: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam'],
    discoms: ['TSSPDCL (Southern)', 'TSNPDCL (Northern)'],
    averageInsolationKwhPerSqm: 5.3,
    averageTariffPerKwh: 8.2,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1500,
    notes: 'TSREDCO single-window registration for rooftop solar net-metering.'
  },
  {
    state: 'Madhya Pradesh',
    majorCities: ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain'],
    discoms: ['MPPKVVCL (West - Indore)', 'MPPKVVCL (East - Jabalpur)', 'MPMKVVCL (Central - Bhopal)'],
    averageInsolationKwhPerSqm: 5.4,
    averageTariffPerKwh: 7.5,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1510,
    notes: 'Fast approvals through MP Urja Vikas Nigam portal.'
  },
  {
    state: 'Haryana',
    majorCities: ['Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Panchkula'],
    discoms: ['DHBVN (South)', 'UHBVN (North)'],
    averageInsolationKwhPerSqm: 5.1,
    averageTariffPerKwh: 7.5,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1440,
    notes: 'Mandatory solar provision for large residential plots above 500 sq yards.'
  },
  {
    state: 'West Bengal',
    majorCities: ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri'],
    discoms: ['WBSEDCL', 'CESC (Kolkata & Howrah)'],
    averageInsolationKwhPerSqm: 4.7,
    averageTariffPerKwh: 8.4,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1360,
    notes: 'High slab rates in CESC areas give rapid return on investment.'
  },
  {
    state: 'Punjab',
    majorCities: ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali'],
    discoms: ['PSPCL (Punjab State Power Corp)'],
    averageInsolationKwhPerSqm: 5.1,
    averageTariffPerKwh: 7.2,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1450,
    notes: 'Net metering available up to 80% of sanctioned connected load.'
  },
  {
    state: 'Andhra Pradesh',
    majorCities: ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore'],
    discoms: ['APEPDCL', 'APSPDCL', 'APCPDCL'],
    averageInsolationKwhPerSqm: 5.3,
    averageTariffPerKwh: 7.6,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1510,
    notes: 'NREDCAP portal facilitates fast-track vendor empanelment.'
  },
  {
    state: 'Other Indian States / UTs',
    majorCities: ['City Center', 'Metro Area'],
    discoms: ['State Electricity Department / DISCOM'],
    averageInsolationKwhPerSqm: 5.0,
    averageTariffPerKwh: 7.5,
    stateSubsidyBonus: 0,
    solarYieldFactor: 1440,
    notes: 'Standard National Portal for Rooftop Solar (pmsuryaghar.gov.in) rules apply.'
  }
];

export function getStateData(stateName: string): IndianStateData {
  const found = INDIAN_STATES_DATA.find(
    s => s.state.toLowerCase() === stateName.trim().toLowerCase()
  );
  return found || INDIAN_STATES_DATA[0];
}
