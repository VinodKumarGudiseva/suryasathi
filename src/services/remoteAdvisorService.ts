import { AdvisorContext, AdvisorMessage, SolarPlan } from '../types/solar';
import { ISolarAdvisorService } from './interfaces';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

/**
 * Advisor that talks to the backend (/api/advisor), where the Strands agent + Gemini (or Bedrock) run.
 * Turn it on with VITE_ADVISOR="remote" in .env. It never falls back to the local mock:
 * if the backend fails, the chat drawer shows its normal "connection issue" message.
 */
export class RemoteSolarAdvisorAdapter implements ISolarAdvisorService {
  async askSolarAdvisor(
    question: string,
    context?: Partial<SolarPlan> | AdvisorContext,
    conversationHistory?: AdvisorMessage[]
  ): Promise<AdvisorMessage> {
    const res = await fetch(`${API_BASE}/api/advisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context, history: conversationHistory }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.success === false || !body?.data) {
      throw new Error(body?.error || `Advisor request failed (${res.status})`);
    }
    const message = body.data as AdvisorMessage;
    return {
      ...message,
      // The chat shows this string as-is, so use the same short local time format as the user's messages.
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
  }
}
