import { PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../database/dynamodb.js';

const TABLE = 'fit_users';

export async function findByEmail(email) {
  const res = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: 'email-index',
    KeyConditionExpression: 'email = :email',
    ExpressionAttributeValues: { ':email': email },
    Limit: 1,
  }));
  return res.Items?.[0] || null;
}

export async function findById(id) {
  const res = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }));
  return res.Item || null;
}

export async function createUser(user) {
  await docClient.send(new PutCommand({ TableName: TABLE, Item: user }));
  return user;
}

export async function updateProfile(id, fields) {
  const keys = Object.keys(fields);
  const UpdateExpression = 'SET ' + keys.map((k, i) => `#f${i} = :v${i}`).join(', ');
  const ExpressionAttributeNames = Object.fromEntries(keys.map((k, i) => [`#f${i}`, k]));
  const ExpressionAttributeValues = Object.fromEntries(keys.map((k, i) => [`:v${i}`, fields[k]]));

  const res = await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id },
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues: 'ALL_NEW',
  }));
  return res.Attributes;
}
