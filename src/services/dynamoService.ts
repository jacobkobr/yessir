import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'

interface StateData {
  [key: string]: string
}

const getDynamoClient = () => {
  const client = new DynamoDBClient({
    region: import.meta.env.VITE_AWS_REGION,
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
    }
  })
  return DynamoDBDocumentClient.from(client)
}

export async function getState(): Promise<StateData> {
  const client = getDynamoClient()
  const tableName = import.meta.env.VITE_AWS_DYNAMODB_TABLE

  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: { id: 'app-state' }
    })
    const response = await client.send(command)
    return response.Item?.state || {}
  } catch (error) {
    throw new Error('Failed to fetch state: ' + (error as Error).message)
  }
}

export async function updateState(state: StateData): Promise<void> {
  const client = getDynamoClient()
  const tableName = import.meta.env.VITE_AWS_DYNAMODB_TABLE

  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: {
        id: 'app-state',
        state: state
      }
    })
    await client.send(command)
  } catch (error) {
    throw new Error('Failed to update state: ' + (error as Error).message)
  }
}
