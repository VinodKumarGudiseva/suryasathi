import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { SolarPlan } from '../../src/types/solar.js';
import { getDynamoDocClient } from './clients.js';

const RETENTION_DAYS = 30;
const MAX_PLAN_BYTES = 300 * 1024; // DynamoDB item limit is 400 KB

export type DocSend = (command: any) => Promise<any>;

export function tableName(): string {
  return (process.env.AWS_DYNAMODB_TABLE_PLANS || 'SuryaSathiPlans').trim();
}

/** Anonymous per-browser id. Not a login: it only keeps one visitor's plans apart from another's. */
export function isValidOwnerId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(value);
}

/**
 * Plans live in DynamoDB. Partition key = ownerId, sort key = id, so a visitor can only
 * list their own plans. `expiresAt` (epoch seconds) supports a DynamoDB TTL rule so old plans delete themselves.
 */
export class DynamoPlanStore {
  constructor(private send: DocSend = (cmd) => getDynamoDocClient().send(cmd), private table = tableName()) {}

  async save(ownerId: string, plan: SolarPlan): Promise<void> {
    if (Buffer.byteLength(JSON.stringify(plan)) > MAX_PLAN_BYTES) throw new Error('Plan is too large to save.');
    await this.send(
      new PutCommand({
        TableName: this.table,
        Item: {
          ownerId,
          id: plan.id,
          plan,
          updatedAt: new Date().toISOString(),
          expiresAt: Math.floor(Date.now() / 1000) + RETENTION_DAYS * 86400,
        },
      })
    );
  }

  async get(ownerId: string, id: string): Promise<SolarPlan | null> {
    const res = await this.send(new GetCommand({ TableName: this.table, Key: { ownerId, id } }));
    return (res?.Item?.plan as SolarPlan) ?? null;
  }

  async list(ownerId: string): Promise<SolarPlan[]> {
    const res = await this.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: 'ownerId = :o',
        ExpressionAttributeValues: { ':o': ownerId },
        Limit: 100,
      })
    );
    const plans = ((res?.Items || []) as Array<{ plan: SolarPlan }>).map((i) => i.plan);
    return plans.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.send(new DeleteCommand({ TableName: this.table, Key: { ownerId, id } }));
  }
}
