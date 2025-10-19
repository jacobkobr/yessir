const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getParameter(): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/config`)
  if (!response.ok) throw new Error('Failed to fetch parameter')
  const data = await response.json()
  return data.value
}

export async function putParameter(value: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ value })
  })

  if (!response.ok) throw new Error('Failed to save parameter')
}
