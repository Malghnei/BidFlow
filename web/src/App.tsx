import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { io, Socket } from 'socket.io-client'
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import './App.css'

type EventInfo = { eventId: string; eventName?: string }
type Item = {
  id: string
  title: string
  description?: string
  lotNumber?: number
  currentBid?: number
  startingBid?: number
  image?: string
  status?: string
  bids?: Array<{ bidderName: string; amount: number; timestamp: string }>
  activeGroups?: Group[]
}
type Bid = { itemId: string; itemTitle: string; amount: number; status: string }
type Group = {
  id: string
  groupName?: string
  name?: string
  joinCode?: string
  totalAmount: number
  members?: Array<{ bidderId: string; displayName: string; contribution: number }>
}
type Bidder = {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  displayName: string
  bidderCode?: string
  anonymityMode?: string
  paymentLinked?: boolean
}

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? 'http://localhost:3000'
const LS_KEY = 'bidflow-react-session'

type Session = {
  eventId?: string
  eventName?: string
  bidderId?: string
  displayName?: string
  bidderCode?: string
}

function readSession(): Session {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as Session) : {}
  } catch {
    return {}
  }
}

function writeSession(next: Session) {
  localStorage.setItem(LS_KEY, JSON.stringify(next))
}

function currency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) {
    const maybeJson = await res.json().catch(() => null)
    throw new Error(maybeJson?.message ?? maybeJson?.error ?? `Request failed: ${res.status}`)
  }
  return (await res.json()) as T
}

function useAuctionSocket(session: Session, onBid?: (itemId: string, amount: number) => void, onGroup?: () => void) {
  useEffect(() => {
    if (!session.eventId) return
    const socket: Socket = io(API_BASE, { transports: ['websocket', 'polling'] })
    socket.on('connect', () => {
      socket.emit('join-auction', { eventId: session.eventId, bidderId: session.bidderId })
    })
    if (onBid) socket.on('bid:new', (d: { itemId: string; amount: number }) => onBid(d.itemId, d.amount))
    if (onGroup) socket.on('group:updated', () => onGroup())
    return () => {
      socket.disconnect()
    }
  }, [session.eventId, session.bidderId, onBid, onGroup])
}

function TopHeader({ title }: { title: string }) {
  return (
    <header className="top-header">
      <h1>{title}</h1>
      <div className="brand-pill">
        <img src="public/img/Islamic%20Relief%20Canada.png" alt="Islamic Relief Canada" />
      </div>
      <button className="notice-btn" aria-label="notifications">
        <span className="dot" />
        <svg viewBox="0 0 24 24">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" />
        </svg>
      </button>
    </header>
  )
}

function BottomNav() {
  return (
    <nav className="app-nav-bar">
      <Link to="/items" className="app-nav-item">Items</Link>
      <Link to="/mybids" className="app-nav-item">My Bids</Link>
      <Link to="/groups" className="app-nav-item">Groups</Link>
      <Link to="/profile" className="app-nav-item">Profile</Link>
    </nav>
  )
}

function JoinPage({ onSession }: { onSession: (next: Session) => void }) {
  const navigate = useNavigate()
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (passcode.length !== 6) return setError('Passcode must be 6 digits')
    setLoading(true)
    try {
      const data = await api<EventInfo>(`/api/resolve-event?passcode=${encodeURIComponent(passcode)}`)
      onSession({ eventId: data.eventId, eventName: data.eventName })
      navigate('/register')
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="join-layout">
      <div className="join-card card">
        <div className="center brand-stack">
          <img src="/img/Islamic%20Relief%20Canada.png" alt="Islamic Relief Canada" />
          <p>Islamic Relief Canada x Western IRC</p>
        </div>
        <form onSubmit={onSubmit} className="stack">
          <label className="label">Event Passcode</label>
          <input
            value={passcode}
            onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            className="passcode"
          />
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" disabled={loading}>
            {loading ? 'Joining...' : 'Join Event'}
          </button>
        </form>
        <div className="demo-links">
          <a href={`${API_BASE}/admin.html`} target="_blank" rel="noreferrer">Admin Dashboard</a>
          <a href={`${API_BASE}/display.html`} target="_blank" rel="noreferrer">Open Live Display</a>
        </div>
      </div>
    </div>
  )
}

function RegisterPage({ session, onSession }: { session: Session; onSession: (next: Session) => void }) {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'realName' | 'nickname' | 'anonymous'>('realName')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  if (!session.eventId) return <Navigate to="/" replace />

  const displayName = mode === 'realName'
    ? `${firstName || 'John'} ${lastName || 'Doe'}`
    : mode === 'nickname'
      ? (nickname || 'Your Nickname')
      : 'Anonymous Bidder'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const map = { realName: 'real_name', nickname: 'nickname', anonymous: 'anonymous' }
    try {
      const data = await api<{ id: string; bidderId?: string; bidderCode?: string }>(`/api/events/${session.eventId}/bidders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone, displayName, anonymityMode: map[mode] }),
      })
      onSession({ ...session, bidderId: data.id ?? data.bidderId, displayName, bidderCode: data.bidderCode })
      navigate('/items')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    }
  }

  return (
    <div className="page-wrap">
      <div className="page-card card">
        <h2>Register as Bidder</h2>
        <form className="stack" onSubmit={onSubmit}>
          <div className="row">
            <input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <input placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <div className="mode-grid">
            <button type="button" className={mode === 'realName' ? 'mode active' : 'mode'} onClick={() => setMode('realName')}>Use My Real Name</button>
            <button type="button" className={mode === 'nickname' ? 'mode active' : 'mode'} onClick={() => setMode('nickname')}>Use a Nickname</button>
            <button type="button" className={mode === 'anonymous' ? 'mode active' : 'mode'} onClick={() => setMode('anonymous')}>Stay Anonymous</button>
          </div>
          {mode === 'nickname' && <input placeholder="Your Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />}
          <div className="preview">You'll appear as: <strong>{displayName}</strong></div>
          {error && <p className="error">{error}</p>}
          <button className="btn-primary">Complete Registration</button>
        </form>
      </div>
    </div>
  )
}

function ItemsPage({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useAuctionSocket(session, (itemId, amount) => {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, currentBid: amount } : i)))
  })
  useEffect(() => {
    if (!session.eventId) return
    api<Item[]>(`/api/events/${session.eventId}/items`)
      .then(setItems)
      .catch(() => setError('Failed to load items'))
      .finally(() => setLoading(false))
  }, [session.eventId])
  if (!session.eventId || !session.bidderId) return <Navigate to="/" replace />
  return (
    <div className="app-page">
      <TopHeader title="Auction Items" />
      <main className="content-grid">
        {loading && <p>Loading items...</p>}
        {error && <p className="error">{error}</p>}
        {items.map((item) => (
          <article key={item.id} className="item-card card" onClick={() => navigate(`/item?itemId=${item.id}`)}>
            <div className="item-image">{item.image ? <img src={item.image} alt={item.title} /> : <span>No Image</span>}</div>
            <div className="item-body">
              <h3>{item.title}</h3>
              <div className="bid-row">
                <span>Current Bid</span>
                <strong>{currency(item.currentBid ?? item.startingBid ?? 0)}</strong>
              </div>
            </div>
          </article>
        ))}
      </main>
      <BottomNav />
    </div>
  )
}

function ItemPage({ session }: { session: Session }) {
  const [params] = useSearchParams()
  const itemId = params.get('itemId')
  const [item, setItem] = useState<Item | null>(null)
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [groups, setGroups] = useState<Group[]>([])
  const currentBid = item?.currentBid ?? item?.startingBid ?? 0
  const minBid = currentBid + 5
  const canLoad = Boolean(session.eventId && session.bidderId && itemId)
  useAuctionSocket(session, (id, nextAmount) => {
    if (id === itemId) setItem((prev) => (prev ? { ...prev, currentBid: nextAmount } : prev))
  }, () => loadGroups())

  function loadItem() {
    if (!canLoad) return
    api<{ item: Item }>(`/api/events/${session.eventId}/items/${itemId}`).then((d) => setItem(d.item ?? (d as unknown as Item)))
  }
  function loadGroups() {
    if (!canLoad) return
    api<Group[]>(`/api/events/${session.eventId}/items/${itemId}/groups`).then(setGroups).catch(() => {})
  }
  useEffect(() => {
    loadItem()
    loadGroups()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, session.eventId])

  async function placeBid() {
    setError('')
    const bid = Number(amount)
    if (!Number.isFinite(bid) || bid <= currentBid) {
      setError(`Bid must be greater than ${currency(currentBid)}`)
      return
    }
    await api(`/api/events/${session.eventId}/items/${itemId}/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: bid, bidderId: session.bidderId }),
    })
    setAmount('')
    loadItem()
  }
  if (!canLoad) return <Navigate to="/" replace />
  if (!item) return <div className="page-wrap">Loading item...</div>
  return (
    <div className="app-page">
      <TopHeader title={item.title} />
      <main className="item-detail">
        <img className="item-hero" src={item.image || ''} alt={item.title} />
        <section className="card section">
          <h2>{item.title}</h2>
          <p>{item.description}</p>
          <p className="big-bid">{currency(currentBid)}</p>
        </section>
        <section className="card section">
          <h3>Place Your Bid</h3>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Min: ${currency(minBid)}`} />
          <div className="row">
            <button className="ghost" onClick={() => setAmount((currentBid + 5).toFixed(2))}>+$5</button>
            <button className="ghost" onClick={() => setAmount((currentBid + 10).toFixed(2))}>+$10</button>
            <button className="ghost" onClick={() => setAmount((currentBid + 25).toFixed(2))}>+$25</button>
          </div>
          {error && <p className="error">{error}</p>}
          <button className="btn-primary" onClick={placeBid}>Place Bid</button>
        </section>
        <section className="card section">
          <h3>Group Bidding</h3>
          <p>{groups.length ? `${groups.length} active groups` : 'No groups yet. Start one to team up with other bidders!'}</p>
          <div className="group-list">
            {groups.map((g) => <Link key={g.id} to={`/group?groupId=${g.id}`}>{g.name ?? g.groupName} - {currency(g.totalAmount)}</Link>)}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}

function MyBidsPage({ session }: { session: Session }) {
  const [bids, setBids] = useState<Bid[]>([])
  useAuctionSocket(session, () => load())
  function load() {
    if (!session.eventId || !session.bidderId) return
    api<{ bids: Bid[] }>(`/api/events/${session.eventId}/bidders/${session.bidderId}/bids`).then((d) => setBids(d.bids ?? []))
  }
  useEffect(() => { load() }, [session.eventId, session.bidderId])
  if (!session.eventId || !session.bidderId) return <Navigate to="/" replace />
  return (
    <div className="app-page">
      <TopHeader title="My Bids" />
      <main className="content-list">
        {bids.length === 0 ? <p>No bids yet.</p> : bids.map((bid) => (
          <article className="card bid-card" key={`${bid.itemId}-${bid.amount}`}>
            <h4>{bid.itemTitle}</h4>
            <p>{currency(bid.amount)}</p>
            <span className="badge">{bid.status}</span>
          </article>
        ))}
      </main>
      <BottomNav />
    </div>
  )
}

function GroupsPage({ session }: { session: Session }) {
  const [groups, setGroups] = useState<Group[]>([])
  useAuctionSocket(session, undefined, () => load())
  function load() {
    if (!session.eventId || !session.bidderId) return
    api<{ groups: Group[] }>(`/api/events/${session.eventId}/bidders/${session.bidderId}/groups`).then((d) => setGroups(d.groups ?? []))
  }
  useEffect(() => { load() }, [session.eventId, session.bidderId])
  if (!session.eventId || !session.bidderId) return <Navigate to="/" replace />
  return (
    <div className="app-page">
      <TopHeader title="My Groups" />
      <main className="content-list">
        {groups.length === 0 ? <p>You are not in any groups yet.</p> : groups.map((group) => (
          <Link to={`/group?groupId=${group.id}`} key={group.id} className="card group-row">
            <h4>{group.groupName ?? group.name}</h4>
            <p>{currency(group.totalAmount)}</p>
          </Link>
        ))}
      </main>
      <BottomNav />
    </div>
  )
}

function GroupPage({ session }: { session: Session }) {
  const [params] = useSearchParams()
  const groupId = params.get('groupId')
  const [group, setGroup] = useState<Group | null>(null)
  const [contribution, setContribution] = useState('')
  const canLoad = Boolean(session.eventId && session.bidderId && groupId)
  useAuctionSocket(session, undefined, () => load())
  function load() {
    if (!canLoad) return
    api<{ group: Group }>(`/api/events/${session.eventId}/groups/${groupId}`).then((d) => setGroup(d.group ?? (d as unknown as Group)))
  }
  useEffect(() => { load() }, [session.eventId, groupId])
  if (!canLoad) return <Navigate to="/" replace />
  if (!group) return <div className="page-wrap">Loading group...</div>
  return (
    <div className="app-page">
      <TopHeader title="Group Details" />
      <main className="content-list">
        <section className="hero card">
          <h2>{group.name ?? group.groupName}</h2>
          <p>{currency(group.totalAmount)}</p>
          <code>{group.joinCode}</code>
        </section>
        <section className="card section">
          <h3>Members</h3>
          {(group.members ?? []).map((m) => <p key={m.bidderId}>{m.displayName} - {currency(m.contribution)}</p>)}
        </section>
        <section className="card section">
          <h3>Update Your Contribution</h3>
          <div className="row">
            <input type="number" value={contribution} onChange={(e) => setContribution(e.target.value)} />
            <button
              className="btn-primary"
              onClick={async () => {
                await api(`/api/events/${session.eventId}/groups/${groupId}/contribution`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ bidderId: session.bidderId, amount: Number(contribution) }),
                })
                setContribution('')
                load()
              }}
            >
              Update
            </button>
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}

function ProfilePage({ session, clearSession }: { session: Session; clearSession: () => void }) {
  const [bidder, setBidder] = useState<Bidder | null>(null)
  const [bidStats, setBidStats] = useState(0)
  const [winningStats, setWinningStats] = useState(0)
  const [groupStats, setGroupStats] = useState(0)
  useEffect(() => {
    if (!session.eventId || !session.bidderId) return
    Promise.all([
      api<Bidder[]>(`/api/events/${session.eventId}/bidders`),
      api<{ bids: Bid[] }>(`/api/events/${session.eventId}/bidders/${session.bidderId}/bids`),
      api<{ groups: Group[] }>(`/api/events/${session.eventId}/bidders/${session.bidderId}/groups`),
    ]).then(([bidders, bidsData, groupsData]) => {
      setBidder(bidders.find((b) => b.id === session.bidderId) ?? null)
      setBidStats(bidsData.bids?.length ?? 0)
      setWinningStats((bidsData.bids ?? []).filter((b) => b.status === 'winning').length)
      setGroupStats(groupsData.groups?.length ?? 0)
    })
  }, [session.eventId, session.bidderId])
  if (!session.eventId || !session.bidderId) return <Navigate to="/" replace />
  return (
    <div className="app-page">
      <TopHeader title="Profile" />
      <main className="content-list">
        <section className="hero card">
          <h2>{bidder?.displayName ?? session.displayName ?? 'Bidder'}</h2>
          <p>Bidder Code: {session.bidderCode ?? bidder?.bidderCode ?? '---'}</p>
        </section>
        <section className="stats">
          <div className="card"><strong>{bidStats}</strong><span>Bids</span></div>
          <div className="card"><strong>{winningStats}</strong><span>Winning</span></div>
          <div className="card"><strong>{groupStats}</strong><span>Groups</span></div>
        </section>
        <section className="card section">
          <p>{bidder?.firstName} {bidder?.lastName}</p>
          <p>{bidder?.email ?? '-'}</p>
          <p>{bidder?.phone ?? '-'}</p>
          <button className="danger" onClick={clearSession}>Leave Event</button>
        </section>
      </main>
      <BottomNav />
    </div>
  )
}

function App() {
  const [session, setSession] = useState<Session>(() => readSession())
  const updateSession = (next: Session) => {
    setSession(next)
    writeSession(next)
  }
  const clearSession = () => updateSession({})

  const ctx = useMemo(() => ({ session, updateSession }), [session])

  return (
    <Routes>
      <Route path="/" element={<JoinPage onSession={ctx.updateSession} />} />
      <Route path="/register" element={<RegisterPage session={ctx.session} onSession={ctx.updateSession} />} />
      <Route path="/items" element={<ItemsPage session={ctx.session} />} />
      <Route path="/item" element={<ItemPage session={ctx.session} />} />
      <Route path="/mybids" element={<MyBidsPage session={ctx.session} />} />
      <Route path="/groups" element={<GroupsPage session={ctx.session} />} />
      <Route path="/group" element={<GroupPage session={ctx.session} />} />
      <Route path="/profile" element={<ProfilePage session={ctx.session} clearSession={clearSession} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
