export const API_BASE = 'https://vk-bot-2vns.onrender.com/api'

async function req(path, opts = {}, timeoutMs = 25000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      ...opts,
    })
    if (!res.ok) {
      let err
      try { err = await res.json() } catch { err = {} }
      throw Object.assign(new Error(err.error || `HTTP ${res.status}`), { code: err.error, status: res.status })
    }
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

export const api = {
  me: (vk_id) => req(`/me?vk_id=${vk_id}`),
  uploadPhoto: async (file) => {
    const fd = new FormData()
    fd.append('photo', file)
    const res = await fetch(`${API_BASE}/upload-photo`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error('upload failed')
    return res.json()
  },
  tariffs: () => req('/tariffs'),
  models: () => req('/models'),
  history: (vk_id) => req(`/history?vk_id=${vk_id}`),
  // pay: Render cold start ~30 сек → timeout 60 сек
  pay: (vk_id, tariff) => req('/pay', { method: 'POST', body: JSON.stringify({ vk_id, tariff }) }, 60000),
  support: (vk_id, kind) => req('/support', { method: 'POST', body: JSON.stringify({ vk_id, kind }) }),
  generate: (vk_id, photo_url, model_key, prompt, size = 'vert') =>
    req('/generate', { method: 'POST', body: JSON.stringify({ vk_id, photo_url, model_key, prompt, size }) }, 120000),
  sendPhoto: (vk_id, photo_url) => req('/send-photo', { method: 'POST', body: JSON.stringify({ vk_id, photo_url }) }, 30000),
  categories: () => req('/categories'),
  styles: (category_key) => req(`/styles/${category_key}`),
  styleOne: (style_id) => req(`/style-one/${style_id}`),
}
