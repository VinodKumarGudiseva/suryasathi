import { BillData } from '../types/solar';

export interface BillValidationResult {
  isValid: boolean;
  sanitizedConsumptionKwh: number;
  sanitizedBillAmount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Validates and sanitizes household electricity consumption and bill amounts.
 * Prevents invalid values (NaN, negative, zero) while generating informative warnings
 * for abnormal patterns rather than unnecessarily blocking the user.
 */
export function validateBillData(
  consumptionKwh?: number | null,
  billAmount?: number | null,
  stateTariffFallback: number = 7.5
): BillValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const rawConsumption = Number(consumptionKwh);
  const rawBill = Number(billAmount);

  // 1. Consumption validation
  let sanitizedConsumption = 0;

  if (consumptionKwh === undefined || consumptionKwh === null || isNaN(rawConsumption)) {
    errors.push('Monthly electricity consumption is missing.');
  } else if (rawConsumption <= 0) {
    errors.push('Monthly electricity consumption must be greater than 0 kWh.');
  } else if (rawConsumption < 20) {
    warnings.push('Very low consumption (less than 20 kWh/month). Solar sizing may recommend the minimum 1 kW system.');
    sanitizedConsumption = Math.round(rawConsumption);
  } else if (rawConsumption > 5000) {
    warnings.push('High consumption for a residential connection (above 5,000 kWh/month). Sizing will cap at 10 kW standard residential meter limits.');
    sanitizedConsumption = Math.round(rawConsumption);
  } else {
    sanitizedConsumption = Math.round(rawConsumption);
  }

  // 2. Bill amount validation
  let sanitizedBill = 0;

  if (billAmount !== undefined && billAmount !== null && !isNaN(rawBill) && rawBill > 0) {
    sanitizedBill = Math.round(rawBill);
  } else if (sanitizedConsumption > 0) {
    // Graceful fallback to estimated bill amount using state tariff
    sanitizedBill = Math.round(sanitizedConsumption * stateTariffFallback);
  }

  if (rawBill < 0) {
    errors.push('Bill amount cannot be negative.');
  }

  // 3. Consistency check between bill amount and consumption
  if (sanitizedConsumption > 0 && sanitizedBill > 0) {
    const impliedTariff = sanitizedBill / sanitizedConsumption;
    if (impliedTariff < 2.0) {
      warnings.push(`Implied tariff of ₹${impliedTariff.toFixed(1)}/unit is unusually low. Please verify if monthly consumption matches the billing amount.`);
    } else if (impliedTariff > 25.0) {
      warnings.push(`Implied tariff of ₹${impliedTariff.toFixed(1)}/unit is unusually high. Please verify if arrears or commercial penalty charges are included.`);
    }
  }

  return {
    isValid: errors.length === 0 && sanitizedConsumption > 0,
    sanitizedConsumptionKwh: sanitizedConsumption > 0 ? sanitizedConsumption : 250,
    sanitizedBillAmount: sanitizedBill > 0 ? sanitizedBill : Math.round(250 * stateTariffFallback),
    errors,
    warnings,
  };
}
