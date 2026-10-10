import { TextractClient } from '@aws-sdk/client-textract';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getAwsRegion } from '../ai/config.js';

/**
 * Clients are created lazily (after dotenv has run) and use the standard AWS credential chain:
 * `aws configure` profile, or AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY, or an IAM role when deployed.
 * No keys are ever written in code.
 */
let textract: TextractClient | undefined;
let dynamo: DynamoDBDocumentClient | undefined;

export function getTextractClient(): TextractClient {
  textract ??= new TextractClient({ region: getAwsRegion() });
  return textract;
}

export function getDynamoDocClient(): DynamoDBDocumentClient {
  dynamo ??= DynamoDBDocumentClient.from(new DynamoDBClient({ region: getAwsRegion() }), {
    marshallOptions: { removeUndefinedValues: true },
  });
  return dynamo;
}
