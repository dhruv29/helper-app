const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `${method} ${path} → ${res.status}`)
  }
  return res.json()
}

export const api = {
  setup: (data) => req('POST', '/api/setup', data),
  alerts: {
    list:    (seniorId) => req('GET', `/api/alerts?senior_id=${seniorId}`),
    create:  (data)     => req('POST', '/api/alerts', data),
    resolve: (id)       => req('PATCH', `/api/alerts/${id}/resolve`, {}),
  },
  medications: {
    list:      (seniorId) => req('GET', `/api/medications?senior_id=${seniorId}`),
    markTaken: (id, taken = true) => req('PATCH', `/api/medications/${id}/taken`, { taken }),
  },
  wellness: {
    today:  (seniorId) => req('GET', `/api/wellness?senior_id=${seniorId}`),
    upsert: (data)     => req('PUT', '/api/wellness', data),
  },
  handoffs: {
    latest: (seniorId) => req('GET', `/api/handoffs/latest?senior_id=${seniorId}`),
    create: (data)     => req('POST', '/api/handoffs', data),
  },
  conversations: {
    start:      (seniorId) => req('POST', '/api/conversations', { senior_id: seniorId }),
    end:        (id, meta) => req('PATCH', `/api/conversations/${id}/end`, meta),
    getMessages:(id)       => req('GET', `/api/conversations/${id}/messages`),
    addMessage: (id, role, content) => req('POST', `/api/conversations/${id}/messages`, { role, content }),
  },
}
