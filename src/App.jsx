import { useEffect, useState, useCallback, useRef } from 'react'
import bridge from '@vkontakte/vk-bridge'
import {
  AdaptivityProvider, AppRoot, SplitLayout, SplitCol,
  View, Panel, PanelHeader, PanelHeaderBack, Group, Cell, Avatar,
  Button, Spinner, Placeholder, Div, Header,
  Tabbar, TabbarItem, FormItem, Textarea,
  Card, Image as VKImage, FixedLayout, SimpleCell, Banner,
  MiniInfoCell, CardGrid, ContentCard,
} from '@vkontakte/vkui'
import {
  Icon28UserOutline, Icon28PaymentCardOutline,
  Icon28PicturePlusOutline, Icon28ListOutline, Icon28InfoOutline,
  Icon28CameraOutline, Icon28ChevronRightOutline,
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

function totalCredits(me) {
  if (!me) return 0
  return (me.std_credits || 0) + (me.v2_credits || 0) + (me.pro_credits || 0) + (me.gift_credits || 0)
}

export default function App() {
  const [vkUser, setVkUser] = useState(null)
  const [activePanel, setActivePanel] = useState('home')
  const [history, setHistory] = useState(['home'])
  const [me, setMe] = useState(null)
  const [loadingMe, setLoadingMe] = useState(true)

  const refreshMe = useCallback((vk_id) => {
    if (!vk_id) return
    api.me(vk_id).then(setMe).catch(() => {})
  }, [])

  useEffect(() => {
    const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
    try { bridge.send('VKWebAppInit') } catch {}
    Promise.race([bridge.send('VKWebAppGetUserInfo'), timeout(5000)])
      .then((u) => { setVkUser(u); return api.me(u.id) })
      .then((m) => setMe(m))
      .catch((e) => console.error('init error', e))
      .finally(() => setLoadingMe(false))
  }, [])

  const go = useCallback((panel) => {
    setHistory((h) => [...h, panel])
    setActivePanel(panel)
  }, [])

  const goBack = useCallback(() => {
    setHistory((h) => {
      const next = h.slice(0, -1)
      setActivePanel(next[next.length - 1] || 'home')
      return next
    })
  }, [])

  // tab navigation resets history
  const goTab = useCallback((panel) => {
    setHistory([panel])
    setActivePanel(panel)
  }, [])

  const vkId = vkUser?.id
  const canGoBack = history.length > 1

  const tabItems = [
    { id: 'home', label: 'Главная', icon: <Icon28UserOutline /> },
    { id: 'generate', label: 'Генерация', icon: <Icon28PicturePlusOutline /> },
    { id: 'balance', label: 'Баланс', icon: <Icon28PaymentCardOutline /> },
    { id: 'history', label: 'История', icon: <Icon28ListOutline /> },
    { id: 'about', label: 'О боте', icon: <Icon28InfoOutline /> },
  ]

  const mainTabs = ['home', 'generate', 'balance', 'history', 'about']
  const activeTab = mainTabs.includes(activePanel) ? activePanel
    : mainTabs.includes(history.find(h => mainTabs.includes(h))) ? history.find(h => mainTabs.includes(h)) : 'home'

  return (
    <AdaptivityProvider>
      <AppRoot>
        <SplitLayout>
          <SplitCol autoSpaced>
            <View activePanel={activePanel} history={history} onSwipeBack={goBack}>

              <Panel id="home">
                <PanelHeader>FRAME</PanelHeader>
                <HomePanel vkUser={vkUser} me={me} loading={loadingMe} go={go} />
              </Panel>

              <Panel id="generate">
                <PanelHeader before={canGoBack && activePanel === 'generate' ? <PanelHeaderBack onClick={goBack} /> : null}>
                  Генерация фото
                </PanelHeader>
                <GeneratePanel vkId={vkId} onDone={() => refreshMe(vkId)} go={go} goBack={goBack} />
              </Panel>

              <Panel id="balance">
                <PanelHeader before={canGoBack && activePanel === 'balance' ? <PanelHeaderBack onClick={goBack} /> : null}>
                  Баланс
                </PanelHeader>
                <BalancePanel me={me} loading={loadingMe} go={go} />
              </Panel>

              <Panel id="tariffs">
                <PanelHeader before={<PanelHeaderBack onClick={goBack} />}>Купить кредиты</PanelHeader>
                <TariffsPanel vkId={vkId} />
              </Panel>

              <Panel id="history">
                <PanelHeader before={canGoBack && activePanel === 'history' ? <PanelHeaderBack onClick={goBack} /> : null}>
                  История
                </PanelHeader>
                <HistoryPanel vkId={vkId} />
              </Panel>

              <Panel id="about">
                <PanelHeader>О приложении</PanelHeader>
                <AboutPanel />
              </Panel>

            </View>
          </SplitCol>
        </SplitLayout>

        <FixedLayout vertical="bottom">
          <Tabbar>
            {tabItems.map(({ id, label, icon }) => (
              <TabbarItem key={id} selected={activeTab === id} onClick={() => goTab(id)} text={label}>
                {icon}
              </TabbarItem>
            ))}
          </Tabbar>
        </FixedLayout>
      </AppRoot>
    </AdaptivityProvider>
  )
}

function HomePanel({ vkUser, me, loading, go }) {
  return (
    <>
      {vkUser && (
        <Group>
          <SimpleCell
            before={<Avatar src={vkUser.photo_200} size={48} />}
            subtitle={loading ? 'Загрузка...' : `${totalCredits(me)} фото доступно`}
          >
            {vkUser.first_name} {vkUser.last_name}
          </SimpleCell>
        </Group>
      )}

      <Group>
        <Banner
          before={<span style={{ fontSize: 40 }}>🪄</span>}
          header="AI-фотосессии"
          subheader="Загрузи фото — нейросеть создаст стильные кадры за пару минут"
          actions={
            <Button size="l" onClick={() => go('generate')}>
              Начать генерацию
            </Button>
          }
        />
      </Group>

      <Group header={<Header>Быстрые действия</Header>}>
        <SimpleCell
          before={<Icon28PicturePlusOutline />}
          after={<Icon28ChevronRightOutline />}
          onClick={() => go('generate')}
        >
          📸 Генерация фото
        </SimpleCell>
        <SimpleCell
          before={<Icon28PaymentCardOutline />}
          after={<Icon28ChevronRightOutline />}
          subtitle={me ? `${totalCredits(me)} фото` : ''}
          onClick={() => go('balance')}
        >
          💳 Мой баланс
        </SimpleCell>
        <SimpleCell
          before={<Icon28PaymentCardOutline />}
          after={<Icon28ChevronRightOutline />}
          onClick={() => go('tariffs')}
        >
          🛒 Купить кредиты
        </SimpleCell>
      </Group>
    </>
  )
}

function GeneratePanel({ vkId, onDone, go, goBack }) {
  const [step, setStep] = useState('photo')
  const [photoUrl, setPhotoUrl] = useState('')
  const [models, setModels] = useState(null)
  const [modelKey, setModelKey] = useState(null)
  const [modelLabel, setModelLabel] = useState('')
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [resultUrl, setResultUrl] = useState(null)

  useEffect(() => { api.models().then(setModels).catch(() => {}) }, [])

  const reset = () => {
    setStep('photo'); setPhotoUrl(''); setModelKey(null)
    setModelLabel(''); setPrompt(''); setError(null); setResultUrl(null)
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
      setError('Загрузка фото недоступна. Попробуйте в мобильном приложении VK.')
    }
  }

  const selectModel = (key, label) => {
    setModelKey(key); setModelLabel(label); setStep('prompt')
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
      if (e.code === 'no_credits') setError('Недостаточно кредитов. Зайдите в «Купить кредиты».')
      else setError('Не получилось. Попробуйте ещё раз.')
    } finally {
      setBusy(false)
    }
  }

  const stepBack = () => {
    if (step === 'model') setStep('photo')
    else if (step === 'prompt') setStep('model')
    else if (step === 'result') reset()
    else goBack()
  }

  const steps = { photo: 1, model: 2, prompt: 3, result: 3 }
  const stepLabels = ['Фото', 'Модель', 'Промпт']

  return (
    <>
      {step !== 'photo' && (
        <Group>
          <Div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button mode="tertiary" size="s" onClick={stepBack}>← Назад</Button>
            <span style={{ color: 'var(--vkui--color_text_secondary)', fontSize: 13 }}>
              Шаг {steps[step]} из 3 · {stepLabels[steps[step] - 1]}
            </span>
          </Div>
        </Group>
      )}

      {step === 'photo' && (
        <Group>
          <Placeholder
            icon={<Icon28CameraOutline width={56} height={56} />}
            header="Выбери фото"
            action={<Button size="l" onClick={pickPhoto}>Выбрать из галереи</Button>}
          >
            Загрузи своё фото для обработки нейросетью
          </Placeholder>
          {error && <Div style={{ color: 'var(--vkui--color_text_negative)', textAlign: 'center' }}>{error}</Div>}
        </Group>
      )}

      {step === 'model' && (
        <>
          <Group header={<Header>⭐ Стандартные модели</Header>}>
            {(models?.gallery || []).map((m) => (
              <SimpleCell
                key={m.key}
                after={<Icon28ChevronRightOutline />}
                onClick={() => selectModel(m.key, m.label)}
              >
                {m.label}
              </SimpleCell>
            ))}
          </Group>
          {(models?.diamond || []).length > 0 && (
            <Group header={<Header>💎 Алмазные модели</Header>}>
              {(models.diamond || []).map((m) => (
                <SimpleCell
                  key={m.key}
                  subtitle={`${m.cost} 💎 алмазов`}
                  after={<Icon28ChevronRightOutline />}
                  onClick={() => selectModel(m.key, m.label)}
                >
                  {m.label}
                </SimpleCell>
              ))}
            </Group>
          )}
        </>
      )}

      {step === 'prompt' && (
        <Group>
          <MiniInfoCell before={<span>📸</span>}>Фото выбрано</MiniInfoCell>
          <MiniInfoCell before={<span>🎨</span>}>{modelLabel}</MiniInfoCell>
          <FormItem top="Опиши желаемый результат (необязательно)">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Например: в стиле киберпанк, неоновый свет"
            />
          </FormItem>
          {error && <Div style={{ color: 'var(--vkui--color_text_negative)' }}>{error}</Div>}
          <Div>
            <Button size="l" stretched loading={busy} disabled={busy} onClick={runGenerate}>
              ✨ Сгенерировать
            </Button>
          </Div>
        </Group>
      )}

      {step === 'result' && (
        <Group>
          {resultUrl
            ? <>
                <Div><img src={resultUrl} alt="Результат" style={{ width: '100%', borderRadius: 12 }} /></Div>
                <Div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Button size="l" stretched onClick={() => bridge.send('VKWebAppShare', { link: resultUrl })}>
                    Поделиться
                  </Button>
                  <Button size="l" stretched mode="secondary" onClick={reset}>
                    Сгенерировать ещё
                  </Button>
                </Div>
              </>
            : <Spinner size="l" style={{ marginTop: 40 }} />
          }
        </Group>
      )}
    </>
  )
}

function BalancePanel({ me, loading, go }) {
  if (loading) return <Spinner size="l" style={{ marginTop: 40 }} />
  if (!me) return <Placeholder>Не удалось загрузить баланс</Placeholder>
  const rows = CREDIT_LABELS.filter(([key]) => (me[key] || 0) > 0)
  return (
    <>
      <Group header={<Header>Текущий баланс</Header>}>
        {rows.length === 0
          ? <Placeholder icon={<span style={{ fontSize: 40 }}>💳</span>}>
              Кредитов пока нет
            </Placeholder>
          : rows.map(([key, label]) => (
              <SimpleCell key={key} after={<b>{me[key]}</b>}>{label}</SimpleCell>
            ))
        }
      </Group>
      <Group>
        <Div>
          <Button size="l" stretched onClick={() => go('tariffs')}>🛒 Купить кредиты</Button>
        </Div>
      </Group>
    </>
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
        <SimpleCell
          key={t.key}
          subtitle={`${t.price} ₽`}
          after={
            <Button size="s" loading={busyKey === t.key} onClick={() => buy(t.key)}>
              Купить
            </Button>
          }
        >
          {t.label}
        </SimpleCell>
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
  if (items.length === 0) {
    return (
      <Placeholder icon={<span style={{ fontSize: 40 }}>🖼️</span>} header="Пока пусто">
        Здесь появятся ваши генерации
      </Placeholder>
    )
  }

  return (
    <Group header={<Header>Последние генерации</Header>}>
      <CardGrid size="l">
        {items.map((it, i) => (
          <ContentCard
            key={i}
            src={it.result_url}
            alt="Генерация"
            subtitle={it.prompt || ''}
            maxHeight={300}
          />
        ))}
      </CardGrid>
    </Group>
  )
}

function AboutPanel() {
  return (
    <Group>
      <Placeholder icon={<span style={{ fontSize: 56 }}>🪄</span>} header="FRAME">
        AI-фотосессии прямо во ВКонтакте. Загрузи фото — получи стильные кадры за минуты.
      </Placeholder>
      <Group mode="plain">
        <SimpleCell subtitle="Текущая версия">Версия 1.0</SimpleCell>
        <SimpleCell
          subtitle="Перейти в сообщество"
          onClick={() => bridge.send('VKWebAppOpenLink', { link: 'https://vk.com/club239444342' })}
          after={<Icon28ChevronRightOutline />}
        >
          Бот FRAME VK
        </SimpleCell>
      </Group>
    </Group>
  )
}
