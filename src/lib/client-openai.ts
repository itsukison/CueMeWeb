export async function generateEmbeddingClient(text: string): Promise<number[]> {
  const response = await fetch('/api/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to generate embedding')
  }

  const { embedding } = await response.json()
  return embedding
}