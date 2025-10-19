const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

interface StateData {
  [key: string]: string
}

export async function getState(): Promise<StateData> {
  const response = await fetch(`${API_BASE_URL}/state`)
  if (!response.ok) throw new Error('Failed to fetch state')
  return response.json()
}

export async function updateState(state: StateData): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/state`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(state)
  })

  if (!response.ok) throw new Error('Failed to update state')
}
