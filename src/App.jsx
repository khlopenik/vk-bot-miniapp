import { useEffect, useState, useCallback } from 'react'
import bridge from '@vkontakte/vk-bridge'
import { AdaptivityProvider, AppRoot, SplitLayout, SplitCol, View, Panel } from '@vkontakte/vkui'
import { api } from './api'
import './App.css'

const CATEGORIES = [
  { emoji: '⭐', label: 'Стандарт', model: 'std' },
  { emoji: '✨', label: 'Версия 2', model: 'v2' },
  { emoji: '💎', label: 'Про', model: 'pro' },
  { emoji: '🔥', label: 'Трендовые', model: 'v2' },
  { emoji: '🎂', label: 'День рождения', model: 'std' },
  { emoji: '💑', label: 'Парные фото', model: 'v2' },
  { emoji: '📄', label: 'Документы', model: 'std' },
  { emoji: '👨‍👩‍👧', label: 'Семья', model: 'v2' },
  { emoji: '💃', label: 'Танцы', model: 'pro' },
]

const HITS = [
  { title: 'чб волнистые волосы', model: 'std', prompt: 'черно-белое фото, волнистые волосы, студийный свет' },
  { title: 'природа поле лето', model: 'v2', prompt: 'природа, поле, лето, золотой час' },
  { title: 'деловой портрет', model: 'pro', prompt: 'деловой портрет в офисе, нейтральный фон' },
  { title: 'неоновый киберпанк', model: 'v2', prompt: 'киберпанк, неон, ночной город' },
]

export default function App() {
  const [vkUser, setVkUser] = useState(null)
  const [activeTab, setActiveTab] = useState('novichok')
  const [me, setMe] = useState(null)
  const [promoBanner, setPromoBanner] = useState(true)
  const [genPreset, setGenPreset] = useState(null) // { model, prompt }

  const refreshMe = useCallback((id) => {
    if (!id) return
    api.me(id).then(setMe).catch(() => {})
  }, [])

  useEffect(() => {
    const timeout = (ms) => new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))
    try { bridge.send('VKWebAppInit') } catch {}
    Promise.race([bridge.send('VKWebAppGetUserInfo'), timeout(5000)])
      .then((u) => { setVkUser(u); return api.me(u.id) })
      .then(setMe)
      .catch((e) => console.error('init', e))
  }, [])

  const goGenerate = (preset) => {
    setGenPreset(preset || null)
    setActiveTab('profi')
  }

  const goTariffs = () => setActiveTab('tariffs')

  const TABS = [
    { id: 'novichok', icon: '⭐', label: 'Новичок' },
    { id: 'profi',    icon: '💎', label: 'Профи' },
    { id: 'tariffs',  icon: '🛒', label: 'Тарифы' },
    { id: 'history',  icon: '🕐', label: 'История' },
    { id: 'profile',  icon: '👤', label: 'Профиль' },
  ]

  return (
    <AdaptivityProvider>
      <AppRoot>
        <SplitLayout>
          <SplitCol autoSpaced>
            <View activePanel={activeTab}>
              <Panel id="novichok">
                {promoBanner && <PromoBanner onClose={() => setPromoBanner(false)} />}
                <div className="scroll-area">
                  <NovichokTab onGenerate={goGenerate} onTariffs={goTariffs} me={me} />
                </div>
              </Panel>
              <Panel id="profi">
                {promoBanner && <PromoBanner onClose={() => setPromoBanner(false)} />}
                <div className="scroll-area">
                  <ProfiTab vkId={vkUser?.id} me={me} onDone={() => refreshMe(vkUser?.id)} preset={genPreset} onTariffs={goTariffs} />
                </div>
              </Panel>
              <Panel id="tariffs">
                {promoBanner && <PromoBanner onClose={() => setPromoBanner(false)} />}
                <div className="scroll-area">
                  <TariffsTab vkId={vkUser?.id} />
                </div>
              </Panel>
              <Panel id="history">
                {promoBanner && <PromoBanner onClose={() => setPromoBanner(false)} />}
                <div className="scroll-area">
                  <HistoryTab vkId={vkUser?.id} me={me} onTariffs={goTariffs} />
                </div>
              </Panel>
              <Panel id="profile">
                {promoBanner && <PromoBanner onClose={() => setPromoBanner(false)} />}
                <div className="scroll-area">
                  <ProfileTab vkId={vkUser?.id} vkUser={vkUser} me={me} onTariffs={goTariffs} />
                </div>
              </Panel>
            </View>
          </SplitCol>
        </SplitLayout>

        <div className="tabbar">
          {TABS.map(({ id, icon, label }) => (
            <button key={id} className={`tab-item${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>
              <span className="tab-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </AppRoot>
    </AdaptivityProvider>
  )
}

function PromoBanner({ onClose }) {
  return (
    <div className="promo-banner">
      🔥 -50% на все тарифы · Только сейчас!
      <button className="close" onClick={onClose}>✕</button>
    </div>
  )
}

/* ─── НОВИЧОК ─── */
function NovichokTab({ onGenerate, onTariffs, me }) {
  return (
    <>
      <div className="section">
        <div className="section-title">Выбери стиль</div>
        <div className="section-sub">Нажми на категорию — загрузишь фото на следующем шаге</div>
      </div>
      <div className="cat-grid">
        {CATEGORIES.map((c) => (
          <div key={c.label} className="cat-item" onClick={() => onGenerate({ model: c.model, prompt: c.label })}>
            <span className="cat-emoji">{c.emoji}</span>
            <span className="cat-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-title">⭐ Хиты</div>
        <div className="section-sub" style={{ marginBottom: 12 }}>Повтори понравившийся стиль</div>
      </div>
      <div className="hits-grid">
        {HITS.map((h) => (
          <div key={h.title} className="hit-card" onClick={() => onGenerate({ model: h.model, prompt: h.prompt })}>
            <div style={{ background: 'var(--card2)', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🪄</div>
            <div className="hit-badge">⭐ ХИТ</div>
            <div className="hit-title">{h.title}</div>
            <button className="hit-btn">✨ Повторить</button>
          </div>
        ))}
      </div>
    </>
  )
}

/* ─── ПРОФИ (Генерация) ─── */
const MODELS_LIST = [
  { key: 'std',      label: '⭐ Стандарт',    tab: 'std' },
  { key: 'v2',       label: '✨ Версия 2',     tab: 'std' },
  { key: 'pro',      label: '💎 Про',          tab: 'std' },
  { key: 'nb_edit',  label: '⭐ Nano Banana',  tab: 'diamond' },
  { key: 'nb2_edit', label: '✨ Nano Banana 2',tab: 'diamond' },
  { key: 'gpt4o',    label: '🤖 GPT-4o',       tab: 'diamond' },
  { key: 'gpt_img2', label: '🤖 GPT Image 2',  tab: 'diamond' },
  { key: 'flux_pro', label: '⚡ Flux Pro',      tab: 'diamond' },
  { key: 'pulid',    label: '🎭 PuLID',         tab: 'diamond' },
]
const FORMATS = ['1:1','2:3','3:4','4:5','9:16','16:9','4:3']

function ProfiTab({ vkId, me, onDone, preset, onTariffs }) {
  const [modelTab, setModelTab] = useState('std')
  const [model, setModel] = useState(preset?.model || 'std')
  const [prompt, setPrompt] = useState(preset?.prompt || '')
  const [format, setFormat] = useState('9:16')
  const [photoUrl, setPhotoUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)

  useEffect(() => {
    if (preset) { setModel(preset.model); setPrompt(preset.prompt || '') }
  }, [preset])

  const filteredModels = MODELS_LIST.filter(m => m.tab === modelTab)

  const pickPhoto = async () => {
    setError(null)
    try {
      const r = await bridge.send('VKWebAppOpenFiles', { count: 1 })
      const file = r?.files?.[0] || r?.urls?.[0]
      const url = typeof file === 'string' ? file : file?.url
      if (url) setPhotoUrl(url)
      else setError('Не удалось получить фото')
    } catch {
      setError('Загрузка доступна только в мобильном приложении VK')
    }
  }

  const generate = async () => {
    if (!vkId || !photoUrl || !model) return
    setBusy(true); setError(null); setResultUrl(null)
    try {
      const r = await api.generate(vkId, photoUrl, model, prompt)
      setResultUrl(r.result_url)
      onDone?.()
    } catch (e) {
      if (e.code === 'no_credits') {
        setError('Недостаточно кредитов')
      } else {
        setError('Ошибка генерации. Попробуйте снова.')
      }
    } finally { setBusy(false) }
  }

  const reset = () => { setPhotoUrl(''); setResultUrl(null); setError(null) }

  if (resultUrl) {
    return (
      <div className="gen-wrap">
        <div className="gen-header"><span className="gen-title">Готово! 🎉</span></div>
        <img src={resultUrl} alt="Результат" className="result-img" />
        <div className="btn-wrap">
          <button className="btn btn-primary" onClick={() => bridge.send('VKWebAppShare', { link: resultUrl })}>Поделиться</button>
          <button className="btn btn-secondary" onClick={reset}>Сгенерировать ещё</button>
        </div>
      </div>
    )
  }

  return (
    <div className="gen-wrap">
      <div className="gen-header">
        <span className="gen-title">Профи</span>
        <div className="diamond-pill">💎 {me?.diamond_credits || 0} <span style={{fontSize:12,color:'var(--muted)'}}>Пополнить ▶</span></div>
      </div>

      {/* Model tab toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        {[['std','⭐ Стандарт'],['diamond','💎 Алмазные']].map(([t,l]) => (
          <button key={t} onClick={() => setModelTab(t)} style={{
            flex:1, padding:'8px', borderRadius:10, border:'1px solid var(--border)',
            background: modelTab===t ? 'var(--purple-soft)' : 'var(--card)',
            color: modelTab===t ? 'var(--purple-l)' : 'var(--muted)',
            fontWeight:600, fontSize:13, cursor:'pointer'
          }}>{l}</button>
        ))}
      </div>

      <div className="field-label">МОДЕЛЬ</div>
      <select className="model-select" value={model} onChange={e => setModel(e.target.value)}>
        <option value="">Выберите свою модель ▼</option>
        {filteredModels.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
      </select>

      <div className="field-label">ПРОМПТ</div>
      <textarea
        className="prompt-area"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="Опиши стиль, образ, локацию..."
        rows={3}
      />
      <div className="tip-box">💡 Чем подробнее промпт — тем лучше результат. Опиши стиль одежды, освещение, фон и настроение.</div>

      <div className="field-label">ФОРМАТ</div>
      <div className="formats" style={{marginBottom:16}}>
        {FORMATS.map(f => (
          <button key={f} className={`fmt-btn${format===f?' active':''}`} onClick={() => setFormat(f)}>{f}</button>
        ))}
      </div>

      <div className="field-label">ФОТО</div>
      {photoUrl
        ? <>
            <img src={photoUrl} alt="" className="photo-preview" />
            <button className="btn btn-secondary mb12" onClick={() => setPhotoUrl('')}>Сменить фото</button>
          </>
        : <div className="photo-upload" onClick={pickPhoto}>
            <div className="icon">📷</div>
            <div className="label">Нажми чтобы выбрать фото из галереи</div>
          </div>
      }

      {error && (
        <div>
          <div className="error-msg">{error}</div>
          {error.includes('кредит') && (
            <div className="btn-wrap"><button className="btn btn-outline" onClick={onTariffs}>Купить кредиты →</button></div>
          )}
        </div>
      )}

      <button
        className="btn btn-primary"
        disabled={busy || !photoUrl || !model}
        onClick={generate}
      >
        {busy ? '⏳ Генерирую...' : '✨ Сгенерировать'}
      </button>
    </div>
  )
}

/* ─── ТАРИФЫ ─── */
const STD_TARIFFS = [
  { key:'trial',   label:'Пробный пакет', desc:'3 фото во всех версиях · ⭐ Стандарт · ✨ Версия 2 · 💎 Про', price:74, oldPrice:149, badge:'ДЛЯ НОВИЧКОВ · САМЫЙ ПОПУЛЯРНЫЙ', featured:true },
  { key:'std_1',   label:'1 фото',  price:39, oldPrice:79 },
  { key:'std_10',  label:'10 фото', price:295, oldPrice:590, perPhoto:'29 ₽/фото', discount:'-50%', popular:true },
  { key:'std_30',  label:'30 фото', price:745, oldPrice:1490, perPhoto:'24 ₽/фото', discount:'-50%' },
  { key:'std_50',  label:'50 фото', price:995, oldPrice:1990, perPhoto:'19 ₽/фото', discount:'-50%' },
]
const PRO_TARIFFS = [
  { key:'diamond_500',  label:'500 алмазов',  price:245, oldPrice:490 },
  { key:'diamond_1500', label:'1500 алмазов', price:645, oldPrice:1290, popular:true },
  { key:'diamond_3000', label:'3000 алмазов', price:1245, oldPrice:2490, discount:'-50%' },
  { key:'diamond_6000', label:'6000 алмазов', price:1995, oldPrice:3990, discount:'-50%' },
]

function TariffsTab({ vkId }) {
  const [tab, setTab] = useState('std')
  const [promo, setPromo] = useState('')
  const [busyKey, setBusyKey] = useState(null)
  const [error, setError] = useState(null)

  const buy = async (key) => {
    if (!vkId) return
    setBusyKey(key); setError(null)
    try {
      const r = await api.pay(vkId, key)
      if (r.confirmation_url) await bridge.send('VKWebAppOpenLink', { link: r.confirmation_url })
    } catch { setError('Ошибка платежа. Попробуйте позже.') }
    finally { setBusyKey(null) }
  }

  const tariffs = tab === 'std' ? STD_TARIFFS : PRO_TARIFFS
  const featured = tariffs.find(t => t.featured)
  const rest = tariffs.filter(t => !t.featured)

  return (
    <>
      <div className="tariff-toggle">
        <button className={tab==='std'?'active':''} onClick={() => setTab('std')}>⭐ Новичок</button>
        <button className={tab==='pro'?'active':''} onClick={() => setTab('pro')}>💎 Продвинутый</button>
      </div>

      <div className="promo-row">
        <input className="promo-input" placeholder="ПРОМОКОД" value={promo} onChange={e => setPromo(e.target.value.toUpperCase())} />
        <button className="btn-sm" style={{padding:'12px 16px'}}>Применить</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {featured && (
        <div className="tariff-featured">
          <div className="tariff-badge">{featured.badge}</div>
          <h3>{featured.label}</h3>
          <p>{featured.desc}</p>
          <div className="price-row">
            <div><span className="price-old">{featured.oldPrice} ₽</span><span className="price-new">{featured.price} ₽</span></div>
            <button className="btn-sm" disabled={busyKey===featured.key} onClick={() => buy(featured.key)}>
              {busyKey===featured.key ? '...' : 'Купить →'}
            </button>
          </div>
        </div>
      )}

      {rest.map(t => (
        <div key={t.key} className={`tariff-card${t.popular?' popular':''}`}>
          <div className="tariff-card-left">
            <h4>{t.label}</h4>
            {t.popular && <div className="pop-badge">Популярное</div>}
            {t.perPhoto && <div style={{fontSize:12,color:'var(--muted)',marginTop:4}}>{t.perPhoto}</div>}
          </div>
          <div className="tariff-card-right">
            {t.oldPrice && <div className="p-old">{t.oldPrice} ₽</div>}
            <div className="p-new">{t.price} ₽</div>
            {t.discount && <div className="p-badge">{t.discount}</div>}
            <button className="btn-sm" style={{marginTop:6}} disabled={busyKey===t.key} onClick={() => buy(t.key)}>
              {busyKey===t.key ? '...' : 'Купить'}
            </button>
          </div>
        </div>
      ))}
    </>
  )
}

/* ─── ИСТОРИЯ ─── */
function HistoryTab({ vkId, me, onTariffs }) {
  const [items, setItems] = useState(null)
  const load = useCallback(() => {
    if (!vkId) return
    setItems(null)
    api.history(vkId).then(r => setItems(r.history || [])).catch(() => setItems([]))
  }, [vkId])

  useEffect(() => { load() }, [load])

  return (
    <>
      <div className="top-bar">
        <div className="logo">FR<span>A</span>ME</div>
        <button className="btn-balance" onClick={onTariffs}>💳 Баланс</button>
      </div>
      <div className="section">
        <div className="section-action">
          <div>
            <div className="section-title">История</div>
            <div className="section-sub">Все твои генерации</div>
          </div>
          <button className="refresh-btn" onClick={load}>🔄 Обновить</button>
        </div>
      </div>
      {items === null
        ? <div className="spinner-wrap"><div className="spinner" /></div>
        : items.length === 0
          ? <div className="empty"><div className="icon">🖼️</div><div>Пока пусто — начни генерацию!</div></div>
          : <div className="hist-grid">
              {items.map((it, i) => (
                <img key={i} src={it.result_url} alt="" className="hist-img" onClick={() => bridge.send('VKWebAppOpenLink', { link: it.result_url })} />
              ))}
            </div>
      }
    </>
  )
}

/* ─── ПРОФИЛЬ ─── */
function ProfileTab({ vkId, vkUser, me, onTariffs }) {
  const copyRef = () => {
    const link = `https://vk.com/app54628838`
    try { bridge.send('VKWebAppCopyText', { text: link }) } catch {}
  }

  return (
    <>
      <div className="top-bar">
        <div className="logo">FR<span>A</span>ME</div>
        <button className="btn-balance" onClick={onTariffs}>💳 Баланс</button>
      </div>

      <div className="section" style={{paddingBottom:12}}>
        <div className="section-title">Мой профиль</div>
      </div>

      <div className="profile-card">
        <div className="card-label">МОЙ БАЛАНС</div>
        <div className="balance-tiles">
          <div className="balance-tile">
            <div className={`val v-std`}>{me?.std_credits ?? 0}</div>
            <div className="lbl">⭐ Стандарт</div>
          </div>
          <div className="balance-tile">
            <div className={`val v-v2`}>{me?.v2_credits ?? 0}</div>
            <div className="lbl">✨ Версия 2</div>
          </div>
          <div className="balance-tile">
            <div className={`val v-pro`}>{me?.pro_credits ?? 0}</div>
            <div className="lbl">💎 Про</div>
          </div>
        </div>
      </div>

      <button className="btn-diamonds" onClick={onTariffs}>
        💠 Пополнить · алмазы
      </button>

      <div className="profile-card">
        <div style={{fontSize:14,fontWeight:700,color:'var(--orange)',marginBottom:10}}>🎫 Промокод</div>
        <div className="promo-row" style={{padding:0}}>
          <input className="promo-input" placeholder="ВВЕДИ ПРОМОКОД" style={{flex:1}} />
          <button className="btn-sm" style={{padding:'12px 16px'}}>Применить</button>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-section-header">
          <span>❤️ Избранное</span>
          <span style={{color:'var(--dim)'}}>—</span>
        </div>
      </div>

      <div className="profile-section">
        <div className="profile-section-header">🤝 Приглашай · зарабатывай бонусы</div>
        <div className="ref-stats">
          <div className="ref-stat">
            <div className="val">0</div>
            <div className="lbl">Перешли по ссылке</div>
          </div>
          <div className="ref-stat">
            <div className="val">0</div>
            <div className="lbl">Купили → +фото тебе</div>
          </div>
        </div>
        <div style={{padding:'0 16px',fontSize:13,color:'var(--muted)',marginBottom:10,lineHeight:1.5}}>
          👥 За каждого друга → <span style={{color:'var(--green)',fontWeight:700}}>+5 фото</span> тебе на баланс<br/>
          🚀 5+ человек → скидка <span style={{color:'var(--green)',fontWeight:700}}>-10%</span> навсегда
        </div>
        <div className="ref-link-box">https://vk.com/app54628838</div>
        <div className="px16 mb12">
          <button className="btn btn-secondary" style={{padding:'12px'}} onClick={copyRef}>📋 Скопировать ссылку</button>
        </div>
      </div>

      <div className="partner-card">
        <h4>💰 Партнёрская программа</h4>
        <p>Приводи людей в FRAME и получай <span style={{color:' var(--green)',fontWeight:700}}>30%</span> с каждой их оплаты — навсегда. 🤑</p>
        <button className="btn btn-green" style={{padding:'12px'}} onClick={() => bridge.send('VKWebAppOpenLink', { link: 'https://vk.com/club239444342' })}>
          🚀 Стать партнёром
        </button>
      </div>

      <button className="support-btn" onClick={() => bridge.send('VKWebAppOpenLink', { link: 'https://vk.com/club239444342' })}>
        💬 Написать в поддержку
      </button>
    </>
  )
}
