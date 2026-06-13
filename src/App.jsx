import { useEffect, useState, useCallback, useRef } from 'react'
import bridge from '@vkontakte/vk-bridge'
import { api } from './api'
import './App.css'

/* ── DATA ── */
const CATEGORIES = [
  { emoji: '🔥', label: 'Трендовые',    key: 'trending' },
  { emoji: '🌿', label: 'Природа',      key: 'nature' },
  { emoji: '🏙️', label: 'Город',        key: 'city' },
  { emoji: '💼', label: 'Деловой',      key: 'business' },
  { emoji: '🎭', label: 'Арт',          key: 'art' },
  { emoji: '🎂', label: 'Праздник',     key: 'holiday' },
  { emoji: '💑', label: 'Парные',       key: 'couples' },
  { emoji: '👨‍👩‍👧', label: 'Семья',       key: 'family' },
  { emoji: '🌸', label: 'Ню',           key: 'nude' },
  { emoji: '💃', label: 'Танцы',        key: 'dance' },
  { emoji: '🎬', label: 'Видео',        key: 'video' },
  { emoji: '✈️', label: 'Путешествия',  key: 'travel' },
]

const HITS = [
  { title: 'чб волнистые волосы', desc: '⭐ Стандарт', prompt: 'черно-белое фото, волнистые волосы, студийный свет' },
  { title: 'природа поле лето',   desc: '✨ Версия 2',  prompt: 'природа, поле, лето, золотой час' },
  { title: 'деловой портрет',     desc: '💎 Про',       prompt: 'деловой портрет в офисе, нейтральный фон' },
  { title: 'неоновый киберпанк',  desc: '✨ Версия 2',  prompt: 'киберпанк, неон, ночной город' },
]

const PHOTO_MODELS_GROUPS = [
  { label: '🍌 Нано-Банан', models: [
    { key: 'nb_edit',    name: '🍌 Нано-Банан',     sub: 'Быстрый · хорошее сходство',   price: '79 💎' },
    { key: 'nb2_edit',   name: '🍌 Нано-Банан 2',   sub: 'Улучшенное качество',           price: '99 💎' },
    { key: 'nbpro_edit', name: '🍌 Нано-Банан Про',  sub: 'Максимальное сходство',         price: '149 💎' },
  ]},
  { label: '🤖 GPT', models: [
    { key: 'gpt4o',    name: 'GPT-4o',       sub: 'OpenAI · креативный',    price: '99 💎' },
    { key: 'gpt_img2', name: 'GPT Image 2',  sub: 'OpenAI · улучшенный',    price: '199 💎' },
  ]},
  { label: '🌿 Seedream', models: [
    { key: 'sd5_edit', name: 'Seedream 5.0', sub: 'ByteDance · новейшая · дёшево', price: '39 💎' },
    { key: 'seedream', name: 'Seedream 4.5', sub: 'ByteDance · детализация',       price: '99 💎' },
  ]},
  { label: '⚡ Другие', models: [
    { key: 'grok_i2i', name: 'Grok Imagine', sub: 'xAI · стильный результат',      price: '99 💎' },
    { key: 'kling_o3', name: 'Kling O3',      sub: 'Kling · реализм',               price: '79 💎' },
    { key: 'flux_pro', name: 'Flux Pro',      sub: 'Black Forest · высокое качество',price: '79 💎' },
    { key: 'flux_max', name: 'Flux Max',      sub: 'Black Forest · максимум',        price: '99 💎' },
    { key: 'pulid',    name: 'Flux PuLID',    sub: 'Точное сходство лица',           price: '99 💎' },
  ]},
]

const VIDEO_MODELS_GROUPS = [
  { label: '✨ Оживление фото', models: [
    { key: 'wan27_i2v',       name: 'WAN 2.7',              sub: 'Alibaba · быстро и дёшево',        price: '99 💎' },
    { key: 'seedance',        name: 'Seedance 1.5',         sub: 'ByteDance · быстрая анимация',     price: '299 💎' },
    { key: 'vidu_q2_turbo',   name: 'Vidu Q2 Turbo',        sub: 'Vidu · быстро и дёшево',           price: '129 💎' },
    { key: 'mm02_std_i2v',    name: 'MiniMax 02 Standard',  sub: 'Hailuo 02 · лёгкое движение',      price: '149 💎' },
    { key: 'vidu_q2_pro',     name: 'Vidu Q2 Pro',          sub: 'Vidu · 1080p · плавное движение',  price: '199 💎' },
    { key: 'kling_vid',       name: 'Kling 3.0 Omni',       sub: 'Kling · 720p · мульти-референс',  price: '399 💎' },
    { key: 'kling_v3_std',    name: 'Kling 3.0 Standard',   sub: 'Kling · стабильное движение',      price: '699 💎' },
    { key: 'kling_v3_pro',    name: 'Kling 3.0 Pro',        sub: 'Kling · реализм + детали',         price: '699 💎' },
    { key: 'grok_vid',        name: 'Grok Animate',         sub: 'xAI · плавное оживление',          price: '599 💎' },
    { key: 'sd2_fast',        name: 'Seedance 2 Fast',      sub: 'ByteDance · 2K · быстрая',         price: '999 💎' },
    { key: 'sd2_pro',         name: 'Seedance 2 Pro',       sub: 'ByteDance · 2K · высокое качество',price: '1490 💎' },
    { key: 'sora2_pro',       name: 'Sora 2 Pro',           sub: 'OpenAI · кино + аудио',            price: '2490 💎' },
    { key: 'kling_v3_4k',     name: 'Kling 3.0 4K',         sub: 'Kling · 4K · кинематографика',    price: '1990 💎' },
  ]},
  { label: '💃 Танец / редактирование', models: [
    { key: 'kling_mc',     name: 'Motion Control',      sub: 'Kling · повторяет движения видео',    price: '399 💎' },
    { key: 'kling_mc_pro', name: 'Motion Control Pro',  sub: 'Kling · профи-контроль движения',     price: '149 💎' },
    { key: 'wan27_v2v',    name: 'WAN 2.7 Edit',        sub: 'Alibaba · редактирование видео',       price: '99 💎' },
  ]},
]

const MUSIC_MODELS = [
  { key: 'suno_music', name: 'Создать песню', sub: 'Suno · текст → готовый трек', price: '199 💎' },
]

const STD_TARIFFS = [
  { key: 'trial',  label: 'Пробный пакет', badge: '🎁 ДЛЯ НОВИЧКОВ · САМЫЙ ПОПУЛЯРНЫЙ',
    desc: '3 фото во всех версиях сразу — чтобы найти свою\n⭐ Стандарт · ✨ Версия 2 · 💎 Про',
    price: '149 ₽', hero: true },
  { key: 'std_1',  label: '1 фото',   perPhoto: '',         price: '79 ₽' },
  { key: 'std_10', label: '10 фото',  perPhoto: '59 ₽/фото', price: '590 ₽', discount: '−25%' },
  { key: 'std_30', label: '30 фото',  perPhoto: '49 ₽/фото', price: '1 490 ₽', discount: '−38%', popular: true },
  { key: 'std_50', label: '50 фото',  perPhoto: '39 ₽/фото', price: '1 990 ₽', discount: '−50%', best: true },
]
const V2_TARIFFS = [
  { key: 'v2_1',  label: '1 фото',  perPhoto: '',          price: '99 ₽' },
  { key: 'v2_10', label: '10 фото', perPhoto: '79 ₽/фото', price: '790 ₽',   discount: '−20%' },
  { key: 'v2_30', label: '30 фото', perPhoto: '63 ₽/фото', price: '1 890 ₽', discount: '−36%', popular: true },
  { key: 'v2_50', label: '50 фото', perPhoto: '49 ₽/фото', price: '2 490 ₽', discount: '−50%', best: true },
]
const PRO_TARIFFS = [
  { key: 'pro_1',  label: '1 фото',  perPhoto: '',           price: '149 ₽' },
  { key: 'pro_10', label: '10 фото', perPhoto: '119 ₽/фото', price: '1 190 ₽', discount: '−20%' },
  { key: 'pro_30', label: '30 фото', perPhoto: '83 ₽/фото',  price: '2 490 ₽', discount: '−44%', popular: true },
  { key: 'pro_50', label: '50 фото', perPhoto: '80 ₽/фото',  price: '3 990 ₽', discount: '−46%', best: true },
]
const NUDE_TARIFFS = [
  { key: 'nude_3',  label: '3 фото',  perPhoto: '83 ₽/фото', price: '249 ₽' },
  { key: 'nude_5',  label: '5 фото',  perPhoto: '78 ₽/фото', price: '390 ₽', popular: true },
  { key: 'nude_10', label: '10 фото', perPhoto: '69 ₽/фото', price: '690 ₽',   discount: '−17%' },
  { key: 'nude_20', label: '20 фото', perPhoto: '59 ₽/фото', price: '1 190 ₽', discount: '−29%', best: true },
]
const FAMILY_TARIFFS = [
  { key: 'family_1', label: '1 портрет',  perPhoto: '',              price: '390 ₽' },
  { key: 'family_3', label: '3 портрета', perPhoto: '330 ₽/портрет', price: '990 ₽',   discount: '−15%', popular: true },
  { key: 'family_5', label: '5 портретов',perPhoto: '298 ₽/портрет', price: '1 490 ₽', discount: '−24%' },
]
const COUPLES_STD = [
  { key: 'couples_std_1',  label: '1 фото',  price: '99 ₽' },
  { key: 'couples_std_3',  label: '3 фото',  perPhoto: '90 ₽/фото', price: '270 ₽',  discount: '−9%', popular: true },
  { key: 'couples_std_5',  label: '5 фото',  perPhoto: '84 ₽/фото', price: '420 ₽',  discount: '−15%' },
  { key: 'couples_std_10', label: '10 фото', perPhoto: '75 ₽/фото', price: '750 ₽',  discount: '−24%', best: true },
]
const COUPLES_V2 = [
  { key: 'couples_v2_1',  label: '1 фото',  price: '119 ₽' },
  { key: 'couples_v2_3',  label: '3 фото',  perPhoto: '110 ₽/фото', price: '330 ₽',  discount: '−8%', popular: true },
  { key: 'couples_v2_5',  label: '5 фото',  perPhoto: '104 ₽/фото', price: '520 ₽',  discount: '−13%' },
  { key: 'couples_v2_10', label: '10 фото', perPhoto: '95 ₽/фото',  price: '950 ₽',  discount: '−20%', best: true },
]
const COUPLES_PRO = [
  { key: 'couples_pro_1',  label: '1 фото',  price: '169 ₽' },
  { key: 'couples_pro_3',  label: '3 фото',  perPhoto: '156 ₽/фото', price: '470 ₽',  discount: '−8%', popular: true },
  { key: 'couples_pro_5',  label: '5 фото',  perPhoto: '149 ₽/фото', price: '745 ₽',  discount: '−12%' },
  { key: 'couples_pro_10', label: '10 фото', perPhoto: '139 ₽/фото', price: '1 390 ₽',discount: '−18%', best: true },
]
const DIAMOND_TARIFFS = [
  { key: 'diamond_500',  label: '500 💎',   perPhoto: '2–6 генераций',   price: '490 ₽' },
  { key: 'diamond_1500', label: '1 500 💎', perPhoto: '7–19 генераций',  price: '1 290 ₽', discount: '−12%', popular: true },
  { key: 'diamond_3000', label: '3 000 💎', perPhoto: '15–38 генераций', price: '2 490 ₽', discount: '−15%' },
  { key: 'diamond_6000', label: '6 000 💎', perPhoto: '30–76 генераций', price: '3 990 ₽', discount: '−32%', best: true },
]
const MIX_TARIFFS = [
  { key: 'mix_start', label: 'Начальный набор', sub: '10 Стандарт · 3 ню · 1 семейный · 1 оживление', price: '990 ₽' },
  { key: 'mix_full',  label: 'Полный набор',    sub: '25 Стандарт · 7 ню · 3 семейных · 3 оживления', price: '2 490 ₽', popular: true },
  { key: 'mix_pro',   label: 'Про набор 🔥',    sub: '20 Стандарт + 10 Про · 5 ню · 3 семейных · 2 оживления', price: '3 490 ₽' },
]

const TABS = [
  { id: 'novichok', icon: '⭐', label: 'Новичок' },
  { id: 'profi',    icon: '💎', label: 'Профи' },
  { id: 'tariffs',  icon: '🛒', label: 'Тарифы' },
  { id: 'history',  icon: '🕐', label: 'История' },
  { id: 'profile',  icon: '👤', label: 'Профиль' },
]

/* ── TOAST ── */
function Toast({ msg }) {
  return msg ? <div className="toast show">{msg}</div> : null
}
function useToast() {
  const [msg, setMsg] = useState(null)
  const show = useCallback((m) => {
    setMsg(m)
    setTimeout(() => setMsg(null), 4500)
  }, [])
  return [msg, show]
}

/* ── APP ── */
export default function App() {
  const [vkUser, setVkUser] = useState(null)
  const [activeTab, setActiveTab] = useState('novichok')
  const [me, setMe] = useState(null)
  const [bannerVisible, setBannerVisible] = useState(true)
  const [genPreset, setGenPreset] = useState(null)
  const [galleryStyle, setGalleryStyle] = useState(null) // экран генерации из галереи
  const [toastMsg, showToast] = useToast()

  const refreshMe = useCallback((id) => {
    if (!id) return
    api.me(id).then(setMe).catch(() => {})
  }, [])

  useEffect(() => {
    try { bridge.send('VKWebAppInit') } catch {}
    // Читаем hash из URL для навигации из кнопок бота
    const hash = window.location.hash.replace('#', '')
    if (['novichok','profi','tariffs','history','profile'].includes(hash)) {
      setActiveTab(hash)
    }
    const timeout = (ms) => new Promise((_, r) => setTimeout(() => r(new Error('to')), ms))
    Promise.race([bridge.send('VKWebAppGetUserInfo'), timeout(5000)])
      .then((u) => { setVkUser(u); return api.me(u.id) })
      .then(setMe)
      .catch(() => {})
  }, [])

  const goProfi = (preset) => { setGenPreset(preset || null); setActiveTab('profi') }
  const goTariffs = () => setActiveTab('tariffs')
  const goProfile = () => setActiveTab('profile')
  const openGalleryStyle = (style) => setGalleryStyle(style)

  return (
    <>
      <div className="frame-app">
        {/* Экран генерации из галереи (поверх всего) */}
        {galleryStyle && (
          <GalleryGenView
            style={galleryStyle}
            vkId={vkUser?.id}
            me={me}
            onBack={() => setGalleryStyle(null)}
            onDone={() => { refreshMe(vkUser?.id); setGalleryStyle(null) }}
            onGoTariffs={() => { setGalleryStyle(null); goTariffs() }}
            showToast={showToast}
          />
        )}

        {!galleryStyle && bannerVisible && (
          <div className="sale-banner" onClick={goTariffs}>
            <span className="sb-fire">🔥</span>
            <div className="sb-text"><b>−50%</b> на все тарифы · Только сейчас!</div>
            <button className="sb-close" onClick={e => { e.stopPropagation(); setBannerVisible(false) }}>✕</button>
          </div>
        )}

        {!galleryStyle && <div className={`page-wrap${bannerVisible ? ' has-banner' : ''}`}>
          {activeTab === 'novichok' && (
            <NovichokTab me={me} onRepeat={openGalleryStyle} onGoTariffs={goTariffs} onGoProfile={goProfile} onRefresh={() => refreshMe(vkUser?.id)} />
          )}
          {activeTab === 'profi' && (
            <ProfiTab vkId={vkUser?.id} me={me} preset={genPreset} onDone={() => refreshMe(vkUser?.id)} onGoTariffs={goTariffs} onGoProfile={goProfile} showToast={showToast} onRefresh={() => refreshMe(vkUser?.id)} />
          )}
          {activeTab === 'tariffs' && (
            <TariffsTab vkId={vkUser?.id} me={me} showToast={showToast} onGoTariffs={goTariffs} onGoProfile={goProfile} onRefresh={() => refreshMe(vkUser?.id)} />
          )}
          {activeTab === 'history' && (
            <HistoryTab vkId={vkUser?.id} me={me} showToast={showToast} onGoTariffs={goTariffs} onGoProfile={goProfile} onRefresh={() => refreshMe(vkUser?.id)} />
          )}
          {activeTab === 'profile' && (
            <ProfileTab vkId={vkUser?.id} me={me} onGoTariffs={goTariffs} onGoProfile={goProfile} showToast={showToast} onRefresh={() => refreshMe(vkUser?.id)} />
          )}
        </div>}

        {!galleryStyle && <nav className="bottom-nav">
          {TABS.map(({ id, icon, label }) => (
            <button
              key={id}
              className={`nav-item${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>}

        <Toast msg={toastMsg} />
      </div>
    </>
  )
}

/* ── TOPBAR ── */
function TopBar({ me, onGoProfile, onGoTariffs, onRefresh }) {
  const [open, setOpen] = useState(false)
  const diamond = me?.diamond_credits ?? 0
  const std     = me?.std_credits ?? 0
  const v2      = me?.v2_credits ?? 0
  const pro     = me?.pro_credits ?? 0
  const gift    = me?.gift_credits ?? 0
  const total   = std + v2 + pro + gift
  const label   = diamond > 0 ? `💎 ${diamond}` : total > 0 ? `🖼 ${total}` : '👛 0'
  return (
    <div className="topbar" style={{position:'relative'}}>
      <div className="topbar-logo">FR<span>A</span>ME</div>
      <div className="balance-chip" onClick={() => { setOpen(o => !o); if (!open) onRefresh?.() }}>
        <span>{label}</span>
        <span style={{opacity:.7,fontSize:11}}>баланс</span>
      </div>
      {open && (
        <div style={{position:'absolute',top:52,right:12,zIndex:100,background:'#1a1a2e',border:'1px solid rgba(167,139,250,.3)',borderRadius:14,padding:'14px 18px',minWidth:200,boxShadow:'0 8px 32px rgba(0,0,0,.6)'}}
             onClick={() => setOpen(false)}>
          <div style={{fontSize:13,fontWeight:800,color:'#a78bfa',marginBottom:10}}>💰 Мой баланс</div>
          {diamond > 0 && <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}><span style={{color:'#aaa'}}>💎 Алмазы</span><b>{diamond}</b></div>}
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#aaa'}}>⭐ Стандарт</span><b>{std}</b></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#aaa'}}>✨ Версия 2</span><b>{v2}</b></div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#aaa'}}>💎 Про</span><b>{pro}</b></div>
          {gift > 0 && <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#aaa'}}>🎁 Подарок</span><b>{gift}</b></div>}
          <div style={{borderTop:'1px solid rgba(255,255,255,.08)',marginTop:8,paddingTop:8,display:'flex',justifyContent:'space-between'}}><span style={{color:'#aaa'}}>Всего фото</span><b style={{color:'#a78bfa'}}>{total}</b></div>
          <button onClick={e=>{e.stopPropagation();setOpen(false);onGoTariffs&&onGoTariffs()}} style={{marginTop:12,width:'100%',background:'linear-gradient(135deg,#7c3aed,#2563eb)',border:'none',borderRadius:9,color:'#fff',fontWeight:700,padding:'9px 0',cursor:'pointer',fontSize:13}}>💳 Пополнить</button>
        </div>
      )}
    </div>
  )
}

/* ── Маппинг качество → ключ модели VK бота ── */
const QUALITY_MODEL  = { std: 'std', v2: 'v2', pro: 'pro' }
const QUALITY_CREDIT = { std: 'std_credits', v2: 'v2_credits', pro: 'pro_credits' }
const QUALITY_LABEL  = { std: '⭐ Стандарт', v2: '✨ Версия 2', pro: '💎 Про' }
const QUALITY_DIA    = { std: 79, v2: 99, pro: 149 }

/* ────────────────────────────── ГАЛЕРЕЙНАЯ ГЕНЕРАЦИЯ ── */
function GalleryGenView({ style, vkId, me, onBack, onDone, onGoTariffs, showToast }) {
  const qualities = (style.quality_modes || 'std,v2,pro').split(',').map(q => q.trim()).filter(q => QUALITY_MODEL[q])
  const [quality, setQuality]   = useState(qualities[0] || 'std')
  const [photoUrl, setPhotoUrl]     = useState('')
  const [photoFile, setPhotoFile]   = useState(null) // blob file для upload
  const [inputVal, setInputVal]     = useState('')
  const [busy, setBusy]             = useState(false)
  const [error, setError]           = useState(null)
  const [resultUrl, setResultUrl]   = useState(null)
  const [elapsed, setElapsed]       = useState(0)
  const timerRef = useRef(null)

  const startTimer = () => { setElapsed(0); timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000) }
  const stopTimer  = () => { clearInterval(timerRef.current); timerRef.current = null }
  const fmtTime    = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  const fileInputRef = useRef(null)
  const pickPhoto = async () => {
    setError(null)
    try {
      const r = await bridge.send('VKWebAppOpenFiles', { count: 1 })
      const file = r?.files?.[0] || r?.urls?.[0]
      const url = typeof file === 'string' ? file : file?.url
      if (url) { setPhotoUrl(url); setPhotoFile(null) }
      else fileInputRef.current?.click()
    } catch {
      fileInputRef.current?.click()
    }
  }
  const onFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoUrl(URL.createObjectURL(file)) // только для превью
  }

  const generate = async () => {
    if (!vkId) { setError('Войди в VK чтобы продолжить'); return }
    if (!photoUrl) { setError('Загрузи своё фото'); return }
    setBusy(true); setError(null); setResultUrl(null); startTimer()
    const modelKey = QUALITY_MODEL[quality]
    const promptFull = [style.prompt || '', inputVal].filter(Boolean).join(', ')
    try {
      // Если фото выбрано через file input — сначала загружаем на сервер
      let finalUrl = photoUrl
      if (photoFile) {
        const up = await api.uploadPhoto(photoFile)
        finalUrl = up.url
      }
      const r = await api.generate(vkId, finalUrl, modelKey, promptFull)
      setResultUrl(r.result_url)
      onDone?.()
    } catch (e) {
      if (e.code === 'no_credits') {
        setError(`Недостаточно кредитов ${QUALITY_LABEL[quality]}`)
      } else {
        setError('Ошибка генерации. Попробуй снова.')
      }
    } finally { setBusy(false); stopTimer() }
  }

  /* Экран результата */
  if (resultUrl) return (
    <div className="gal-gen-wrap">
      <button className="gal-back-btn" onClick={onBack}>← Назад</button>
      <div className="sec-title" style={{marginTop:16}}>Готово! 🎉</div>
      <img src={resultUrl} alt="Результат" className="gen-result-img" />
      <div className="gen-result-btns">
        <button className="gen-result-btn" onClick={() => { setResultUrl(null); setPhotoUrl('') }}>🔄 Ещё раз</button>
        <button className="gen-result-btn primary" onClick={() => bridge.send('VKWebAppShare', { link: resultUrl })}>📤 Поделиться</button>
      </div>
    </div>
  )

  const creditKey = QUALITY_CREDIT[quality]
  const credits   = me?.[creditKey] ?? 0
  const diamond   = me?.diamond_credits ?? 0

  return (
    <div className="gal-gen-wrap">
      {/* Шапка */}
      <div className="gal-gen-header">
        <button className="gal-back-btn" onClick={onBack}>← Назад</button>
        <div className="gal-gen-title">{style.name || 'Стиль'}</div>
      </div>

      {/* Превью стиля */}
      {style.photo_url && (
        <div className="gal-preview-wrap">
          <img src={style.photo_url} alt={style.name} className="gal-preview-img" />
        </div>
      )}

      {/* Загрузка фото */}
      <div className="pro-field-label" style={{marginTop:16}}>Твоё фото</div>
      <div style={{fontSize:12,color:'#888',marginBottom:8}}>{style.photo_hint || 'Лицо должно быть хорошо видно'}</div>
      {photoUrl
        ? <label className="pro-upload-zone has-photo" onClick={pickPhoto}>
            <img src={photoUrl} className="pro-upload-preview" alt="" />
          </label>
        : <label className="pro-upload-zone" onClick={pickPhoto}>
            <div className="pro-upload-ph">
              <div style={{fontSize:36,marginBottom:8}}>📷</div>
              <div style={{fontSize:14,fontWeight:700,color:'#a78bfa'}}>Нажми чтобы выбрать фото</div>
              <div style={{fontSize:12,color:'#888',marginTop:6}}>Лицо чётко видно · без очков</div>
            </div>
          </label>
      }
      <input ref={fileInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFileChange} />
      {photoUrl && (
        <button className="pro-other-btn" style={{marginTop:8,marginBottom:4}} onClick={() => setPhotoUrl('')}>Сменить фото</button>
      )}

      {/* Дополнительный ввод (input_label) */}
      {style.input_label && (
        <>
          <div className="pro-field-label" style={{marginTop:16}}>{style.input_label}</div>
          <input
            className="pro-textarea"
            style={{height:44,resize:'none'}}
            placeholder={style.input_label}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
          />
        </>
      )}

      {/* Выбор качества */}
      <div className="pro-field-label" style={{marginTop:20}}>Качество</div>
      <div className="gal-quality-row">
        {qualities.map(q => {
          const ckey = QUALITY_CREDIT[q]
          const cnt  = me?.[ckey] ?? 0
          const hasDia = me?.diamond_credits >= QUALITY_DIA[q]
          const ok = cnt > 0 || hasDia
          return (
            <button
              key={q}
              className={`gal-quality-btn${quality === q ? ' active' : ''}${!ok ? ' no-cred' : ''}`}
              onClick={() => setQuality(q)}
            >
              <div className="gal-q-label">{QUALITY_LABEL[q]}</div>
              <div className="gal-q-count">{cnt > 0 ? `${cnt} шт.` : ok ? '💎' : 'нет'}</div>
            </button>
          )
        })}
      </div>
      {credits === 0 && diamond < QUALITY_DIA[quality] && (
        <div style={{fontSize:12,color:'#ef4444',marginTop:8,textAlign:'center'}}>
          Нет кредитов {QUALITY_LABEL[quality]} — <span style={{color:'#a78bfa',cursor:'pointer'}} onClick={onGoTariffs}>пополнить →</span>
        </div>
      )}

      {error && <div className="error-msg" style={{marginTop:12}}>{error}</div>}

      {busy ? (
        <div className="gen-progress" style={{display:'block',marginTop:20}}>
          <div className="gen-spinner-wrap"><div className="gen-spinner-big" /></div>
          <div className="gen-timer-label">{fmtTime(elapsed)}</div>
          <div className="gen-timer-max">Максимум: 5:00</div>
          <div className="gen-prog-bar-wrap"><div className="gen-prog-bar" style={{width:`${Math.min(100,(elapsed/300)*100)}%`}} /></div>
          <div className="gen-status-txt">Обрабатываем твоё фото…</div>
        </div>
      ) : (
        <button className="pro-create-btn" style={{marginTop:20}} onClick={generate} disabled={!photoUrl}>
          ✨ Создать в {QUALITY_LABEL[quality]}
        </button>
      )}
      <div style={{height:32}} />
    </div>
  )
}

/* ────────────────────────────────── НОВИЧОК ── */
function NovichokTab({ me, onRepeat, onGoTariffs, onGoProfile, onRefresh }) {
  const [categories, setCategories]   = useState([])
  const [activecat, setActivecat]     = useState('')
  const [styles, setStyles]           = useState([])
  const [loadingStyles, setLoadingStyles] = useState(true)

  // Загружаем категории из Supabase при монтировании
  useEffect(() => {
    api.categories().then((cats) => {
      if (cats && cats.length > 0) {
        // emoji может дублироваться в name — убираем из label
        const mapped = cats.map(c => ({ key: c.key, emoji: c.emoji, label: c.name.replace(/^\S+\s/, '') }))
        setCategories(mapped)
        setActivecat(mapped[0].key)
      }
    }).catch(() => {
      setCategories(CATEGORIES)
      setActivecat(CATEGORIES[0]?.key || '')
    })
  }, [])

  // Загружаем стили при смене категории
  useEffect(() => {
    setLoadingStyles(true)
    api.styles(activecat).then((data) => {
      setStyles(Array.isArray(data) ? data : [])
    }).catch(() => setStyles([])).finally(() => setLoadingStyles(false))
  }, [activecat])

  return (
    <>
      <TopBar me={me} onGoProfile={onGoProfile} onGoTariffs={onGoTariffs} onRefresh={onRefresh} />
      <div className="diamond-bar">
        <div className="diamond-chip">
          💎 <span>{me?.diamond_credits ?? '–'}</span>
        </div>
        <button className="diamond-topup" onClick={onGoTariffs}>Пополнить ▸</button>
      </div>

      {/* Категории */}
      <div className="cat-grid" id="cats">
        {categories.map((c) => (
          <div
            key={c.key}
            className={`cat-btn${activecat === c.key ? ' active' : ''}`}
            onClick={() => setActivecat(c.key)}
          >
            <span className="cat-icon">{c.emoji}</span>
            <span className="cat-name">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Стили из галереи */}
      {loadingStyles ? (
        <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>Загрузка...</div>
      ) : styles.length > 0 ? (
        <>
          <div className="sec-title">✨ Стили</div>
          <div className="sec-sub">Нажми «Повторить» — загрузишь своё фото</div>
          <div className="grid">
            {styles.map((s) => (
              <div key={s.id} className="card">
                <div className="card-img-wrap">
                  {s.photo_url
                    ? <img src={s.photo_url} alt={s.name} />
                    : <div className="card-no-img">🪄</div>
                  }
                  <div className="card-overlay">
                    <div className="card-name-ov">{s.name}</div>
                  </div>
                  {s.hot && <div className="badge-hot">⭐ ХИТ</div>}
                </div>
                <button className="card-btn" onClick={() => onRepeat(s)}>✨ Повторить</button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="sec-title">⭐ Хиты</div>
          <div className="sec-sub">Нажми «Повторить» — загрузишь своё фото</div>
          <div className="grid">
            {HITS.map((h) => (
              <div key={h.title} className="card">
                <div className="card-img-wrap">
                  <div className="card-no-img">🪄</div>
                  <div className="card-overlay">
                    <div className="card-name-ov">{h.title}</div>
                  </div>
                  <div className="badge-hot">⭐ ХИТ</div>
                  <div className="badge-input">{h.desc}</div>
                </div>
                <button className="card-btn" onClick={() => onRepeat({ name: h.title, prompt: h.prompt, quality_modes: 'std,v2,pro' })}>✨ Повторить</button>
              </div>
            ))}
          </div>
        </>
      )}
      <div style={{ height: 24 }} />
    </>
  )
}

/* ────────────────────────────────── ПРОФИ ── */
function ProfiTab({ vkId, me, preset, onDone, onGoTariffs, onGoProfile, showToast, onRefresh }) {
  const [modelCat, setModelCat] = useState('photo') // photo | video | music
  const [selectedModel, setSelectedModel] = useState(null)
  const [modelSheetOpen, setModelSheetOpen] = useState(false)
  const [prompt, setPrompt] = useState(preset?.prompt || '')
  const [size, setSize] = useState('vert')
  const [photoUrl, setPhotoUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (preset?.prompt) setPrompt(preset.prompt)
  }, [preset])

  const startTimer = () => {
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
  }
  const stopTimer = () => { clearInterval(timerRef.current); timerRef.current = null }

  const fileInputRef2 = useRef(null)
  const pickPhoto = async () => {
    setError(null)
    try {
      const r = await bridge.send('VKWebAppOpenFiles', { count: 1 })
      const file = r?.files?.[0] || r?.urls?.[0]
      const url = typeof file === 'string' ? file : file?.url
      if (url) setPhotoUrl(url)
      else fileInputRef2.current?.click()
    } catch {
      fileInputRef2.current?.click()
    }
  }
  const onFileChange2 = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUrl(URL.createObjectURL(file))
  }

  const generate = async () => {
    if (!vkId || !photoUrl || !selectedModel) return
    setBusy(true); setError(null); setResultUrl(null); startTimer()
    try {
      const r = await api.generate(vkId, photoUrl, selectedModel.key, prompt)
      setResultUrl(r.result_url)
      onDone?.()
    } catch (e) {
      if (e.code === 'no_credits') setError('Недостаточно кредитов — пополни баланс')
      else setError('Ошибка генерации. Попробуй снова.')
    } finally { setBusy(false); stopTimer() }
  }

  const reset = () => { setPhotoUrl(''); setResultUrl(null); setError(null) }

  const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  if (resultUrl) return (
    <div className="pro-wrap">
      <div className="sec-title" style={{paddingBottom:4}}>Готово! 🎉</div>
      <div className="gen-done-badge">✅ Генерация завершена!</div>
      <img src={resultUrl} alt="Результат" className="gen-result-img" />
      <div className="gen-result-btns">
        <button className="gen-result-btn" onClick={reset}>🔄 Повторить</button>
        <button className="gen-result-btn primary" onClick={() =>
          bridge.send('VKWebAppShare', { link: resultUrl })}>📤 Поделиться</button>
      </div>
    </div>
  )

  const allGroups = modelCat === 'photo' ? PHOTO_MODELS_GROUPS : modelCat === 'video' ? VIDEO_MODELS_GROUPS : []

  return (
    <>
      <TopBar me={me} onGoProfile={onGoProfile} onGoTariffs={onGoTariffs} onRefresh={onRefresh} />
      <div className="diamond-bar">
        <div className="diamond-chip">💎 <span>{me?.diamond_credits ?? '–'}</span></div>
        <button className="diamond-topup" onClick={onGoTariffs}>Пополнить ▸</button>
      </div>
      <div className="pro-wrap">
        <div className="pro-field-label">Модель</div>
        <button className="pro-other-btn" onClick={() => setModelSheetOpen(true)}>
          {selectedModel ? selectedModel.name : 'Выберите модель ▾'}
        </button>

        {modelCat !== 'music' && (<>
          <div className="pro-field-label" style={{marginTop:18}}>Промпт</div>
          <textarea
            className="pro-textarea"
            rows={4}
            placeholder={`Опиши стиль, образ, локацию...\n\nПример: деловой портрет в студии, мягкий свет, нейтральный серый фон`}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />
          <div className="pro-prompt-tip">💡 Чем подробнее промпт — тем лучше результат.</div>

          <div className="pro-field-label" style={{marginTop:18}}>Формат</div>
          <div className="pro-sizes-scroll">
            {[['sq','□','1:1'],['23','▯','2:3'],['34','▯','3:4'],['45','▯','4:5'],['vert','▯','9:16'],['horiz','▭','16:9'],['43','▭','4:3'],['32','▭','3:2']].map(([v,icon,label])=>(
              <button key={v} className={`pro-size-chip${size===v?' active':''}`} onClick={() => setSize(v)}>
                <span className="pro-size-icon">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="pro-field-label" style={{marginTop:18}}>Фото</div>
          {photoUrl
            ? <>
                <label className="pro-upload-zone has-photo" onClick={pickPhoto}>
                  <img src={photoUrl} className="pro-upload-preview" alt="" />
                </label>
                <button className="pro-other-btn" style={{marginTop:8}} onClick={() => setPhotoUrl('')}>Сменить фото</button>
              </>
            : <label className="pro-upload-zone" onClick={pickPhoto}>
                <div className="pro-upload-ph">
                  <div style={{fontSize:36,marginBottom:8}}>📷</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#a78bfa'}}>Нажми чтобы выбрать фото</div>
                  <div style={{fontSize:12,color:'#888',marginTop:6}}>До 10 фото · лицо чётко видно</div>
                </div>
              </label>
          }

          <input ref={fileInputRef2} type="file" accept="image/*" style={{display:'none'}} onChange={onFileChange2} />

          {error && (
            <div>
              <div className="error-msg">{error}</div>
              {error.includes('кредит') && (
                <button className="big-btn dark" style={{marginTop:8}} onClick={onGoTariffs}>Пополнить баланс →</button>
              )}
            </div>
          )}

          {busy ? (
            <div className="gen-progress" style={{display:'block'}}>
              <div className="gen-spinner-wrap"><div className="gen-spinner-big" /></div>
              <div className="gen-timer-label">{fmtTime(elapsed)}</div>
              <div className="gen-timer-max">Максимум: 5:00</div>
              <div className="gen-prog-bar-wrap"><div className="gen-prog-bar" style={{width:`${Math.min(100,(elapsed/300)*100)}%`}} /></div>
              <div className="gen-status-txt">Обрабатываем фото…</div>
              <div className="gen-hints">
                <div className="gen-hint"><span className="gen-hint-icon">✓</span> Окно можно закрыть</div>
                <div className="gen-hint"><span className="gen-hint-icon">✓</span> Результат придёт в VK</div>
              </div>
            </div>
          ) : (
            <button
              className="pro-create-btn"
              disabled={!photoUrl || !selectedModel}
              onClick={generate}
            >✨ Создать</button>
          )}
        </>)}
      </div>

      {/* Model sheet */}
      {modelSheetOpen && (
        <div className="overlay open" onClick={() => setModelSheetOpen(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()} style={{maxHeight:'82vh',overflowY:'auto'}}>
            <div className="sheet-handle" />
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 4px 14px'}}>
              <div style={{fontSize:17,fontWeight:800}}>Выбери модель</div>
              <button onClick={() => setModelSheetOpen(false)} style={{background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.1)',color:'#fff',fontSize:18,width:32,height:32,borderRadius:'50%',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>
            <div className="pro-cat-tabs">
              {[['photo','📸 Фото'],['video','🎬 Видео'],['music','🎵 Музыка']].map(([c,l]) => (
                <button key={c} className={`pro-cat-tab${modelCat===c?' active':''}`} onClick={() => setModelCat(c)}>{l}</button>
              ))}
            </div>
            {modelCat === 'music' ? (
              <div>
                <div className="pro-model-group-label">🎵 Генерация треков</div>
                <div className="pro-model-list">
                  {MUSIC_MODELS.map(m => (
                    <button key={m.key} className={`pro-model-item${selectedModel?.key===m.key?' selected':''}`}
                      onClick={() => { setSelectedModel(m); setModelSheetOpen(false) }}>
                      <div className="pro-model-item-left">
                        <div className="pro-model-item-name">{m.name}</div>
                        <div className="pro-model-item-sub">{m.sub}</div>
                      </div>
                      <div className="pro-model-price">{m.price}</div>
                    </button>
                  ))}
                </div>
                <div style={{textAlign:'center',padding:'20px 0 4px',color:'#777',fontSize:13}}>Клон голоса — скоро</div>
              </div>
            ) : allGroups.map(g => (
              <div key={g.label}>
                <div className="pro-model-group-label">{g.label}</div>
                <div className="pro-model-list">
                  {g.models.map(m => (
                    <button key={m.key} className={`pro-model-item${selectedModel?.key===m.key?' selected':''}`}
                      onClick={() => { setSelectedModel(m); setModelSheetOpen(false) }}>
                      <div className="pro-model-item-left">
                        <div className="pro-model-item-name">{m.name}</div>
                        <div className="pro-model-item-sub">{m.sub}</div>
                      </div>
                      <div className="pro-model-price">{m.price}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div style={{height:20}} />
          </div>
        </div>
      )}
    </>
  )
}

/* ── Конструктор «Собери свой набор» ── */
const BUILDER_BASE = { std: 79, v2: 99, pro: 149, nude: 89, family: 390, video: 390, couples: 149 }
const BUILDER_UNIT_LABEL = { std: 'фото', v2: 'фото', pro: 'фото', nude: 'фото', family: 'портрет', video: 'видео', couples: 'фото' }
const BUILDER_CATS = [
  ['std', '⭐ Стандарт'], ['v2', '✨ Версия 2'], ['pro', '💎 Про'],
  ['nude', '🌸 Ню'], ['family', '👨‍👩‍👧 Семейный'], ['video', '🎬 Оживление'], ['couples', '💑 Парные фото'],
]
function getUnitPrice(cat, qty) {
  if (cat === 'std')    { if (qty>=50) return 39; if (qty>=30) return 49; if (qty>=10) return 59; return 79 }
  if (cat === 'v2')     { if (qty>=50) return 49; if (qty>=30) return 63; if (qty>=10) return 79; return 99 }
  if (cat === 'pro')    { if (qty>=50) return 80; if (qty>=30) return 83; if (qty>=10) return 119; return 149 }
  if (cat === 'nude')   { if (qty>=20) return 59; if (qty>=10) return 69; if (qty>=5) return 78; if (qty>=3) return 83; return 89 }
  if (cat === 'family') { if (qty>=5) return 298; if (qty>=3) return 330; return 390 }
  if (cat === 'video')  { if (qty>=3) return 330; return 390 }
  if (cat === 'couples'){ if (qty>=10) return 119; if (qty>=5) return 129; if (qty>=3) return 139; return 149 }
  return 0
}
const SITE_DISCOUNT = 50 // акция −50%

/* Bottom-sheet конструктора */
function BuilderSheet({ open, onClose, onBuy }) {
  const [qty, setQty] = useState({ std:0, v2:0, pro:0, nude:0, family:0, video:0, couples:0 })
  useEffect(() => { if (open) setQty({ std:0, v2:0, pro:0, nude:0, family:0, video:0, couples:0 }) }, [open])
  const step = (cat, d) => setQty(q => ({ ...q, [cat]: Math.max(0, q[cat] + d) }))
  const mult = (100 - SITE_DISCOUNT) / 100

  let total = 0, hasBulk = false
  const rows = BUILDER_CATS.map(([cat, label]) => {
    const n = qty[cat]
    const unitRaw = n > 0 ? getUnitPrice(cat, n) : BUILDER_BASE[cat]
    const unit = Math.round(unitRaw * mult)
    const sub = n * unit
    const bulk = n > 0 && unitRaw < BUILDER_BASE[cat]
    if (bulk) hasBulk = true
    total += sub
    return { cat, label, n, unit, sub, bulk }
  })

  const buyNow = () => {
    const key = `build_${qty.std}_${qty.v2}_${qty.pro}_${qty.nude}_${qty.family}_${qty.video}`
    onBuy(key)
  }

  return (
    <div className={`builder-overlay${open ? ' open' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="builder-sheet">
        <div className="builder-hero">
          <div className="builder-hero-top">
            <div style={{width:40,height:4,background:'rgba(255,255,255,.15)',borderRadius:2}} />
            <button className="builder-close-btn" onClick={onClose}>Закрыть</button>
          </div>
          <div className="builder-hero-chips">
            <span className="builder-hero-chip bchip-std">⭐ Стандарт</span>
            <span className="builder-hero-chip bchip-v2">✨ Версия 2</span>
            <span className="builder-hero-chip bchip-pro">💎 Про</span>
            <span className="builder-hero-chip bchip-nude">🌸 Ню</span>
            <span className="builder-hero-chip bchip-family">👨‍👩‍👧 Семейный</span>
            <span className="builder-hero-chip bchip-video">🎬 Видео</span>
            <span className="builder-hero-chip bchip-couples">💑 Парные</span>
          </div>
          <div className="builder-hero-title">Свой набор</div>
          <div className="builder-hero-sub">Добавляй нужное · скидка растёт вместе с количеством</div>
        </div>

        {rows.map(({ cat, label, n, unit, sub, bulk }) => (
          <div className="builder-row" key={cat}>
            <div className="builder-row-info">
              <div className="builder-row-label">{label}</div>
              <div className={`builder-row-price-unit${bulk ? ' discount' : ''}`}>{unit} ₽/{BUILDER_UNIT_LABEL[cat]}</div>
            </div>
            <div className="builder-row-right">
              <button className="builder-stepper-btn" onClick={() => step(cat, -1)}>−</button>
              <div className="builder-qty">{n}</div>
              <button className="builder-stepper-btn" onClick={() => step(cat, 1)}>+</button>
              <div className="builder-row-sub">{n ? sub.toLocaleString('ru-RU') + ' ₽' : ''}</div>
            </div>
          </div>
        ))}

        <div className="builder-total-row">
          <div className="builder-total-label">Итого</div>
          <div className="builder-total-price">{total ? total.toLocaleString('ru-RU') + ' ₽' : '0 ₽'}</div>
        </div>
        <div className={`builder-discount-note${(hasBulk || total>0) ? ' visible' : ''}`}>
          {total > 0 ? `🔥 Акция −${SITE_DISCOUNT}% применена` : ''}
        </div>
        <button className="builder-buy-btn" disabled={total === 0} onClick={buyNow}>
          {total ? `Купить за ${total.toLocaleString('ru-RU')} ₽` : 'Выбери хотя бы один тип'}
        </button>
      </div>
    </div>
  )
}

/* ────────────────────────────────── ТАРИФЫ ── */
function TariffsTab({ vkId, me, showToast, onGoTariffs, onGoProfile, onRefresh }) {
  const [level, setLevel] = useState('novice') // novice | advanced
  const [qTab, setQTab] = useState('std')
  const [couplesQ, setCouplesQ] = useState('std')
  const [promo, setPromo] = useState('')
  const [promoStatus, setPromoStatus] = useState(null)
  const [busyKey, setBusyKey] = useState(null)
  const [builderOpen, setBuilderOpen] = useState(false)

  const buy = async (key) => {
    if (!vkId) { showToast('Нет vk_id'); return }
    if (busyKey) return
    setBusyKey(key)
    showToast('⏳ Создаём оплату... (~30 сек)')
    try {
      const r = await api.pay(vkId, key)
      // r.ok = новый формат, r.sent_to_chat/confirmation_url = старый
      if (r.ok || r.sent_to_chat || r.confirmation_url) {
        showToast('✅ Открой сообщения с ботом — там кнопка оплаты 💳')
        setTimeout(() => {
          bridge.send('VKWebAppOpenLink', { link: 'https://vk.com/im?sel=-239444342' }).catch(() => {})
        }, 1500)
      } else showToast('Ошибка оплаты')
    } catch (e) {
      const msg = e?.message || ''
      if (msg.includes('abort') || msg.includes('timeout')) {
        showToast('⏳ Сервер загружается — повтори через 30 сек')
      } else {
        showToast('Ошибка: ' + (msg || 'попробуй позже'))
      }
    }
    finally { setBusyKey(null) }
  }

  const applyPromo = () => {
    if (!promo.trim()) return
    setPromoStatus({ ok: false, msg: 'Промокод не найден' })
  }

  const NoviceQTabs = [
    ['std','⭐ Стандарт'], ['v2','✨ Версия 2'], ['pro','💎 Про'],
    ['nude','🌸 Ню'], ['family','👨‍👩‍👧 Семья'], ['couples','💑 Парные'], ['video','🎬 Видео'],
  ]

  const getTariffs = () => {
    if (qTab === 'std')     return STD_TARIFFS
    if (qTab === 'v2')      return V2_TARIFFS
    if (qTab === 'pro')     return PRO_TARIFFS
    if (qTab === 'nude')    return NUDE_TARIFFS
    if (qTab === 'family')  return FAMILY_TARIFFS
    if (qTab === 'couples') return couplesQ === 'std' ? COUPLES_STD : couplesQ === 'v2' ? COUPLES_V2 : COUPLES_PRO
    return []
  }

  return (
    <>
      <TopBar me={me} onGoProfile={onGoProfile} onGoTariffs={onGoTariffs} onRefresh={onRefresh} />
      <div className="lvl-switch-wrap">
        <button className={`lvl-btn${level==='novice'?' active':''}`} onClick={() => setLevel('novice')}>🌟 Новичок</button>
        <button className={`lvl-btn${level==='advanced'?' active':''}`} onClick={() => setLevel('advanced')}>💎 Профи</button>
      </div>

      <div className="promo-block">
        <input
          className="promo-input-field"
          placeholder="Промокод"
          value={promo}
          onChange={e => setPromo(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && applyPromo()}
        />
        <button className="promo-apply-btn" onClick={applyPromo}>Применить</button>
      </div>
      {promoStatus && (
        <div style={{margin:'2px 16px 8px',fontSize:13,color: promoStatus.ok ? '#4ade80' : '#f87171'}}>
          {promoStatus.msg}
        </div>
      )}

      {level === 'novice' && (
        <>
          {/* 1. Пробный пакет (hero) */}
          <div className="t-hero" onClick={() => buy('trial')}>
            <div className="t-hero-badge">🎁 ДЛЯ НОВИЧКОВ · САМЫЙ ПОПУЛЯРНЫЙ</div>
            <div className="t-hero-name">Пробный пакет</div>
            <div className="t-hero-desc">3 фото во всех версиях сразу — чтобы найти свою<br/>⭐ Стандарт · ✨ Версия 2 · 💎 Про</div>
            <div className="t-hero-bottom">
              <div>
                <div className="t-orig-price" style={{fontSize:13}}>149 ₽</div>
                <div className="t-hero-price">74 ₽</div>
              </div>
              <div className="t-hero-cta">Купить →</div>
            </div>
          </div>

          {/* 2. Гайд: 3 версии */}
          <div className="version-guide">
            <div className="version-intro">
              <div className="version-intro-title">Есть 3 версии нейрофотосессии</div>
              <div className="version-intro-sub">Они дают разный результат на одном и том же фото. Попробуй все три</div>
            </div>
            <div className="version-cards">
              <div className="version-card std">
                <div className="version-card-icon">⭐</div>
                <div className="version-card-name">Стандарт</div>
                <div className="version-card-desc">Быстро и аккуратно. Чёткий результат</div>
                <div className="version-card-who">Большинству</div>
              </div>
              <div className="version-card v2">
                <div className="version-card-icon">✨</div>
                <div className="version-card-name">Версия 2</div>
                <div className="version-card-desc">Мягче, детальнее. Красивее для портретов</div>
                <div className="version-card-who">Не всем</div>
              </div>
              <div className="version-card pro">
                <div className="version-card-icon">💎</div>
                <div className="version-card-name">Про</div>
                <div className="version-card-desc">Максимум чёткости. Студийный уровень</div>
                <div className="version-card-who">Немногим</div>
              </div>
            </div>
            <div className="version-tip" onClick={() => buy('trial')}>
              <div className="version-tip-body">
                Большинство берёт тариф наугад и получает не то, что ожидало. Правильный путь: сначала попробуй все три версии на своём фото, выбери свою и только потом бери полный тариф.
              </div>
              <div className="vtip-cta">
                <div className="vtip-cta-left">
                  <div className="vtip-cta-label">Пробный пакет · 3 фото</div>
                  <div className="vtip-cta-sub">⭐ Стандарт · ✨ Версия 2 · 💎 Про</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:12,color:'#888',textDecoration:'line-through'}}>149 ₽</div>
                  <div className="vtip-cta-price">74 ₽</div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Конструктор «Собери свой формат» */}
          <div className="builder-top-banner" onClick={() => setBuilderOpen(true)}>
            <div className="builder-top-badge">🏗 СОБЕРИ СВОЙ ФОРМАТ — ВЫГОДНЕЕ</div>
            <div className="builder-top-title">Свой набор</div>
            <div className="builder-top-sub">Стандарт · Версия 2 · Про · Ню · Семья · Видео<br/>Выбираешь сам сколько каких — чем больше, тем дешевле</div>
            <div style={{marginTop:10,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:18,opacity:.35}}>🍌</div>
              <div style={{background:'linear-gradient(135deg,#22c55e,#16a34a)',color:'#fff',fontSize:13,fontWeight:800,padding:'7px 18px',borderRadius:10}}>Собрать →</div>
            </div>
          </div>

          {/* 4. Q-tabs */}
          <div className="q-tabs-wrap">
            <div className="q-tabs-row" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
              {[['std','⭐ Стандарт'],['v2','✨ Версия 2'],['pro','💎 Про']].map(([k,l]) => (
                <button key={k} className={`q-tab${qTab===k?' active':''}`} onClick={() => setQTab(k)}>{l}</button>
              ))}
            </div>
            <div className="q-tabs-row" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
              {[['nude','🌸 Ню'],['family','👨‍👩‍👧 Семья'],['couples','💑 Парные'],['video','🎬 Видео']].map(([k,l]) => (
                <button key={k} className={`q-tab${qTab===k?' active':''}`} onClick={() => setQTab(k)}>{l}</button>
              ))}
            </div>
          </div>

          {qTab === 'couples' && (
            <div style={{padding:'8px 12px 0',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
              {[['std','⭐ Стандарт'],['v2','✨ Версия 2'],['pro','💎 Про']].map(([k,l]) => (
                <button key={k} className={`cq-tab${couplesQ===k?' active':''}`} onClick={() => setCouplesQ(k)}>{l}</button>
              ))}
            </div>
          )}

          {qTab === 'video' ? (
            <div style={{textAlign:'center',padding:'32px 16px 24px',color:'#888',lineHeight:1.7}}>
              <div style={{fontSize:28,marginBottom:10}}>🎬</div>
              <div style={{fontSize:15,fontWeight:700,color:'#888',marginBottom:6}}>Оживление фото</div>
              <div style={{fontSize:13,color:'#777'}}>Появится при следующем обновлении</div>
            </div>
          ) : (
            <div className="q-panel active" style={{paddingBottom:40}}>
              <TariffList tariffs={getTariffs()} busyKey={busyKey} onBuy={buy} />
            </div>
          )}
        </>
      )}

      {level === 'advanced' && (
        <div className="t-list" style={{padding:'0 16px 100px'}}>
          <div style={{fontSize:11,color:'#888',padding:'4px 0 10px',lineHeight:1.5}}>
            Кол-во генераций зависит от модели · НБ Стандарт (79💎) — больше · дорогие модели — меньше
          </div>
          {DIAMOND_TARIFFS.map(t => (
            <div key={t.key} className={`t-row${t.popular?' popular':''}`} onClick={() => buy(t.key)}>
              <div className="t-row-qty">
                {t.label} {t.popular && <span className="pop-label">Хит</span>}
              </div>
              <div className="t-row-right">
                {t.perPhoto && <div className="t-row-per">{t.perPhoto}</div>}
                <div style={{textAlign:'right'}}>
                  <span className="t-orig-price">{t.price}</span>
                  <div className="t-row-price">{discountedPrice(t.price)}</div>
                </div>
                <div className="t-save-badge best">−50%</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BuilderSheet open={builderOpen} onClose={() => setBuilderOpen(false)} onBuy={(key) => { setBuilderOpen(false); buy(key) }} />
    </>
  )
}

/* Встроенный виджет оплаты YooKassa — карточка прямо в приложении, без ссылок и редиректов */
function PayWidget({ token, onSuccess, onClose }) {
  const [loaded, setLoaded] = useState(false)
  const checkoutRef = useRef(null)

  useEffect(() => {
    if (!token) return
    const init = () => {
      try {
        checkoutRef.current = new window.YooMoneyCheckoutWidget({
          confirmation_token: token,
          return_url: 'https://vk.com/app54628838',
          error_callback(err) {
            console.error('YK widget error:', err)
          },
          customization: {
            colors: { controlPrimary: '#a78bfa', background: { enabled: false } },
          },
        })
        checkoutRef.current.render('yk-pay-container')
        checkoutRef.current.on('success', () => {
          checkoutRef.current?.destroy()
          checkoutRef.current = null
          onSuccess()
        })
        setLoaded(true)
      } catch(e) { console.error('YK init error:', e) }
    }

    if (window.YooMoneyCheckoutWidget) {
      init()
    } else {
      const s = document.createElement('script')
      s.src = 'https://yookassa.ru/checkout-widget/v1/checkout-widget.js'
      s.onload = init
      document.head.appendChild(s)
    }
    return () => { checkoutRef.current?.destroy(); checkoutRef.current = null }
  }, [token])

  return (
    <div className="pay-modal-overlay" onClick={onClose}>
      <div className="pay-modal wide" onClick={e => e.stopPropagation()}>
        <div className="pay-modal-title">💳 Оплата</div>
        {!loaded && <div className="pay-modal-loading">⏳ Загружаем форму оплаты...</div>}
        <div id="yk-pay-container" style={{minHeight: loaded ? 340 : 0}} />
        <button className="pay-modal-cancel" onClick={onClose}>Закрыть</button>
      </div>
    </div>
  )
}

/* Цена со скидкой 50% */
function discountedPrice(priceStr) {
  const num = parseInt(priceStr.replace(/\s/g, ''))
  if (isNaN(num)) return priceStr
  return Math.floor(num * 0.5).toLocaleString('ru-RU') + ' ₽'
}

function TariffList({ tariffs, busyKey, onBuy }) {
  return (
    <div className="t-list">
      {tariffs.filter(t => !t.hero).map(t => (
        <div key={t.key} className={`t-row${t.popular?' popular':''}${busyKey===t.key?' busy':''}`} onClick={() => !busyKey && onBuy(t.key)}>
          <div className="t-row-qty">
            {t.label} {t.popular && <span className="pop-label">Популярное</span>}
          </div>
          <div className="t-row-right">
            {t.perPhoto && <div className="t-row-per">{t.perPhoto}</div>}
            <div style={{textAlign:'right'}}>
              <span className="t-orig-price">{t.price}</span>
              <div className="t-row-price">{discountedPrice(t.price)}</div>
            </div>
            <div className="t-save-badge best">−50%</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ────────────────────────────────── ИСТОРИЯ ── */
function HistoryTab({ vkId, me, showToast, onGoTariffs, onGoProfile, onRefresh }) {
  const [items, setItems] = useState(null)

  const load = useCallback(() => {
    if (!vkId) return
    setItems(null)
    api.history(vkId).then(r => setItems(r.history || [])).catch(() => setItems([]))
  }, [vkId])

  useEffect(() => { load() }, [load])

  const openItem = (url) => {
    bridge.send('VKWebAppOpenLink', { link: url }).catch(() => {})
  }

  return (
    <>
      <TopBar me={me} onGoProfile={onGoProfile} onGoTariffs={onGoTariffs} onRefresh={onRefresh} />
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px 0'}}>
        <div>
          <div className="sec-title" style={{paddingBottom:2}}>История</div>
          <div className="sec-sub">Все твои генерации</div>
        </div>
        <button className="refresh-btn" onClick={load}>🔄 Обновить</button>
      </div>
      {items === null
        ? <div className="state"><div className="spinner" /><div>Загружаю...</div></div>
        : items.length === 0
          ? <div className="state">Пока пусто — начни генерацию!</div>
          : <div className="hist-grid">
              {items.map((it, i) => (
                <div key={i} className="hist-cell" onClick={() => openItem(it.result_url)}>
                  <img src={it.result_url} alt="" />
                </div>
              ))}
            </div>
      }
    </>
  )
}

/* Поддержка → открываем личку админа напрямую.
   Партнёр → становится партнёром, callback с обновлёнными данными. */
async function openSupport(vkId, kind, showToast, onPartnerDone) {
  if (!vkId) { showToast && showToast('Нет vk_id'); return }
  try {
    const r = await api.support(vkId, kind)
    if (kind === 'partner') {
      showToast && showToast('🎉 Ты теперь партнёр! Приводи людей и зарабатывай 30% 🤑')
      onPartnerDone && onPartnerDone(r)
    } else {
      // Бот уже отправил гиперссылку на Любовь в чат — открываем чат с ботом
      showToast && showToast('💬 Открой сообщения с ботом — там ссылка на поддержку')
      setTimeout(() => {
        bridge.send('VKWebAppOpenLink', { link: 'https://vk.com/im?sel=-239444342' }).catch(() => {})
      }, 1200)
    }
  } catch {
    showToast && showToast('Не получилось, попробуй ещё раз')
  }
}

/* ── Партнёрский дашборд (отдельный компонент для чистоты) ── */
function PartnerDashboard({ me, vkId, showToast }) {
  const [copied, setCopied] = useState(false)
  const partnerLink = vkId ? `https://vk.com/app54628838#ref${vkId}` : 'https://vk.com/app54628838'
  const pct = me?.partner_pct ?? 30
  const paid = Number(me?.partner_paid ?? 0)
  const withdrawn = 0 // нет поля — пока 0
  const pending = Math.max(0, paid - withdrawn)

  const copy = () => {
    bridge.send('VKWebAppCopyText', { text: partnerLink })
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => showToast('Скопируй ссылку вручную'))
  }

  return (
    <div className="partner-dashboard">
      <div className="partner-dash-title">💰 Партнёрская программа</div>
      <div className="partner-dash-grid">
        <div className="partner-stat purple">
          <div className="partner-stat-num">{me?.ref_count ?? 0}</div>
          <div className="partner-stat-label">Перешли</div>
        </div>
        <div className="partner-stat purple">
          <div className="partner-stat-num">{me?.ref_paid_count ?? 0}</div>
          <div className="partner-stat-label">Купили</div>
        </div>
        <div className="partner-stat green">
          <div className="partner-stat-num">{paid.toLocaleString('ru-RU')} ₽</div>
          <div className="partner-stat-label">Заработано</div>
        </div>
        <div className="partner-stat orange">
          <div className="partner-stat-num">{pending.toLocaleString('ru-RU')} ₽</div>
          <div className="partner-stat-label">К выплате</div>
        </div>
      </div>
      <div className="partner-meta">Уже выплачено: {withdrawn} ₽ · твой процент: {pct}%</div>
      <div className="ref-link" style={{marginTop:10}}>{partnerLink}</div>
      <button className={`ref-copy-btn${copied?' copied':''}`} onClick={copy} style={{marginTop:8}}>
        {copied ? '✅ Скопировано!' : '📋 Скопировать партнёрскую ссылку'}
      </button>
      <div className="partner-payout-note">
        Выплаты — по запросу в поддержку:{' '}
        <span
          style={{color:'#a78bfa',cursor:'pointer',textDecoration:'underline'}}
          onClick={() => bridge.send('VKWebAppOpenLink', { link: 'https://vk.com/l_khlopenik' }).catch(()=>{})}
        >@l_khlopenik</span>
      </div>
    </div>
  )
}

/* ────────────────────────────────── ПРОФИЛЬ ── */
function ProfileTab({ vkId, me: meProp, onGoTariffs, onGoProfile, showToast, onRefresh }) {
  const [promo, setPromo] = useState('')
  const [promoMsg, setPromoMsg] = useState(null)
  const [copied, setCopied] = useState(false)
  // локальный патч me после становления партнёром (без перезагрузки страницы)
  const [meOverride, setMeOverride] = useState(null)
  const me = meOverride ? { ...meProp, ...meOverride } : meProp

  const refLink = vkId ? `https://vk.com/app54628838#ref${vkId}` : 'https://vk.com/app54628838'

  const copyRef = () => {
    bridge.send('VKWebAppCopyText', { text: refLink })
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
      .catch(() => showToast('Скопируй ссылку вручную'))
  }

  const applyPromo = () => {
    if (!promo.trim()) return
    setPromoMsg({ ok: false, msg: 'Промокод не найден' })
  }

  const handleBecomePartner = () => {
    openSupport(vkId, 'partner', showToast, (r) => {
      setMeOverride({
        is_partner: true,
        partner_pct: r.partner_pct ?? 30,
        partner_paid: r.partner_paid ?? 0,
        ref_count: r.ref_count ?? me?.ref_count ?? 0,
      })
    })
  }

  return (
    <>
      <TopBar me={me} onGoProfile={onGoProfile} onGoTariffs={onGoTariffs} onRefresh={onRefresh} />

      <div className="profile-wrap">
        <div className="sec-title" style={{padding:'0 0 16px'}}>Мой профиль</div>

        {/* Balance */}
        <div className="bal-card">
          <div className="bal-card-title">Мой баланс</div>
          <div className="bal-row">
            <div className="bal-item"><div className="bal-num p">{me?.std_credits ?? '—'}</div><div className="bal-label">⭐ Стандарт</div></div>
            <div className="bal-item"><div className="bal-num v">{me?.v2_credits ?? '—'}</div><div className="bal-label">✨ Версия 2</div></div>
            <div className="bal-item"><div className="bal-num m">{me?.pro_credits ?? '—'}</div><div className="bal-label">💎 Про</div></div>
          </div>
          <div className="bal-row" style={{marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,.06)'}}>
            <div className="bal-item"><div className="bal-num p">{me?.diamond_credits ?? '—'}</div><div className="bal-label">💠 Алмазы</div></div>
            <div className="bal-item"><div className="bal-num v">{me?.nude_credits ?? 0}</div><div className="bal-label">🌸 Ню</div></div>
            <div className="bal-item"><div className="bal-num m">{me?.video_credits ?? 0}</div><div className="bal-label">🎬 Видео</div></div>
          </div>
        </div>

        <button className="big-btn purple" onClick={onGoTariffs}>💳 Пополнить баланс</button>

        {/* Promo */}
        <div className="bal-card" style={{marginTop:0}}>
          <div style={{fontSize:13,fontWeight:700,color:'#f97316',marginBottom:10}}>🎫 Промокод</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input
              className="promo-input-field"
              style={{flex:1,margin:0}}
              placeholder="ВВЕДИ ПРОМОКОД"
              value={promo}
              onChange={e => setPromo(e.target.value.toUpperCase())}
            />
            <button className="promo-apply-btn" onClick={applyPromo}>Применить</button>
          </div>
          {promoMsg && (
            <div style={{fontSize:13,color: promoMsg.ok ? '#4ade80' : '#f87171',marginTop:8}}>{promoMsg.msg}</div>
          )}
        </div>

        {/* Referral */}
        <div className="ref-box">
          <div className="ref-box-title">🤝 Приглашай · зарабатывай бонусы</div>
          <div className="ref-stats-row">
            <div className="ref-stat-box">
              <div className="ref-stat-num">{me?.ref_count ?? 0}</div>
              <div className="ref-stat-label">Перешли по ссылке</div>
            </div>
            <div className="ref-stat-box">
              <div className="ref-stat-num">{me?.ref_paid ?? 0}</div>
              <div className="ref-stat-label">Купили → +фото тебе</div>
            </div>
          </div>
          <div className="info-row-text" style={{marginBottom:10}}>
            👥 За каждого друга → <span style={{color:'#4ade80',fontWeight:700}}>+5 фото</span> тебе на баланс<br/>
            🚀 5+ человек → скидка <span style={{color:'#4ade80',fontWeight:700}}>−10%</span> навсегда
          </div>
          <div className="ref-link">{refLink}</div>
          <button className={`ref-copy-btn${copied?' copied':''}`} onClick={copyRef}>
            {copied ? '✅ Скопировано!' : '📋 Скопировать ссылку'}
          </button>
        </div>

        {/* Partner — дашборд если уже партнёр, кнопка если нет */}
        {me?.is_partner ? (
          <PartnerDashboard me={me} vkId={vkId} showToast={showToast} />
        ) : (
          <div className="info-row">
            <div className="info-row-title">💰 Партнёрская программа</div>
            <div className="info-row-text">
              Приводи людей в FRAME и получай <span style={{color:'#4ade80',fontWeight:700}}>30%</span> с каждой их оплаты — навсегда. 🤑
            </div>
            <button className="big-btn purple" style={{marginTop:12}} onClick={handleBecomePartner}>
              🚀 Стать партнёром
            </button>
          </div>
        )}

        {/* Support */}
        <button className="big-btn dark" onClick={() => openSupport(vkId, 'support', showToast)}>
          💬 Написать в поддержку
        </button>

        <div style={{height:24}} />
      </div>
    </>
  )
}
