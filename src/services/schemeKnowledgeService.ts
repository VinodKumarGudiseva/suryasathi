import { searchKnowledgeBase } from '../data/schemeKnowledgeBase';
import { SchemeKnowledgeItem } from '../types/solar';
import { ISchemeKnowledgeService } from './interfaces';

/**
 * Local / Curated Scheme Knowledge Service
 *
 * Future AWS Implementation:
 * Replace this adapter with an Amazon Bedrock Knowledge Base query:
 *
 * ```ts
 * import { BedrockAgentRuntimeClient, RetrieveCommand } from "@aws-sdk/client-bedrock-agent-runtime";
 * const client = new BedrockAgentRuntimeClient({ region: process.env.AWS_REGION });
 * const response = await client.send(new RetrieveCommand({
 *   knowledgeBaseId: process.env.AWS_BEDROCK_KB_ID,
 *   retrievalQuery: { text: query }
 * }));
 * ```
 */
export class LocalSchemeKnowledgeAdapter implements ISchemeKnowledgeService {
  async searchSchemeKnowledge(query: string): Promise<SchemeKnowledgeItem[]> {
    // Simulate brief vector index search latency
    await new Promise((resolve) => setTimeout(resolve, 250));
    return searchKnowledgeBase(query);
  }
}

export const schemeKnowledgeService = new LocalSchemeKnowledgeAdapter();
