import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm'

const getSSMClient = () => {
  return new SSMClient({
    region: import.meta.env.VITE_AWS_REGION,
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
    }
  })
}

export async function getParameter(): Promise<string> {
  const client = getSSMClient()
  const parameterName = import.meta.env.VITE_AWS_SSM_PARAMETER

  try {
    const command = new GetParameterCommand({
      Name: parameterName,
      WithDecryption: true
    })
    const response = await client.send(command)
    return response.Parameter?.Value || ''
  } catch (error) {
    throw new Error('Failed to fetch parameter: ' + (error as Error).message)
  }
}

export async function putParameter(value: string): Promise<void> {
  const client = getSSMClient()
  const parameterName = import.meta.env.VITE_AWS_SSM_PARAMETER

  try {
    const command = new PutParameterCommand({
      Name: parameterName,
      Value: value,
      Type: 'String',
      Overwrite: true
    })
    await client.send(command)
  } catch (error) {
    throw new Error('Failed to save parameter: ' + (error as Error).message)
  }
}
