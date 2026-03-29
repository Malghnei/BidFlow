import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'

type Item = {
  id: string
  eventId: string
  lotNumber?: number
  title: string
  description?: string
  image?: string
  imageUrl?: string
  startingBid: number
  currentBid: number
  currentBidderId?: string | null
  currentBidType?: 'individual' | 'group'
  bidCount?: number
  status?: string
  topBidderName?: string | null
  activeGroups?: Group[]
}

type Bidder = {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  displayName: string
  anonymityMode: 'real_name' | 'nickname' | 'anonymous'
  bidderCode?: string
  paymentLinked?: boolean
}

type GroupMember = {
  bidderId: string
  displayName: string
  contribution: number
}

type Group = {
  id: string
  name?: string
  groupName?: string
  itemId: string
  itemTitle?: string
  joinCode: string
  totalAmount: number
  yourContribution?: number
  members?: GroupMember[]
  status?: string
}

type Bid = {
  id: string
  itemId: string
  itemTitle?: string
  amount: number
  status?: 'winning' | 'outbid'
  displayName?: string
  bidderName?: string
  timestamp?: string
}

type CheckoutItem = {
  itemId: string
  title: string
  finalBid: number
  winner: string
  winnerInfo?: {
    type: 'individual' | 'group'
    bidderId?: string
  }
}

const STORAGE = {
  eventId: 'eventId',
  eventName: 'eventName',
  bidderId: 'bidderId',
  bidderCode: 'bidderCode',
  displayName: 'displayName',
  passcode: 'bidflowPasscode',
}

const DEFAULT_PASSCODE = '123456'

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || payload.message || 'Request failed')
  return payload as T
}

function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="container">
      <header className="topbar">
        <h1>{title}</h1>
        <img src="/img/Islamic%20Relief%20Canada.png" alt="Islamic Relief Canada" />
      </header>
      {children}
    </main>
  )
}

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <Link to="/items">Items</Link>
      <Link to="/mybids">My Bids</Link>
      <Link to="/groups">Groups</Link>
      <Link to="/profile">Profile</Link>
    </nav>
  )
}

function JoinPage() {
  const navigate = useNavigate()
  const [passcode, setPasscode] = useState(localStorage.getItem(STORAGE.passcode) || DEFAULT_PASSCODE)
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const joined = await api<{ eventId: string; eventName: string }>('/api/auth/join', {
        method: 'POST',
        body: JSON.stringify({ passcode }),
      })
      localStorage.setItem(STORAGE.passcode, passcode)
      sessionStorage.setItem(STORAGE.eventId, joined.eventId)
      sessionStorage.setItem(STORAGE.eventName, joined.eventName)
      navigate('/register')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <AppShell title="BidFlow - Join Event">
      <section className="card">
        <form onSubmit={onSubmit}>
          <label>Event Passcode</label>
          <input value={passcode} onChange={(e) => setPasscode(e.target.value.replace(/\D/g, '').slice(0, 6))} />
          {error && <p className="error">{error}</p>}
          <button type="submit">Join Event</button>
        </form>
        <div className="quick-links">
          <Link to="/admin">Admin Dashboard</Link>
          <Link to="/display">Live Display</Link>
        </div>
      </section>
    </AppShell>
  )
}

function RegisterPage() {
  const navigate = useNavigate()
  const eventId = sessionStorage.getItem(STORAGE.eventId)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [mode, setMode] = useState<'real_name' | 'nickname' | 'anonymous'>('real_name')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')

  if (!eventId) return <Navigate to="/" replace />

  const displayName =
    mode === 'real_name' ? `${firstName || 'John'} ${lastName || 'Doe'}` : mode === 'nickname' ? nickname || 'Nickname' : 'Anonymous Bidder'

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const bidder = await api<Bidder>(`/api/events/${eventId}/bidders`, {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          displayName,
          anonymityMode: mode,
        }),
      })
      sessionStorage.setItem(STORAGE.bidderId, bidder.id)
      sessionStorage.setItem(STORAGE.bidderCode, bidder.bidderCode || '')
      sessionStorage.setItem(STORAGE.displayName, bidder.displayName)
      navigate('/items')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <AppShell title="Register">
      <section className="card">
        <form onSubmit={onSubmit}>
          <div className="grid2">
            <input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            <input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          <div className="modes">
            <label><input type="radio" checked={mode === 'real_name'} onChange={() => setMode('real_name')} /> Real Name</label>
            <label><input type="radio" checked={mode === 'nickname'} onChange={() => setMode('nickname')} /> Nickname</label>
            <label><input type="radio" checked={mode === 'anonymous'} onChange={() => setMode('anonymous')} /> Anonymous</label>
          </div>
          {mode === 'nickname' && <input placeholder="Your Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} required />}
          <p className="muted">Preview: {displayName}</p>
          {error && <p className="error">{error}</p>}
          <button type="submit">Complete Registration</button>
        </form>
      </section>
    </AppShell>
  )
}

function useAuctionSocket(eventId?: string | null, bidderId?: string | null) {
  useEffect(() => {
    if (!eventId) return
    const socket = io()
    socket.on('connect', () => socket.emit('join-auction', { eventId, bidderId: bidderId || undefined }))
    return () => {
      socket.disconnect()
    }
  }, [eventId, bidderId])
}

function ItemsPage() {
  const eventId = sessionStorage.getItem(STORAGE.eventId)
  const bidderId = sessionStorage.getItem(STORAGE.bidderId)
  const [items, setItems] = useState<Item[]>([])
  const navigate = useNavigate()
  useAuctionSocket(eventId, bidderId)

  useEffect(() => {
    if (!eventId) return
    api<Item[]>(`/api/events/${eventId}/items`).then(setItems).catch(console.error)
  }, [eventId])

  if (!eventId || !bidderId) return <Navigate to="/" replace />

  return (
    <AppShell title="Auction Items">
      <section className="grid-cards">
        {items.map((item) => (
          <button key={item.id} className="item-card" onClick={() => navigate(`/item/${item.id}`)}>
            <div className="item-media">
              {item.image || item.imageUrl ? <img src={item.image || item.imageUrl} alt={item.title} /> : <span>No Image</span>}
            </div>
            <div className="item-body">
              <h3>{item.title}</h3>
              <p>{money(item.currentBid || item.startingBid)}</p>
            </div>
          </button>
        ))}
      </section>
      <BottomNav />
    </AppShell>
  )
}

function ItemPage() {
  const eventId = sessionStorage.getItem(STORAGE.eventId)
  const bidderId = sessionStorage.getItem(STORAGE.bidderId)
  const { itemId = '' } = useParams()
  const [item, setItem] = useState<Item | null>(null)
  const [amount, setAmount] = useState('')
  const [groupName, setGroupName] = useState('')
  const [groupContribution, setGroupContribution] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinContribution, setJoinContribution] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!eventId || !itemId) return
    api<{ item: Item }>(`/api/events/${eventId}/items/${itemId}`).then((d) => setItem(d.item)).catch(console.error)
  }, [eventId, itemId])

  if (!eventId || !bidderId) return <Navigate to="/" replace />
  if (!item) return <AppShell title="Item">Loading...</AppShell>

  async function placeBid() {
    setError('')
    try {
      await api(`/api/events/${eventId}/items/${itemId}/bids`, {
        method: 'POST',
        body: JSON.stringify({ bidderId, amount: Number(amount) }),
      })
      const fresh = await api<{ item: Item }>(`/api/events/${eventId}/items/${itemId}`)
      setItem(fresh.item)
      setAmount('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function createGroup() {
    setError('')
    try {
      await api(`/api/events/${eventId}/items/${itemId}/groups`, {
        method: 'POST',
        body: JSON.stringify({ bidderId, name: groupName, contribution: Number(groupContribution) }),
      })
      const fresh = await api<{ item: Item }>(`/api/events/${eventId}/items/${itemId}`)
      setItem(fresh.item)
      setGroupName('')
      setGroupContribution('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function joinGroup() {
    setError('')
    try {
      await api(`/api/events/${eventId}/groups/join-by-code`, {
        method: 'POST',
        body: JSON.stringify({ bidderId, joinCode, contribution: Number(joinContribution) }),
      })
      const fresh = await api<{ item: Item }>(`/api/events/${eventId}/items/${itemId}`)
      setItem(fresh.item)
      setJoinCode('')
      setJoinContribution('')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <AppShell title={item.title}>
      <section className="card">
        <p className="big">{money(item.currentBid || item.startingBid)}</p>
        <p className="muted">{item.description}</p>
        <div className="row">
          <input placeholder="Bid amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button onClick={placeBid}>Place Bid</button>
        </div>
        <h3>Group Bidding</h3>
        <div className="row">
          <input placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          <input placeholder="Contribution" value={groupContribution} onChange={(e) => setGroupContribution(e.target.value)} />
          <button onClick={createGroup}>Create</button>
        </div>
        <div className="row">
          <input placeholder="Join code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
          <input placeholder="Contribution" value={joinContribution} onChange={(e) => setJoinContribution(e.target.value)} />
          <button onClick={joinGroup}>Join</button>
        </div>
        {!!error && <p className="error">{error}</p>}
      </section>
      <BottomNav />
    </AppShell>
  )
}

function GroupsPage() {
  const eventId = sessionStorage.getItem(STORAGE.eventId)
  const bidderId = sessionStorage.getItem(STORAGE.bidderId)
  const [groups, setGroups] = useState<Group[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!eventId || !bidderId) return
    api<{ groups: Group[] }>(`/api/events/${eventId}/bidders/${bidderId}/groups`).then((d) => setGroups(d.groups || [])).catch(console.error)
  }, [eventId, bidderId])

  if (!eventId || !bidderId) return <Navigate to="/" replace />

  return (
    <AppShell title="My Groups">
      <section className="grid-cards">
        {groups.map((g) => (
          <button key={g.id} className="item-card" onClick={() => navigate(`/group/${g.id}`)}>
            <div className="item-body">
              <h3>{g.name || g.groupName}</h3>
              <p>{money(g.totalAmount)}</p>
              <small>Your share: {money(g.yourContribution || 0)}</small>
            </div>
          </button>
        ))}
      </section>
      <BottomNav />
    </AppShell>
  )
}

function GroupPage() {
  const eventId = sessionStorage.getItem(STORAGE.eventId)
  const bidderId = sessionStorage.getItem(STORAGE.bidderId)
  const { groupId = '' } = useParams()
  const [group, setGroup] = useState<Group | null>(null)
  const [amount, setAmount] = useState('')

  useEffect(() => {
    if (!eventId || !groupId) return
    api<{ group: Group }>(`/api/events/${eventId}/groups/${groupId}`).then((d) => setGroup(d.group)).catch(console.error)
  }, [eventId, groupId])

  if (!eventId || !bidderId) return <Navigate to="/" replace />
  if (!group) return <AppShell title="Group">Loading...</AppShell>

  async function update() {
    await api(`/api/events/${eventId}/groups/${groupId}/contribution`, {
      method: 'PATCH',
      body: JSON.stringify({ bidderId, amount: Number(amount) }),
    })
    const fresh = await api<{ group: Group }>(`/api/events/${eventId}/groups/${groupId}`)
    setGroup(fresh.group)
    setAmount('')
  }

  async function leave() {
    await api(`/api/events/${eventId}/groups/${groupId}/leave`, {
      method: 'POST',
      body: JSON.stringify({ bidderId }),
    })
    window.history.back()
  }

  return (
    <AppShell title={group.name || group.groupName || 'Group'}>
      <section className="card">
        <p className="big">{money(group.totalAmount)}</p>
        <p className="muted">Join code: {group.joinCode}</p>
        <ul>
          {(group.members || []).map((m) => (
            <li key={m.bidderId}>{m.displayName}: {money(m.contribution)}</li>
          ))}
        </ul>
        <div className="row">
          <input placeholder="New contribution" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button onClick={update}>Update</button>
          <button className="danger" onClick={leave}>Leave</button>
        </div>
      </section>
      <BottomNav />
    </AppShell>
  )
}

function MyBidsPage() {
  const eventId = sessionStorage.getItem(STORAGE.eventId)
  const bidderId = sessionStorage.getItem(STORAGE.bidderId)
  const [bids, setBids] = useState<Bid[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    if (!eventId || !bidderId) return
    api<{ bids: Bid[] }>(`/api/events/${eventId}/bidders/${bidderId}/bids`).then((d) => setBids(d.bids || [])).catch(console.error)
  }, [eventId, bidderId])

  if (!eventId || !bidderId) return <Navigate to="/" replace />

  return (
    <AppShell title="My Bids">
      <section className="grid-cards">
        {bids.map((b) => (
          <button key={b.id} className="item-card" onClick={() => navigate(`/item/${b.itemId}`)}>
            <div className="item-body">
              <h3>{b.itemTitle || 'Item'}</h3>
              <p>{money(b.amount)}</p>
              <small>{b.status || 'active'}</small>
            </div>
          </button>
        ))}
      </section>
      <BottomNav />
    </AppShell>
  )
}

function ProfilePage() {
  const eventId = sessionStorage.getItem(STORAGE.eventId)
  const bidderId = sessionStorage.getItem(STORAGE.bidderId)
  const [bidder, setBidder] = useState<Bidder | null>(null)
  const [stats, setStats] = useState({ bids: 0, winning: 0, groups: 0 })

  useEffect(() => {
    if (!eventId || !bidderId) return
    Promise.all([
      api<Bidder[]>(`/api/events/${eventId}/bidders`),
      api<{ bids: Bid[] }>(`/api/events/${eventId}/bidders/${bidderId}/bids`),
      api<{ groups: Group[] }>(`/api/events/${eventId}/bidders/${bidderId}/groups`),
    ])
      .then(([all, bids, groups]) => {
        setBidder(all.find((b) => b.id === bidderId) || null)
        setStats({ bids: bids.bids.length, winning: bids.bids.filter((b) => b.status === 'winning').length, groups: groups.groups.length })
      })
      .catch(console.error)
  }, [eventId, bidderId])

  if (!eventId || !bidderId) return <Navigate to="/" replace />

  return (
    <AppShell title="Profile">
      <section className="card">
        <h2>{sessionStorage.getItem(STORAGE.displayName) || 'Bidder'}</h2>
        <p className="muted">Code: {sessionStorage.getItem(STORAGE.bidderCode) || '---'}</p>
        <p>Real Name: {bidder ? `${bidder.firstName} ${bidder.lastName}` : '-'}</p>
        <p>Email: {bidder?.email || '-'}</p>
        <p>Phone: {bidder?.phone || '-'}</p>
        <div className="stats">
          <div><strong>{stats.bids}</strong><span>Bids</span></div>
          <div><strong>{stats.winning}</strong><span>Winning</span></div>
          <div><strong>{stats.groups}</strong><span>Groups</span></div>
        </div>
        <button
          className="danger"
          onClick={() => {
            sessionStorage.clear()
            window.location.href = '/'
          }}
        >
          Leave Event
        </button>
      </section>
      <BottomNav />
    </AppShell>
  )
}

function AdminPage() {
  const [eventId, setEventId] = useState<string>('')
  const [items, setItems] = useState<Item[]>([])
  const [bidders, setBidders] = useState<Bidder[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [checkout, setCheckout] = useState<CheckoutItem[]>([])
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemBid, setNewItemBid] = useState('')

  async function boot() {
    const joined = await api<{ eventId: string }>('/api/auth/join', {
      method: 'POST',
      body: JSON.stringify({ passcode: localStorage.getItem(STORAGE.passcode) || DEFAULT_PASSCODE }),
    })
    setEventId(joined.eventId)
  }

  useEffect(() => {
    boot().catch(console.error)
  }, [])

  useEffect(() => {
    if (!eventId) return
    Promise.all([
      api<Item[]>(`/api/events/${eventId}/items`),
      api<Bidder[]>(`/api/events/${eventId}/bidders`),
      api<Group[]>(`/api/events/${eventId}/groups`),
      api<{ items: CheckoutItem[] }>(`/api/events/${eventId}/checkout/summary`),
    ])
      .then(([i, b, g, c]) => {
        setItems(i)
        setBidders(b)
        setGroups(g)
        setCheckout(c.items || [])
      })
      .catch(console.error)
  }, [eventId])

  async function addItem() {
    if (!eventId) return
    await api(`/api/events/${eventId}/items`, {
      method: 'POST',
      body: JSON.stringify({ title: newItemTitle, startingBid: Number(newItemBid) }),
    })
    setNewItemTitle('')
    setNewItemBid('')
    setItems(await api<Item[]>(`/api/events/${eventId}/items`))
  }

  async function markPaid(bidderId?: string) {
    if (!eventId || !bidderId) return
    await api(`/api/events/${eventId}/checkout/bidder/${bidderId}/pay`, { method: 'POST' })
  }

  return (
    <AppShell title="Admin Dashboard">
      <section className="card">
        <h3>Items</h3>
        <div className="row">
          <input placeholder="Title" value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} />
          <input placeholder="Starting bid" value={newItemBid} onChange={(e) => setNewItemBid(e.target.value)} />
          <button onClick={addItem}>Add Item</button>
        </div>
        {items.map((i) => (
          <div key={i.id} className="admin-row">
            <span>{i.title}</span>
            <span>{money(i.currentBid || i.startingBid)}</span>
            <button onClick={() => api(`/api/events/${eventId}/items/${i.id}/open`, { method: 'POST' })}>Open</button>
            <button onClick={() => api(`/api/events/${eventId}/items/${i.id}/close`, { method: 'POST' })}>Close</button>
          </div>
        ))}
      </section>
      <section className="card">
        <h3>Bidders ({bidders.length})</h3>
        {bidders.map((b) => (
          <div key={b.id} className="admin-row">
            <span>{b.firstName} {b.lastName}</span>
            <span>{b.displayName}</span>
          </div>
        ))}
      </section>
      <section className="card">
        <h3>Groups ({groups.length})</h3>
        {groups.map((g) => (
          <div key={g.id} className="admin-row">
            <span>{g.groupName || g.name}</span>
            <span>{money(g.totalAmount)}</span>
          </div>
        ))}
      </section>
      <section className="card">
        <h3>Checkout</h3>
        {checkout.map((c) => (
          <div key={c.itemId} className="admin-row">
            <span>{c.title}</span>
            <span>{c.winner}</span>
            <span>{money(c.finalBid)}</span>
            <button onClick={() => markPaid(c.winnerInfo?.bidderId)}>Mark Paid</button>
          </div>
        ))}
      </section>
    </AppShell>
  )
}

function DisplayPage() {
  const [eventId, setEventId] = useState('')
  const [eventName, setEventName] = useState('Event')
  const [item, setItem] = useState<Item | null>(null)
  const [total, setTotal] = useState(0)
  const [feed, setFeed] = useState<string[]>([])

  useEffect(() => {
    api<{ eventId: string; eventName: string }>('/api/auth/join', {
      method: 'POST',
      body: JSON.stringify({ passcode: localStorage.getItem(STORAGE.passcode) || DEFAULT_PASSCODE }),
    })
      .then((d) => {
        setEventId(d.eventId)
        setEventName(d.eventName)
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!eventId) return
    api<Item[]>(`/api/events/${eventId}/items`).then((items) => {
      const live = items.find((i) => i.status === 'live' || i.status === 'active') || items[0] || null
      setItem(live)
      setTotal(items.reduce((sum, i) => sum + (i.currentBid || i.startingBid || 0), 0))
    }).catch(console.error)

    const socket = io()
    socket.on('connect', () => socket.emit('join-auction', { eventId }))
    socket.on('bid:new', (data: { displayName: string; amount: number }) => {
      setFeed((prev) => [`${data.displayName}: ${money(data.amount)}`, ...prev].slice(0, 8))
    })
    return () => {
      socket.disconnect()
    }
  }, [eventId])

  return (
    <main className="display">
      <header>
        <h1>{eventName}</h1>
        <strong>Total Raised: {money(total)}</strong>
      </header>
      <section className="display-item">
        <h2>{item?.title || 'Awaiting first item'}</h2>
        <p>{money(item?.currentBid || item?.startingBid || 0)}</p>
        <small>{item?.topBidderName || 'No bids yet'}</small>
      </section>
      <section className="ticker">
        {feed.length ? feed.map((f, idx) => <span key={`${f}-${idx}`}>{f}</span>) : <span>Waiting for bids...</span>}
      </section>
    </main>
  )
}

function NotFound() {
  return (
    <AppShell title="Not Found">
      <section className="card">
        <p>Route not found.</p>
        <Link to="/">Back to home</Link>
      </section>
    </AppShell>
  )
}

function Root() {
  const bidderId = sessionStorage.getItem(STORAGE.bidderId)
  const eventId = sessionStorage.getItem(STORAGE.eventId)
  return bidderId && eventId ? <Navigate to="/items" replace /> : <JoinPage />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/items" element={<ItemsPage />} />
        <Route path="/item/:itemId" element={<ItemPage />} />
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/group/:groupId" element={<GroupPage />} />
        <Route path="/mybids" element={<MyBidsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}
