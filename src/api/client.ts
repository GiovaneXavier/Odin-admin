/**
 * Typed REST client for future backend integration.
 *
 * Currently the app persists all data in localStorage (storageMode='local').
 * When storageMode='remote', these helpers will be used to call a real API
 * instead of reading/writing to localStorage.
 *
 * Usage:
 *   const client = createApiClient(settings.apiBaseUrl)
 *   const employees = await client.get<Employee[]>('/employees')
 *   await client.post('/employees', newEmployee)
 */

export interface ApiError {
  status: number
  message: string
}

export interface ApiClient {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
  put<T>(path: string, body: unknown): Promise<T>
  delete(path: string): Promise<void>
}

export function createApiClient(baseUrl: string): ApiClient {
  const url = (path: string) => `${baseUrl.replace(/\/$/, '')}${path}`

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(url(path), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const message = await res.text().catch(() => res.statusText)
      const error: ApiError = { status: res.status, message }
      throw error
    }

    if (res.status === 204) return undefined as unknown as T
    return res.json() as Promise<T>
  }

  return {
    get:    <T>(path: string)                    => request<T>('GET',    path),
    post:   <T>(path: string, body: unknown)     => request<T>('POST',   path, body),
    put:    <T>(path: string, body: unknown)     => request<T>('PUT',    path, body),
    delete: (path: string)                        => request<void>('DELETE', path),
  }
}
