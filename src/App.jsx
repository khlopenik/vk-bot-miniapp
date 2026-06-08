import { useEffect, useState, useCallback } from 'react'
import bridge from '@vkontakte/vk-bridge'
import {
  AdaptivityProvider, AppRoot, SplitLayout, SplitCol,
  View, Panel, PanelHeader, Group, Cell, Avatar,
  Button, Spinner, Placeholder, Div, Header,
  Tabbar, TabbarItem, FormItem, Input, Textarea,
  Card, Image as VKImage, FixedLayout,
} from '@vkontakte/vkui'
import {
  Icon28UserOutline, Icon28PaymentCardOutline,
  Icon28PicturePlusOutline, Icon28ListOutline, Icon28InfoOutline,
} from '@vkontakte/icons'
import { api } from './api'
import './App.css'

const CREDIT_LABELS = [
  ['std_credits', '⭐ Стандарт'],
  ['v2_credits', '✨ Версия 2'],
  ['pro_credits', '💎 Про'],
  ['diamond_credits', '🔷 Алмазы'],
  ['gift_credits', '🎁 Подарочные'],
]

function App() {
  const [vkUser, setVkUser] = useState(null)
  const [activeTab, setActiveTab] = useState('home')
  const [me, setMe] = useState(null)
  const [loadingMe, setLoadingMe] = useState(true)

  const refreshMe = useCallback((vk_id) => {
    if (!vk_id) return
    api.me(vk_id).then(setMe).catch(() => {})
  }, [])

  useEffect(() => {
    bridge.send('VKWebAppInit')
    bridge.send('VKWebAppGetUserInfo')
      .then((u) => {
        setVkUser(u)
        return api.me(u.id)
      })
      .then((m) => setMe(m))
      .catch((e) => console.error('init error', e))
      .finally(() => setLoadingMe(false))
  }, [])

  const vkId = vkUser?.id

  return (
    <AdaptivityProvider>
      <AppRoot>
        <SplitLayout header={<PanelHeader delimiter="none" />}>
          <SplitCol autoSpaced>
            <View activePanel={activeTab}>
              <Panel id="home">
                <PanelHeader>FRAME — AI фотосессии</PanelHeader>
                <HomePanel vkUser={vkUser} me={me} loading={loadingMe} go={setActiveTab} />
              </Panel>

              <Panel id="generate">
                <PanelHeader>Генерация фото</PanelHeader>
                <GeneratePanel vkId={vkId} onDone={() => refreshMe(vkId)} />
              </Panel>

              <Panel id="balance">
                <PanelHeader>Баланс</PanelHeader>
                <BalancePanel me={me} loading={loadingMe} />
              </Panel>

              <Panel id="tariffs">
                <PanelHeader>Купить кредиты</PanelHeader>
                <TariffsPanel vkId={vkId} />
              </Panel>

              <Panel id="history">
                <PanelHeader>История</PanelHeader>
                <HistoryPanel vkId={vkId} />
              </Panel>

              <Panel id="about">
                <PanelHeader>О боте</PanelHeader>
                <AboutPanel />
              </Panel>
            </View>
          </SplitCol>
        </SplitLayout>

        <FixedLayout vertical="bottom">
          <Tabbar>
            <TabbarItem selected={activeTab === 'home'} onClick={() => setActiveTab('home')} text="Главная">
              <Icon28UserOutline />
            </TabbarItem>
            <TabbarItem selected={activeTab === 'generate'} onClick={() => setActiveTab('generate')} text="Генерация">
              <Icon28PicturePlusOutline />
            </TabbarItem>
            <TabbarItem selected={activeTab === 'balance'} onClick={() => setActiveTab('balance')} text="Баланс">
              <Icon28PaymentCardOutline />
            </TabbarItem>
            <TabbarItem selected={activeTab === 'history'} onClick={() => setActiveTab('history')} text="История">
              <Icon28ListOutline />
            </TabbarItem>
            <TabbarItem selected={activeTab === 'about'} onClick={() => setActiveTab('about')} text="О боте">
              <Icon28InfoOutline />
            </TabbarItem>
          </Tabbar>
        </FixedLayout>
      </AppRoot>
    </AdaptivityProvider>
  )
}

function HomePanel({ vkUser, me, loading, go }) {
  return (
    <Group>
      {vkUser && (
        <Cell before={<Avatar src={vkUser.photo_200} />} subtitle="Добро пожаловать в FRAME!">
          {vkUser.first_name} {vkUser.last_name}
        </Cell>
      )}
      <Div>
        <Placeholder
          icon={<span style={{ fontSize: 48 }}>🪄</span>}
          header="AI-фотосессии прямо здесь"
        >
          Загрузи своё фото — нейросеть создаст стильные кадры за пару минут
        </Placeholder>
      </Div>
      <Div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Button size="l" stretched onClick={() => go('generate')}>📸 Начать генерацию</Button>
        <Button size="l" stretched mode="secondary" onClick={() => go('balance')}>
          💳 Баланс {me ? `· ${totalCredits(me)} фото` : ''}
        </Button>
        <Button size="l" stretched mode="outline" onClick={() => go('tariffs')}>🛒 Купить кредиты</Button>
      </Div>
    </Group>
  )
}

function totalCredits(me) {
  if (!me) return 0
  return (me.std_credits || 0) + (me.v2_credits || 0) + (me.pro_credits || 0) + (me.gift_credits || 0)
}

function GeneratePanel({ vkId, onDone }) {
  const [step, setStep] = useState('photo') // photo -> model -> prompt -> result
  const [photoUrl, setPhotoUrl] = useState('')
  const [models, setModels] = useState(null)
  const [modelKey, setModelKey] = useState(null)
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)

  useEffect(() => { api.models().then(setModels).catch(() => {}) }, [])

  const reset = () => {
    setStep('photo'); setPhotoUrl(''); setModelKey(null)
    setPrompt(''); setError(null); setResultUrl(null)
  }

  const pickPhoto = async () => {
    setError(null)
    try {
      const r = await bridge.send('VKWebAppOpenFiles', { count: 1 })
      const file = r?.files?.[0] || r?.urls?.[0]
      const url = typeof file === 'string' ? file : file?.url
      if (url) { setPhotoUrl(url); setStep('model') }
      else setError('Не удалось получить фото')
    } catch {
      setError('Загрузка фото недоступна в этой версии VK. Попробуйте через приложение VK на телефоне.')
    }
  }

  const runGenerate = async () => {
    if (!vkId || !photoUrl || !modelKey) return
    setBusy(true); setError(null)
    try {
      const r = await api.generate(vkId, photoUrl, modelKey, prompt)
      setResultUrl(r.result_url)
      setStep('result')
      onDone?.()
    } catch (e) {
      if (e.code === 'no_credits') setError('Недостаточно кредитов для этой модели. Загляните в «Купить кредиты».')
      else setError('Не получилось сгенерировать. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  if (step === 'photo') {
    return (
      <Group>
        <Div>
          <Placeholder icon={<span style={{ fontSize: 48 }}>📷</span>} header="Шаг 1 из 3">
            Выбери фотографию для обработки
          </Placeholder>
        </Div>
        {error && <Div style={{ color: 'var(--vkui--color_text_negative)' }}>{error}</Div>}
        <Div><Button size="l" stretched onClick={pickPhoto}>Выбрать фото</Button></Div>
      </Group>
    )
  }

  if (step === 'model') {
    const list = models?.gallery || []
    return (
      <Group header={<Header>Шаг 2 из 3 · Выбери модель</Header>}>
        {list.map((m) => (
          <Cell key={m.key} onClick={() => { setModelKey(m.key); setStep('prompt') }}>
            {m.label}
          </Cell>
        ))}
        {(models?.diamond || []).map((m) => (
          <Cell key={m.key} subtitle={`${m.cost} 💎`} onClick={() => { setModelKey(m.key); setStep('prompt') }}>
            {m.label}
          </Cell>
        ))}
      </Group>
    )
  }

  if (step === 'prompt') {
    return (
      <Group header={<Header>Шаг 3 из 3 · Промпт (необязательно)</Header>}>
        <FormItem top="Опиши, что хочешь получить, или оставь пустым">
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Например: в стиле киберпанк, неон" />
        </FormItem>
        {error && <Div style={{ color: 'var(--vkui--color_text_negative)' }}>{error}</Div>}
        <Div>
          <Button size="l" stretched loading={busy} disabled={busy} onClick={runGenerate}>
            ✨ Сгенерировать
          </Button>
        </Div>
      </Group>
    )
  }

  if (step === 'result') {
    return (
      <Group>
        <Div>
          {resultUrl
            ? <Card mode="shadow"><VKImage src={resultUrl} alt="Результат" style={{ width: '100%' }} /></Card>
            : <Spinner size="l" />}
        </Div>
        <Div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {resultUrl && <Button size="l" stretched onClick={() => bridge.send('VKWebAppShare', { link: resultUrl })}>Поделиться</Button>}
          <Button size="l" stretched mode="secondary" onClick={reset}>Сгенерировать ещё</Button>
        </Div>
      </Group>
    )
  }

  return <Spinner size="l" />
}

function BalancePanel({ me, loading }) {
  if (loading) return <Spinner size="l" style={{ marginTop: 40 }} />
  if (!me) return <Placeholder>Не удалось загрузить баланс</Placeholder>
  const rows = CREDIT_LABELS.filter(([key]) => (me[key] || 0) > 0)
  return (
    <Group header={<Header>Текущий баланс</Header>}>
      {rows.length === 0 && (
        <Placeholder icon={<span style={{ fontSize: 40 }}>💳</span>}>
          Кредитов пока нет — загляните в «Купить кредиты»
        </Placeholder>
      )}
      {rows.map(([key, label]) => (
        <Cell key={key} after={<b>{me[key]}</b>}>{label}</Cell>
      ))}
    </Group>
  )
}

function TariffsPanel({ vkId }) {
  const [tariffs, setTariffs] = useState(null)
  const [busyKey, setBusyKey] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { api.tariffs().then((r) => setTariffs(r.tariffs)).catch(() => {}) }, [])

  const buy = async (key) => {
    if (!vkId) return
    setBusyKey(key); setError(null)
    try {
      const r = await api.pay(vkId, key)
      if (r.confirmation_url) {
        await bridge.send('VKWebAppOpenLink', { link: r.confirmation_url, blank: true })
      }
    } catch {
      setError('Не удалось создать платёж. Попробуйте чуть позже.')
    } finally {
      setBusyKey(null)
    }
  }

  if (!tariffs) return <Spinner size="l" style={{ marginTop: 40 }} />

  return (
    <Group header={<Header>Тарифы</Header>}>
      {error && <Div style={{ color: 'var(--vkui--color_text_negative)' }}>{error}</Div>}
      {tariffs.map((t) => (
        <Cell
          key={t.key}
          subtitle={`${t.price} ₽`}
          after={<Button size="m" loading={busyKey === t.key} onClick={() => buy(t.key)}>Купить</Button>}
        >
          {t.label}
        </Cell>
      ))}
    </Group>
  )
}

function HistoryPanel({ vkId }) {
  const [items, setItems] = useState(null)

  useEffect(() => {
    if (!vkId) return
    api.history(vkId).then((r) => setItems(r.history)).catch(() => setItems([]))
  }, [vkId])

  if (items === null) return <Spinner size="l" style={{ marginTop: 40 }} />
  if (items.length === 0) return <Placeholder icon={<span style={{ fontSize: 40 }}>🖼️</span>}>Здесь появятся ваши генерации</Placeholder>

  return (
    <Group header={<Header>Последние генерации</Header>}>
      {items.map((it, i) => (
        <Card key={i} mode="shadow" style={{ margin: 8 }}>
          <VKImage src={it.result_url} alt="" style={{ width: '100%' }} />
          {it.prompt && <Div style={{ fontSize: 13, color: 'var(--vkui--color_text_secondary)' }}>{it.prompt}</Div>}
        </Card>
      ))}
    </Group>
  )
}

function AboutPanel() {
  return (
    <Group>
      <Div>
        <Placeholder icon={<span style={{ fontSize: 48 }}>🪄</span>} header="FRAME">
          AI-фотосессии прямо во ВКонтакте. Загрузи фото — получи стильные кадры за минуты.
        </Placeholder>
      </Div>
      <Cell subtitle="Версия">1.0</Cell>
      <Cell
        subtitle="Сообщество"
        onClick={() => bridge.send('VKWebAppOpenLink', { link: 'https://vk.com/club239444342', blank: true })}
      >
        Бот FRAME VK
      </Cell>
    </Group>
  )
}

export default App
