import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3'

const getS3Client = () => {
  return new S3Client({
    region: import.meta.env.VITE_AWS_REGION,
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY
    }
  })
}

export async function fetchLogs(): Promise<string[]> {
  const client = getS3Client()
  const bucket = import.meta.env.VITE_AWS_S3_BUCKET

  try {
    const command = new ListObjectsV2Command({
      Bucket: bucket
    })
    const response = await client.send(command)
    return response.Contents?.map(obj => obj.Key || '') || []
  } catch (error) {
    throw new Error('Failed to fetch logs: ' + (error as Error).message)
  }
}

export async function uploadLog(file: File): Promise<void> {
  const client = getS3Client()
  const bucket = import.meta.env.VITE_AWS_S3_BUCKET

  try {
    const arrayBuffer = await file.arrayBuffer()
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: file.name,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type
    })
    await client.send(command)
  } catch (error) {
    throw new Error('Failed to upload log: ' + (error as Error).message)
  }
}
