import { SolarPlan } from '../types/solar';
import { ISolarPlanStorageService } from './interfaces';

const STORAGE_KEY = 'suryasathi_saved_plans_v1';

/**
 * Local Storage Adapter for Solar Plans
 *
 * Future AWS Implementation:
 * Replace this adapter with Amazon DynamoDB (DocumentClient) and Amazon S3:
 *
 * ```ts
 * import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
 * import { DynamoDBDocumentClient, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
 * const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));
 * // Store plan JSON in table "SuryaSathiPlans"
 * ```
 */
export class LocalStorageSolarPlanAdapter implements ISolarPlanStorageService {
  private getStore(): SolarPlan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as SolarPlan[];
    } catch (err) {
      console.warn('Failed to read from localStorage:', err);
      return [];
    }
  }

  private saveStore(plans: SolarPlan[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  }

  async saveSolarPlan(plan: SolarPlan): Promise<{ success: boolean; id: string }> {
    const plans = this.getStore();
    const existingIndex = plans.findIndex((p) => p.id === plan.id);
    if (existingIndex >= 0) {
      plans[existingIndex] = plan;
    } else {
      plans.unshift(plan);
    }
    this.saveStore(plans);
    return { success: true, id: plan.id };
  }

  async getSolarPlan(id: string): Promise<SolarPlan | null> {
    const plans = this.getStore();
    return plans.find((p) => p.id === id) || null;
  }

  async getAllSolarPlans(): Promise<SolarPlan[]> {
    return this.getStore();
  }

  async deleteSolarPlan(id: string): Promise<boolean> {
    const plans = this.getStore();
    const filtered = plans.filter((p) => p.id !== id);
    this.saveStore(filtered);
    return true;
  }
}

export const solarPlanStorageService = new LocalStorageSolarPlanAdapter();
