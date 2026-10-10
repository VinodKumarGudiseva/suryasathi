import { SolarPlan } from '../types/solar';
import { ISolarPlanStorageService } from './interfaces';

const OWNER_KEY = 'suryasathi_owner_id_v1';
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

/** Anonymous id kept in this browser, so the server can keep each visitor's plans separate. */
function getOwnerId(): string {
  try {
    let id = localStorage.getItem(OWNER_KEY);
    if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}${Math.random().toString(36).slice(2)}`).replace(/[^A-Za-z0-9_-]/g, '');
      if (id.length < 16) id = id.padEnd(16, '0');
      localStorage.setItem(OWNER_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous-session-0000';
  }
}

/**
 * Plan storage through the backend (Amazon DynamoDB). Same contract as the local adapter.
 * Turn it on with VITE_PLAN_STORAGE=dynamodb in .env AND PLAN_STORAGE=dynamodb for the server.
 */
export class RemoteSolarPlanAdapter implements ISolarPlanStorageService {
  private async call(path: string, init: RequestInit = {}): Promise<any> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'x-owner-id': getOwnerId(), ...(init.headers || {}) },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false) throw new Error(body?.error || `Request failed (${res.status})`);
    return body;
  }

  async saveSolarPlan(plan: SolarPlan): Promise<{ success: boolean; id: string }> {
    await this.call('/api/plans', { method: 'POST', body: JSON.stringify({ plan }) });
    return { success: true, id: plan.id };
  }

  async getSolarPlan(id: string): Promise<SolarPlan | null> {
    try {
      return (await this.call(`/api/plans/${encodeURIComponent(id)}`)).data as SolarPlan;
    } catch {
      return null;
    }
  }

  async getAllSolarPlans(): Promise<SolarPlan[]> {
    try {
      return ((await this.call('/api/plans')).data as SolarPlan[]) || [];
    } catch {
      return [];
    }
  }

  async deleteSolarPlan(id: string): Promise<boolean> {
    try {
      await this.call(`/api/plans/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return true;
    } catch {
      return false;
    }
  }
}
