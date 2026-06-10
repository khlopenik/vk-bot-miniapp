export const API_BASE = 'https://vk-bot-2vns.onrender.com/api'

async function req(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) {
    let err
    try { err = await res.json() } catch { err = {} }
    throw Object.assign(new Error(err.error || `HTTP ${res.status}`), { code: err.error, status: res.status })
  }
  return res.json()
}

export const api = {
  me: (vk_id) => req(`/me?vk_id=${vk_id}`),
  tariffs: () => req('/tariffs'),
  models: () => req('/models'),
  history: (vk_id) => req(`/history?vk_id=${vk_id}`),
  pay: (vk_id, tariff) => req('/pay', { method: 'POST', body: JSON.stringify({ vk_id, tariff }) }),
  generate: (vk_id, photo_url, model_key, prompt) =>
    req('/generate', { method: 'POST', body: JSON.stringify({ vk_id, photo_url, model_key, prompt }) }),
  categories: () => req('/categories'),
  styles: (category_key) => req(`/styles/${category_key}`),
  styleOne: (style_id) => req(`/style-one/${style_id}`),
}
