require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Initialize Express and Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    res.on('finish', () => {
      if (res.statusCode < 500) {
        scheduleStatePersist();
      }
    });
  }
  next();
});

// Basic deploy health probe endpoint.
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mongoEnabled,
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// ============================================================================
// IN-MEMORY DATA STORE
// ============================================================================

const events = new Map();
const bidders = new Map();
const items = new Map();
const bids = [];
const groups = new Map();

// Track anonymous bidder numbers per event
const anonymousCounters = new Map();

// ============================================================================
// MONGODB SNAPSHOT PERSISTENCE (Demo-friendly persistence layer)
// ============================================================================
const MONGODB_URI = process.env.MONGODB_URI || '';
const hasMongoPlaceholder = /<[^>]+>/.test(MONGODB_URI);
let mongoEnabled = Boolean(MONGODB_URI) && !hasMongoPlaceholder;
let stateRestoredFromMongo = false;
let persistTimer = null;
let persistInFlight = false;
let pendingPersist = false;

const stateSnapshotSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now }
  },
  { collection: 'state_snapshots' }
);

const StateSnapshot = mongoose.model('StateSnapshot', stateSnapshotSchema);

function mapToObject(map) {
  return Object.fromEntries(map);
}

function objectToMap(obj) {
  return new Map(Object.entries(obj || {}));
}

function getSerializableState() {
  return {
    events: mapToObject(events),
    bidders: mapToObject(bidders),
    items: mapToObject(items),
    groups: mapToObject(groups),
    anonymousCounters: mapToObject(anonymousCounters),
    bids
  };
}

function restoreSerializableState(payload) {
  if (!payload || typeof payload !== 'object') return;

  events.clear();
  bidders.clear();
  items.clear();
  groups.clear();
  anonymousCounters.clear();
  bids.length = 0;

  for (const [k, v] of objectToMap(payload.events)) events.set(k, v);
  for (const [k, v] of objectToMap(payload.bidders)) bidders.set(k, v);
  for (const [k, v] of objectToMap(payload.items)) items.set(k, v);
  for (const [k, v] of objectToMap(payload.groups)) groups.set(k, v);
  for (const [k, v] of objectToMap(payload.anonymousCounters)) anonymousCounters.set(k, v);
  if (Array.isArray(payload.bids)) bids.push(...payload.bids);
}

async function initializePersistenceAndRestore() {
  if (!mongoEnabled) {
    if (!MONGODB_URI) {
      console.warn('MongoDB disabled: MONGODB_URI not set, using in-memory mode.');
    } else if (hasMongoPlaceholder) {
      console.warn('MongoDB disabled: MONGODB_URI still contains placeholders like <cluster>, using in-memory mode.');
    }
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000
    });
    console.log('Connected to MongoDB.');

    const snapshot = await StateSnapshot.findById('app_state').lean();
    if (snapshot?.payload) {
      restoreSerializableState(snapshot.payload);
      stateRestoredFromMongo = true;
      console.log('Application state restored from MongoDB snapshot.');
    } else {
      console.log('No prior snapshot found; starting with seeded defaults.');
    }
  } catch (error) {
    console.error('MongoDB init failed, falling back to in-memory mode:', error.message);
    mongoEnabled = false;
  }
}

async function persistStateNow(reason = 'manual') {
  if (!mongoEnabled) return;
  if (persistInFlight) {
    pendingPersist = true;
    return;
  }

  persistInFlight = true;
  try {
    await StateSnapshot.findByIdAndUpdate(
      'app_state',
      {
        _id: 'app_state',
        payload: getSerializableState(),
        updatedAt: new Date()
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error(`Failed to persist state (${reason}):`, error.message);
  } finally {
    persistInFlight = false;
    if (pendingPersist) {
      pendingPersist = false;
      await persistStateNow('queued');
    }
  }
}

function scheduleStatePersist() {
  if (!mongoEnabled) return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistStateNow('scheduled').catch((error) => {
      console.error('Scheduled persist failed:', error.message);
    });
  }, 250);
}

// ============================================================================
// DATABASE SEEDER (Demo Data)
// ============================================================================
const DEMO_EVENT_ID = "evt_000000";
events.set(DEMO_EVENT_ID, {
  id: DEMO_EVENT_ID,
  name: "MSA Spring Charity Auction",
  description: "Annual fundraiser auction. Bid on premium items to support our cause.",
  passcode: "123456",
  status: "active",
  currency: "USD",
  timezone: "UTC",
  allowAnonymousBidding: true,
  allowGroupBidding: true,
  theme: "islamic-elegant"
});

const demoItems = [
  {
    id: "itm_101",
    eventId: DEMO_EVENT_ID,
    title: "Hand-crafted Moroccan Lantern",
    description: "A beautiful, intricate lantern that casts geometric shadows. Perfect for a cozy ambiance.",
    startingBid: 80,
    currentBid: 120,
    minIncrement: 5,
    status: "active",
    type: "physical",
    winnerId: null,
    winningBidId: null,
    imageIndex: 0
  },
  {
    id: "itm_102",
    eventId: DEMO_EVENT_ID,
    title: "Calligraphy Masterclass (2 hours)",
    description: "Learn the art of traditional Arabic calligraphy from a certified master.",
    startingBid: 150,
    currentBid: 150,
    minIncrement: 10,
    status: "active",
    type: "experience",
    winnerId: null,
    winningBidId: null,
    imageIndex: 1
  },
  {
    id: "itm_103",
    eventId: DEMO_EVENT_ID,
    title: "Premium Oudh Selection Set",
    description: "An exclusive collection of pure agarwood oils imported straight from the UAE.",
    startingBid: 300,
    currentBid: 350,
    minIncrement: 20,
    status: "active",
    type: "physical",
    winnerId: null,
    winningBidId: null,
    imageIndex: 2
  }
];

demoItems.forEach(itm => items.set(itm.id, itm));

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get display name based on bidder's anonymity mode
 */
function getDisplayName(bidder) {
  if (bidder.anonymityMode === 'real_name') {
    return `${bidder.firstName} ${bidder.lastName}`;
  } else if (bidder.anonymityMode === 'nickname') {
    return bidder.displayName;
  } else if (bidder.anonymityMode === 'anonymous') {
    if (!anonymousCounters.has(bidder.eventId)) {
      anonymousCounters.set(bidder.eventId, 0);
    }
    let counter = anonymousCounters.get(bidder.eventId);
    if (!bidder.anonymousNumber) {
      counter++;
      bidder.anonymousNumber = counter;
      anonymousCounters.set(bidder.eventId, counter);
    }
    return `Anonymous #${bidder.anonymousNumber}`;
  }
  return bidder.displayName;
}

/**
 * Generate a random 6-character bidder code
 */
function generateBidderCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Generate a random 4-digit join code for groups
 */
function generateJoinCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Generate a random 6-digit passcode for events
 */
function generatePasscode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get next bidder number for an event
 */
function getNextBidderNumber(eventId) {
  const eventBidders = Array.from(bidders.values()).filter(b => b.eventId === eventId);
  if (eventBidders.length === 0) return 1;
  const maxNumber = Math.max(...eventBidders.map(b => b.bidderNumber));
  return maxNumber + 1;
}

/**
 * Validate bid amount
 */
function isValidBidAmount(currentBid, newAmount) {
  return typeof newAmount === 'number' && !isNaN(newAmount) && newAmount > currentBid;
}

// ============================================================================
// SEED DEMO DATA
// ============================================================================

function seedDemoData() {
  const eventId = uuidv4();
  const passcode = '123456';

  // Create demo event
  events.set(eventId, {
    id: eventId,
    name: 'IRC Spring Gala 2026',
    date: new Date('2026-04-15'),
    venue: 'Western University',
    status: 'active',
    passcode: passcode
  });

  // Create demo items
  const demoItems = [
    {
      title: 'Weekend Getaway Package',
      description: 'Luxury weekend package with accommodation and meals',
      startingBid: 200,
      imageUrl: 'https://picsum.photos/seed/item1/400/300'
    },
    {
      title: 'Luxury Watch',
      description: 'Premium timepiece for the sophisticated collector',
      startingBid: 300,
      imageUrl: 'https://picsum.photos/seed/item2/400/300'
    },
    {
      title: 'Fine Dining Experience',
      description: 'Exclusive multi-course dinner at top-rated restaurant',
      startingBid: 100,
      imageUrl: 'https://picsum.photos/seed/item3/400/300'
    },
    {
      title: 'Signed Jersey',
      description: 'Authentic sports memorabilia signed by celebrity athlete',
      startingBid: 150,
      imageUrl: 'https://picsum.photos/seed/item4/400/300'
    },
    {
      title: 'Tech Bundle',
      description: 'Latest gadgets and accessories package',
      startingBid: 250,
      imageUrl: 'https://picsum.photos/seed/item5/400/300'
    },
    {
      title: 'Art Collection',
      description: 'Limited edition art prints from renowned artist',
      startingBid: 500,
      imageUrl: 'https://picsum.photos/seed/item6/400/300'
    }
  ];

  demoItems.forEach((itemData, index) => {
    const itemId = uuidv4();
    items.set(itemId, {
      id: itemId,
      eventId: eventId,
      lotNumber: index + 1,
      title: itemData.title,
      description: itemData.description,
      imageUrl: itemData.imageUrl,
      startingBid: itemData.startingBid,
      currentBid: itemData.startingBid,
      currentBidderId: null,
      currentBidType: 'individual',
      bidCount: 0,
      activeGroups: [],
      image: itemData.imageUrl,
      status: 'upcoming'
    });
  });

  console.log('Demo data seeded: 1 event with 6 items');
}

// ============================================================================
// API ROUTES - AUTH
// ============================================================================

/**
 * POST /api/auth/join
 * Join an event with passcode
 */
app.post('/api/auth/join', (req, res) => {
  const { passcode } = req.body;

  if (!passcode) {
    return res.status(400).json({ error: 'Passcode required' });
  }

  const event = Array.from(events.values()).find(e => e.passcode === passcode);

  if (!event) {
    return res.status(401).json({ error: 'Invalid passcode' });
  }

  res.json({
    eventId: event.id,
    eventName: event.name
  });
});

// ============================================================================
// API ROUTES - EVENT INFO
// ============================================================================

/**
 * GET /api/events/:eventId
 * Get event details
 */
app.get('/api/events/:eventId', (req, res) => {
  const { eventId } = req.params;
  const event = events.get(eventId);
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  // Strip passcode from response
  const { passcode, ...safe } = event;
  res.json(safe);
});

// API ROUTES - BIDDERS
// ============================================================================

/**
 * POST /api/events/:eventId/bidders
 * Register a new bidder
 */
app.post('/api/events/:eventId/bidders', (req, res) => {
  const { eventId } = req.params;
  const { firstName, lastName, displayName, anonymityMode, email, phone } = req.body;

  if (!events.has(eventId)) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (!firstName || !lastName || !anonymityMode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const bidderId = uuidv4();
  const bidderNumber = getNextBidderNumber(eventId);
  const bidderCode = generateBidderCode();

  const bidder = {
    id: bidderId,
    eventId,
    bidderNumber,
    bidderCode,
    firstName,
    lastName,
    displayName,
    anonymityMode,
    email: email || null,
    phone: phone || null,
    paymentLinked: false,
    checkedIn: false
  };

  bidders.set(bidderId, bidder);
  res.status(201).json(bidder);
});

/**
 * GET /api/events/:eventId/bidders
 * Get all bidders (admin view with real names)
 */
app.get('/api/events/:eventId/bidders', (req, res) => {
  const { eventId } = req.params;

  if (!events.has(eventId)) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const eventBidders = Array.from(bidders.values()).filter(b => b.eventId === eventId);
  res.json(eventBidders);
});

/**
 * GET /api/events/:eventId/bidders/:id
 * Get specific bidder
 */
app.get('/api/events/:eventId/bidders/:id', (req, res) => {
  const { eventId, id } = req.params;

  const bidder = bidders.get(id);
  if (!bidder || bidder.eventId !== eventId) {
    return res.status(404).json({ error: 'Bidder not found' });
  }

  res.json(bidder);
});

/**
 * PATCH /api/events/:eventId/bidders/:id
 * Update bidder displayName and anonymityMode
 */
app.patch('/api/events/:eventId/bidders/:id', (req, res) => {
  const { eventId, id } = req.params;
  const { displayName, anonymityMode } = req.body;

  const bidder = bidders.get(id);
  if (!bidder || bidder.eventId !== eventId) {
    return res.status(404).json({ error: 'Bidder not found' });
  }

  if (displayName) bidder.displayName = displayName;
  if (anonymityMode) bidder.anonymityMode = anonymityMode;

  res.json(bidder);
});

// ============================================================================
// API ROUTES - ITEMS
// ============================================================================

/**
 * GET /api/events/:eventId/items
 * Get all items for an event with current bid info
 */
app.get('/api/events/:eventId/items', (req, res) => {
  const { eventId } = req.params;

  if (!events.has(eventId)) {
    return res.status(404).json({ error: 'Event not found' });
  }

  let eventItems = Array.from(items.values())
    .filter(item => item.eventId === eventId)
    .map(item => {
      const itemWithGroups = { ...item };
      itemWithGroups.activeGroupsCount = item.activeGroups ? item.activeGroups.length : 0;
      itemWithGroups.image = item.imageUrl || item.image || '';
      return itemWithGroups;
    })
    .sort((a, b) => (a.lotNumber || 0) - (b.lotNumber || 0));

  if (eventItems.length === 0) {
    const defaultData = [
      { id: uuidv4(), eventId, lotNumber: 1, title: 'Hand-crafted Moroccan Lantern', currentBid: 120, startingBid: 80, activeGroups: [] },
      { id: uuidv4(), eventId, lotNumber: 2, title: 'Calligraphy Masterclass (2 hours)', currentBid: 150, startingBid: 100, activeGroups: [] },
      { id: uuidv4(), eventId, lotNumber: 3, title: 'Premium Oudh Selection Set', currentBid: 350, startingBid: 250, activeGroups: [] }
    ];
    defaultData.forEach(itm => items.set(itm.id, itm));
    eventItems = defaultData;
  }

  res.json(eventItems);
});

/**
 * GET /api/events/:eventId/items/:id
 * Get specific item with bid history and active groups
 */
app.get('/api/events/:eventId/items/:id', (req, res) => {
  const { eventId, id } = req.params;

  const item = items.get(id);
  if (!item || item.eventId !== eventId) {
    return res.status(404).json({ error: 'Item not found' });
  }

  // Get bid history for this item
  const bidHistory = bids
    .filter(bid => bid.itemId === id && bid.eventId === eventId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Get active groups for this item
  const itemGroups = Array.from(groups.values())
    .filter(g => g.eventId === eventId && g.itemId === id && g.status === 'active')
    .map(g => ({
      id: g.id,
      groupName: g.groupName,
      totalAmount: g.totalAmount,
      memberCount: g.members.length
    }));

  // Get top bidder name for display
  let topBidderName = null;
  if (item.currentBidderId) {
    if (item.currentBidType === 'group') {
      const group = groups.get(item.currentBidderId);
      topBidderName = group ? group.groupName : null;
    } else {
      const bidder = bidders.get(item.currentBidderId);
      topBidderName = bidder ? getDisplayName(bidder) : null;
    }
  }

  res.json({
    item: {
      ...item,
      image: item.imageUrl || item.image || '',
      topBidderName,
      bids: bidHistory.map(b => ({ bidderName: b.displayName, amount: b.amount, timestamp: b.timestamp })),
      bidHistory,
      activeGroups: itemGroups
    }
  });
});

/**
 * POST /api/events/:eventId/items
 * Create a new item (admin)
 */
app.post('/api/events/:eventId/items', (req, res) => {
  const { eventId } = req.params;
  const { lotNumber, title, description, imageUrl, image, startingBid } = req.body;

  if (!events.has(eventId)) {
    return res.status(404).json({ error: 'Event not found' });
  }

  if (!title || startingBid === undefined || startingBid === null) {
    return res.status(400).json({ error: 'Missing required fields (title and startingBid)' });
  }

  // Auto-generate lot number if not provided
  const eventItems = Array.from(items.values()).filter(i => i.eventId === eventId);
  const resolvedLotNumber = lotNumber || (eventItems.length + 1);

  const itemId = uuidv4();
  const item = {
    id: itemId,
    eventId,
    lotNumber: resolvedLotNumber,
    title,
    description: description || '',
    imageUrl: imageUrl || image || '',
    startingBid,
    currentBid: startingBid,
    currentBidderId: null,
    currentBidType: 'individual',
    bidCount: 0,
    activeGroups: [],
    status: 'upcoming'
  };

  items.set(itemId, item);
  res.status(201).json(item);
});

/**
 * POST /api/events/:eventId/items/:id/open
 * Open bidding on an item
 */
app.post('/api/events/:eventId/items/:id/open', (req, res) => {
  const { eventId, id } = req.params;

  const item = items.get(id);
  if (!item || item.eventId !== eventId) {
    return res.status(404).json({ error: 'Item not found' });
  }

  item.status = 'live';

  // Broadcast to all clients in this event
  io.to(`event:${eventId}`).emit('item:opened', {
    itemId: id,
    title: item.title
  });

  res.json(item);
});

/**
 * POST /api/events/:eventId/items/:id/close
 * Close bidding on an item and determine winner
 */
app.post('/api/events/:eventId/items/:id/close', (req, res) => {
  const { eventId, id } = req.params;

  const item = items.get(id);
  if (!item || item.eventId !== eventId) {
    return res.status(404).json({ error: 'Item not found' });
  }

  item.status = 'sold';

  // Determine winner
  let winner = null;
  let winnerType = null;

  if (item.currentBidderId) {
    if (item.currentBidType === 'group') {
      const group = groups.get(item.currentBidderId);
      winner = group ? group.groupName : 'Unknown Group';
      winnerType = 'group';
    } else {
      const bidder = bidders.get(item.currentBidderId);
      winner = bidder ? getDisplayName(bidder) : 'Unknown Bidder';
      winnerType = 'individual';
    }
  }

  // Broadcast to all clients in this event
  io.to(`event:${eventId}`).emit('item:closed', {
    itemId: id,
    winner,
    finalAmount: item.currentBid,
    winnerType
  });

  res.json({
    ...item,
    winner,
    winnerType
  });
});

// ============================================================================
// API ROUTES - BIDS
// ============================================================================

/**
 * POST /api/events/:eventId/items/:itemId/bids
 * Place a new bid
 */
app.post('/api/events/:eventId/items/:itemId/bids', (req, res) => {
  const { eventId, itemId } = req.params;
  const { bidderId, amount } = req.body;

  if (!events.has(eventId)) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const item = items.get(itemId);
  if (!item || item.eventId !== eventId) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const bidder = bidders.get(bidderId);
  if (!bidder || bidder.eventId !== eventId) {
    return res.status(404).json({ error: 'Bidder not found' });
  }

  if (!isValidBidAmount(item.currentBid, amount)) {
    return res.status(400).json({
      error: `Bid must exceed current bid of $${item.currentBid} by at least $5`
    });
  }

  const bidId = uuidv4();
  const displayName = getDisplayName(bidder);

  // Store previous bidder to notify them
  const previousBidderId = item.currentBidderId;

  // Create bid record
  const bid = {
    id: bidId,
    eventId,
    itemId,
    bidderId,
    groupId: null,
    amount,
    type: 'individual',
    displayName,
    timestamp: new Date().toISOString(),
    status: 'active'
  };

  bids.push(bid);

  // Update item
  item.currentBid = amount;
  item.currentBidderId = bidderId;
  item.currentBidType = 'individual';
  item.bidCount += 1;

  // Notify all users in event room
  io.to(`event:${eventId}`).emit('bid:new', {
    itemId,
    amount,
    displayName,
    type: 'individual',
    bidderId,
    groupId: null
  });

  // Notify previous bidder they've been outbid
  if (previousBidderId && previousBidderId !== bidderId) {
    io.to(`user:${previousBidderId}`).emit('bid:outbid', {
      itemId,
      newAmount: amount
    });
  }

  res.status(201).json(bid);
});

// ============================================================================
// API ROUTES - GROUPS
// ============================================================================

/**
 * POST /api/events/:eventId/items/:itemId/groups
 * Create a new group bid
 */
app.post('/api/events/:eventId/items/:itemId/groups', (req, res) => {
  const { eventId, itemId } = req.params;
  const { bidderId, groupName, name, contribution } = req.body;
  const resolvedGroupName = groupName || name;

  if (!events.has(eventId)) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const item = items.get(itemId);
  if (!item || item.eventId !== eventId) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const bidder = bidders.get(bidderId);
  if (!bidder || bidder.eventId !== eventId) {
    return res.status(404).json({ error: 'Bidder not found' });
  }

  if (!resolvedGroupName || contribution === undefined || contribution === null || typeof contribution !== 'number' || contribution <= 0) {
    return res.status(400).json({ error: 'Invalid group name or contribution' });
  }

  const groupId = uuidv4();
  const joinCode = generateJoinCode();
  const displayName = getDisplayName(bidder);

  // Create group
  const group = {
    id: groupId,
    eventId,
    itemId,
    groupName: resolvedGroupName,
    joinCode,
    leaderId: bidderId,
    totalAmount: contribution,
    members: [
      {
        bidderId,
        displayName,
        contribution,
        joinedAt: new Date().toISOString()
      }
    ],
    mergedFrom: [],
    status: 'active'
  };

  groups.set(groupId, group);

  // Add group to item's activeGroups
  item.activeGroups.push(groupId);

  // Create initial group bid if it exceeds current bid
  if (isValidBidAmount(item.currentBid, contribution)) {
    const bidId = uuidv4();
    const groupBid = {
      id: bidId,
      eventId,
      itemId,
      bidderId: null,
      groupId,
      amount: contribution,
      type: 'group',
      displayName: groupName,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    bids.push(groupBid);

    // Update item
    const previousBidderId = item.currentBidderId;
    item.currentBid = contribution;
    item.currentBidderId = groupId;
    item.currentBidType = 'group';
    item.bidCount += 1;

    // Notify all users in event room
    io.to(`event:${eventId}`).emit('bid:new', {
      itemId,
      amount: contribution,
      displayName: groupName,
      type: 'group',
      bidderId: null,
      groupId
    });

    // Notify previous bidder
    if (previousBidderId && previousBidderId !== groupId) {
      if (previousBidderId.length === 36) { // UUID length
        io.to(`user:${previousBidderId}`).emit('bid:outbid', {
          itemId,
          newAmount: contribution
        });
      }
    }
  }

  // Emit group creation event
  io.to(`item:${itemId}`).emit('group:updated', {
    groupId,
    itemId,
    totalAmount: group.totalAmount,
    memberCount: group.members.length,
    groupName
  });

  res.status(201).json({
    ...group,
    joinCode // Return joinCode to group creator
  });
});

/**
 * POST /api/events/:eventId/groups/:groupId/join
 * Add a bidder to an existing group
 */
app.post('/api/events/:eventId/groups/:groupId/join', (req, res) => {
  const { eventId, groupId } = req.params;
  const { bidderId, contribution } = req.body;

  const group = groups.get(groupId);
  if (!group || group.eventId !== eventId) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const bidder = bidders.get(bidderId);
  if (!bidder || bidder.eventId !== eventId) {
    return res.status(404).json({ error: 'Bidder not found' });
  }

  if (!contribution || typeof contribution !== 'number' || contribution <= 0) {
    return res.status(400).json({ error: 'Invalid contribution amount' });
  }

  // Check if bidder is already in group
  const alreadyMember = group.members.some(m => m.bidderId === bidderId);
  if (alreadyMember) {
    return res.status(400).json({ error: 'Bidder already in this group' });
  }

  const displayName = getDisplayName(bidder);

  // Add member to group
  group.members.push({
    bidderId,
    displayName,
    contribution,
    joinedAt: new Date().toISOString()
  });

  group.totalAmount += contribution;

  const item = items.get(group.itemId);

  // Create new bid if total increased past current bid
  if (isValidBidAmount(item.currentBid, group.totalAmount)) {
    const bidId = uuidv4();
    const groupBid = {
      id: bidId,
      eventId,
      itemId: group.itemId,
      bidderId: null,
      groupId,
      amount: group.totalAmount,
      type: 'group',
      displayName: group.groupName,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    bids.push(groupBid);

    // Update item
    const previousBidderId = item.currentBidderId;
    item.currentBid = group.totalAmount;
    item.currentBidderId = groupId;
    item.currentBidType = 'group';
    item.bidCount += 1;

    // Notify all users
    io.to(`event:${eventId}`).emit('bid:new', {
      itemId: group.itemId,
      amount: group.totalAmount,
      displayName: group.groupName,
      type: 'group',
      bidderId: null,
      groupId
    });

    // Notify previous bidder
    if (previousBidderId && previousBidderId !== groupId) {
      if (previousBidderId.length === 36) {
        io.to(`user:${previousBidderId}`).emit('bid:outbid', {
          itemId: group.itemId,
          newAmount: group.totalAmount
        });
      }
    }
  }

  // Emit group update
  io.to(`item:${group.itemId}`).emit('group:updated', {
    groupId,
    itemId: group.itemId,
    totalAmount: group.totalAmount,
    memberCount: group.members.length,
    groupName: group.groupName
  });

  io.to(`group:${groupId}`).emit('group:joined', {
    groupId,
    displayName,
    memberCount: group.members.length
  });

  res.status(201).json(group);
});

/**
 * PATCH /api/events/:eventId/groups/:groupId/members/:bidderId
 * Update member's contribution
 */
app.patch('/api/events/:eventId/groups/:groupId/members/:bidderId', (req, res) => {
  const { eventId, groupId, bidderId } = req.params;
  const { contribution } = req.body;

  const group = groups.get(groupId);
  if (!group || group.eventId !== eventId) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const member = group.members.find(m => m.bidderId === bidderId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found in group' });
  }

  if (contribution <= 0) {
    return res.status(400).json({ error: 'Invalid contribution amount' });
  }

  const oldContribution = member.contribution;
  member.contribution = contribution;
  group.totalAmount = group.totalAmount - oldContribution + contribution;

  const item = items.get(group.itemId);

  // Create new bid if total increased past current bid
  if (contribution > oldContribution && isValidBidAmount(item.currentBid, group.totalAmount)) {
    const bidId = uuidv4();
    const groupBid = {
      id: bidId,
      eventId,
      itemId: group.itemId,
      bidderId: null,
      groupId,
      amount: group.totalAmount,
      type: 'group',
      displayName: group.groupName,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    bids.push(groupBid);

    // Update item
    const previousBidderId = item.currentBidderId;
    item.currentBid = group.totalAmount;
    item.currentBidderId = groupId;
    item.currentBidType = 'group';
    item.bidCount += 1;

    // Notify all users
    io.to(`event:${eventId}`).emit('bid:new', {
      itemId: group.itemId,
      amount: group.totalAmount,
      displayName: group.groupName,
      type: 'group',
      bidderId: null,
      groupId
    });

    // Notify previous bidder
    if (previousBidderId && previousBidderId !== groupId) {
      if (previousBidderId.length === 36) {
        io.to(`user:${previousBidderId}`).emit('bid:outbid', {
          itemId: group.itemId,
          newAmount: group.totalAmount
        });
      }
    }
  }

  // Emit group update
  io.to(`item:${group.itemId}`).emit('group:updated', {
    groupId,
    itemId: group.itemId,
    totalAmount: group.totalAmount,
    memberCount: group.members.length,
    groupName: group.groupName
  });

  res.json(group);
});

/**
 * POST /api/events/:eventId/groups/:groupId/merge
 * Merge one group into another
 */
app.post('/api/events/:eventId/groups/:groupId/merge', (req, res) => {
  const { eventId, groupId } = req.params;
  const { sourceGroupId } = req.body;

  const targetGroup = groups.get(groupId);
  if (!targetGroup || targetGroup.eventId !== eventId) {
    return res.status(404).json({ error: 'Target group not found' });
  }

  const sourceGroup = groups.get(sourceGroupId);
  if (!sourceGroup || sourceGroup.eventId !== eventId) {
    return res.status(404).json({ error: 'Source group not found' });
  }

  if (targetGroup.itemId !== sourceGroup.itemId) {
    return res.status(400).json({ error: 'Groups must be on the same item' });
  }

  // Move all members from source to target
  const oldTargetTotal = targetGroup.totalAmount;
  sourceGroup.members.forEach(member => {
    const alreadyExists = targetGroup.members.find(m => m.bidderId === member.bidderId);
    if (!alreadyExists) {
      targetGroup.members.push(member);
      targetGroup.totalAmount += member.contribution;
    }
  });

  // Mark source as merged
  sourceGroup.status = 'merged';
  targetGroup.mergedFrom.push(sourceGroupId);

  // Remove source from item's activeGroups
  const item = items.get(targetGroup.itemId);
  item.activeGroups = item.activeGroups.filter(gid => gid !== sourceGroupId);

  // Create new bid if target total increased
  if (isValidBidAmount(item.currentBid, targetGroup.totalAmount)) {
    const bidId = uuidv4();
    const groupBid = {
      id: bidId,
      eventId,
      itemId: targetGroup.itemId,
      bidderId: null,
      groupId: groupId,
      amount: targetGroup.totalAmount,
      type: 'group',
      displayName: targetGroup.groupName,
      timestamp: new Date().toISOString(),
      status: 'active'
    };

    bids.push(groupBid);

    // Update item
    const previousBidderId = item.currentBidderId;
    item.currentBid = targetGroup.totalAmount;
    item.currentBidderId = groupId;
    item.currentBidType = 'group';
    item.bidCount += 1;

    // Notify all users
    io.to(`event:${eventId}`).emit('bid:new', {
      itemId: targetGroup.itemId,
      amount: targetGroup.totalAmount,
      displayName: targetGroup.groupName,
      type: 'group',
      bidderId: null,
      groupId
    });
  }

  // Emit group updates
  io.to(`item:${targetGroup.itemId}`).emit('group:updated', {
    groupId,
    itemId: targetGroup.itemId,
    totalAmount: targetGroup.totalAmount,
    memberCount: targetGroup.members.length,
    groupName: targetGroup.groupName
  });

  res.json(targetGroup);
});

/**
 * GET /api/events/:eventId/groups/:groupId
 * Get group details
 */
app.get('/api/events/:eventId/groups/:groupId', (req, res) => {
  const { eventId, groupId } = req.params;

  const group = groups.get(groupId);
  if (!group || group.eventId !== eventId) {
    return res.status(404).json({ error: 'Group not found' });
  }

  res.json({ group: { ...group, name: group.groupName } });
});

/**
 * GET /api/events/:eventId/items/:itemId/groups
 * Get all active groups on an item
 */
app.get('/api/events/:eventId/items/:itemId/groups', (req, res) => {
  const { eventId, itemId } = req.params;

  const item = items.get(itemId);
  if (!item || item.eventId !== eventId) {
    return res.status(404).json({ error: 'Item not found' });
  }

  const itemGroups = Array.from(groups.values())
    .filter(g => g.eventId === eventId && g.itemId === itemId && g.status === 'active')
    .map(g => ({
      id: g.id,
      name: g.groupName,
      groupName: g.groupName,
      totalAmount: g.totalAmount,
      memberCount: g.members.length,
      leaderId: g.leaderId,
      members: g.members
    }));

  res.json({ groups: itemGroups });
});

/**
 * DELETE /api/events/:eventId/groups/:groupId/members/:bidderId
 * Remove member from group
 */
app.delete('/api/events/:eventId/groups/:groupId/members/:bidderId', (req, res) => {
  const { eventId, groupId, bidderId } = req.params;

  const group = groups.get(groupId);
  if (!group || group.eventId !== eventId) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const memberIndex = group.members.findIndex(m => m.bidderId === bidderId);
  if (memberIndex === -1) {
    return res.status(404).json({ error: 'Member not found in group' });
  }

  // Cannot remove if only member is the leader and it's their own group
  if (group.members.length === 1 && group.leaderId === bidderId) {
    return res.status(400).json({ error: 'Cannot remove the only member (group leader)' });
  }

  const removedMember = group.members[memberIndex];
  group.totalAmount -= removedMember.contribution;
  group.members.splice(memberIndex, 1);

  // If no members left, mark as inactive
  if (group.members.length === 0) {
    group.status = 'lost';
    const item = items.get(group.itemId);
    item.activeGroups = item.activeGroups.filter(gid => gid !== groupId);
  }

  // Emit group update
  io.to(`item:${group.itemId}`).emit('group:updated', {
    groupId,
    itemId: group.itemId,
    totalAmount: group.totalAmount,
    memberCount: group.members.length,
    groupName: group.groupName
  });

  res.json(group);
});

// ============================================================================
// API ROUTES - CHECKOUT
// ============================================================================

/**
 * GET /api/events/:eventId/checkout/summary
 * Get checkout summary with winners and payment info
 */
app.get('/api/events/:eventId/checkout/summary', (req, res) => {
  const { eventId } = req.params;

  if (!events.has(eventId)) {
    return res.status(404).json({ error: 'Event not found' });
  }

  const eventItems = Array.from(items.values())
    .filter(item => item.eventId === eventId && item.status === 'sold')
    .map(item => {
      let winner = null;
      let winnerInfo = null;

      if (item.currentBidderId) {
        if (item.currentBidType === 'group') {
          const group = groups.get(item.currentBidderId);
          if (group) {
            winner = group.groupName;
            winnerInfo = {
              type: 'group',
              name: group.groupName,
              members: group.members.map(m => ({
                displayName: m.displayName,
                contribution: m.contribution
              })),
              totalAmount: group.totalAmount
            };
          }
        } else {
          const bidder = bidders.get(item.currentBidderId);
          if (bidder) {
            winner = getDisplayName(bidder);
            winnerInfo = {
              type: 'individual',
              bidderId: item.currentBidderId,
              displayName: winner,
              amount: item.currentBid
            };
          }
        }
      }

      return {
        itemId: item.id,
        lotNumber: item.lotNumber,
        title: item.title,
        finalBid: item.currentBid,
        winner,
        winnerInfo
      };
    });

  res.json({
    eventId,
    items: eventItems
  });
});

/**
 * POST /api/events/:eventId/checkout/bidder/:bidderId/pay
 * Mark a bidder as paid
 */
app.post('/api/events/:eventId/checkout/bidder/:bidderId/pay', (req, res) => {
  const { eventId, bidderId } = req.params;

  const bidder = bidders.get(bidderId);
  if (!bidder || bidder.eventId !== eventId) {
    return res.status(404).json({ error: 'Bidder not found' });
  }

  bidder.paymentLinked = true;

  res.json(bidder);
});

/**
 * GET /api/events/:eventId/export/csv
 * Export auction results as CSV
 */
app.get('/api/events/:eventId/export/csv', (req, res) => {
  const { eventId } = req.params;
  const event = events.get(eventId);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const eventItems = Array.from(items.values()).filter(i => i.eventId === eventId);

  let csv = 'Lot #,Item,Starting Bid,Final Bid,Status,Winner Type,Winner,Members,Breakdown\n';

  eventItems.forEach(item => {
    let winnerType = '', winner = '', members = '', breakdown = '';
    if (item.status === 'sold' && item.currentBidderId) {
      if (item.currentBidType === 'group') {
        const group = groups.get(item.currentBidderId);
        if (group) {
          winnerType = 'Group';
          winner = group.groupName;
          members = group.members.length;
          breakdown = group.members.map(m => `${m.displayName}: $${m.contribution}`).join(' | ');
        }
      } else {
        const bidder = bidders.get(item.currentBidderId);
        winnerType = 'Individual';
        winner = bidder ? getDisplayName(bidder) : 'Unknown';
        members = 1;
        breakdown = `$${item.currentBid}`;
      }
    }
    const escape = (s) => `"${String(s).replace(/"/g, '""')}"`;
    csv += `${item.lotNumber},${escape(item.title)},$${item.startingBid},$${item.currentBid},${item.status},${winnerType},${escape(winner)},${members},${escape(breakdown)}\n`;
  });

  // Add summary rows
  const totalRaised = eventItems.filter(i => i.status === 'sold').reduce((sum, i) => sum + i.currentBid, 0);
  const soldCount = eventItems.filter(i => i.status === 'sold').length;
  csv += `\n,,,,TOTAL,,,${soldCount} items,$${totalRaised}\n`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_results.csv"`);
  res.send(csv);
});

// ============================================================================
// CONVENIENCE ENDPOINTS (Frontend compatibility)
// ============================================================================

/**
 * GET /api/events/:eventId/groups
 * Get all groups for an event (admin)
 */
app.get('/api/events/:eventId/groups', (req, res) => {
  const { eventId } = req.params;
  const eventGroups = Array.from(groups.values()).filter(g => g.eventId === eventId);
  res.json(eventGroups);
});

/**
 * GET /api/events/:eventId/bidders/:bidderId/groups
 * Get all groups a bidder belongs to
 */
app.get('/api/events/:eventId/bidders/:bidderId/groups', (req, res) => {
  const { eventId, bidderId } = req.params;
  const bidderGroups = Array.from(groups.values()).filter(g =>
    g.eventId === eventId && g.members.some(m => m.bidderId === bidderId)
  ).map(g => {
    const myMember = g.members.find(m => m.bidderId === bidderId);
    const item = items.get(g.itemId);
    return { ...g, name: g.groupName, yourContribution: myMember?.contribution || 0, itemTitle: item?.title || '' };
  });
  res.json({ groups: bidderGroups });
});

/**
 * GET /api/events/:eventId/bidders/:bidderId/bids
 * Get all bids by a bidder
 */
app.get('/api/events/:eventId/bidders/:bidderId/bids', (req, res) => {
  const { eventId, bidderId } = req.params;
  const bidderBids = bids.filter(b => b.eventId === eventId && b.bidderId === bidderId);
  const enriched = bidderBids.map(b => {
    const item = items.get(b.itemId);
    const isWinning = item?.currentBidderId === bidderId && item?.currentBidType === 'individual';
    return { ...b, itemTitle: item?.title, itemImageUrl: item?.imageUrl, status: isWinning ? 'winning' : 'outbid' };
  });
  res.json({ bids: enriched });
});

/**
 * POST /api/events/:eventId/groups/:groupId/contribution
 * Convenience: update your own contribution (frontend uses this)
 */
function handleContributionUpdate(req, res) {
  const { eventId, groupId } = req.params;
  const { bidderId, contribution, amount } = req.body;
  const resolvedAmount = contribution || amount;
  const group = groups.get(groupId);
  if (!group || group.eventId !== eventId) return res.status(404).json({ error: 'Group not found' });
  const member = group.members.find(m => m.bidderId === bidderId);
  if (!member) return res.status(404).json({ error: 'Not a member of this group' });
  const oldContribution = member.contribution;
  member.contribution = resolvedAmount;
  group.totalAmount = group.totalAmount - oldContribution + resolvedAmount;

  const item = items.get(group.itemId);
  if (group.totalAmount > item.currentBid) {
    item.currentBid = group.totalAmount;
    item.currentBidderId = groupId;
    item.currentBidType = 'group';
    io.to(`event:${eventId}`).emit('bid:new', { itemId: group.itemId, amount: group.totalAmount, displayName: group.groupName, type: 'group', groupId });
  }
  io.to(`item:${group.itemId}`).emit('group:updated', { groupId, itemId: group.itemId, totalAmount: group.totalAmount, memberCount: group.members.length, groupName: group.groupName });
  io.to(`group:${groupId}`).emit('group:updated', { groupId, itemId: group.itemId, totalAmount: group.totalAmount, memberCount: group.members.length, groupName: group.groupName });
  res.json(group);
}
app.post('/api/events/:eventId/groups/:groupId/contribution', handleContributionUpdate);
app.patch('/api/events/:eventId/groups/:groupId/contribution', handleContributionUpdate);

/**
 * POST /api/events/:eventId/groups/:groupId/leave
 * Convenience: leave a group
 */
app.post('/api/events/:eventId/groups/:groupId/leave', (req, res) => {
  const { eventId, groupId } = req.params;
  const { bidderId } = req.body;
  const group = groups.get(groupId);
  if (!group || group.eventId !== eventId) return res.status(404).json({ error: 'Group not found' });
  const memberIndex = group.members.findIndex(m => m.bidderId === bidderId);
  if (memberIndex === -1) return res.status(404).json({ error: 'Not a member' });
  const removed = group.members.splice(memberIndex, 1)[0];
  group.totalAmount -= removed.contribution;
  io.to(`group:${groupId}`).emit('group:updated', { groupId, itemId: group.itemId, totalAmount: group.totalAmount, memberCount: group.members.length, groupName: group.groupName });
  res.json({ success: true });
});

/**
 * POST /api/events/:eventId/groups/join-by-code
 * Join a group using just the join code (frontend uses this)
 */
app.post('/api/events/:eventId/groups/join-by-code', (req, res) => {
  const { eventId } = req.params;
  const { joinCode, bidderId, contribution } = req.body;
  const group = Array.from(groups.values()).find(g => g.eventId === eventId && g.joinCode === joinCode && g.status === 'active');
  if (!group) return res.status(404).json({ error: 'Group not found with that code' });

  const bidder = bidders.get(bidderId);
  if (!bidder) return res.status(404).json({ error: 'Bidder not found' });
  if (group.members.some(m => m.bidderId === bidderId)) return res.status(400).json({ error: 'Already in this group' });

  const displayName = getDisplayName(bidder);
  group.members.push({ bidderId, displayName, contribution, joinedAt: new Date().toISOString() });
  group.totalAmount += contribution;

  const item = items.get(group.itemId);
  if (group.totalAmount > item.currentBid) {
    const bidId = uuidv4();
    bids.push({ id: bidId, eventId, itemId: group.itemId, bidderId: null, groupId: group.id, amount: group.totalAmount, type: 'group', displayName: group.groupName, timestamp: new Date().toISOString(), status: 'active' });
    item.currentBid = group.totalAmount;
    item.currentBidderId = group.id;
    item.currentBidType = 'group';
    item.bidCount += 1;
    io.to(`event:${eventId}`).emit('bid:new', { itemId: group.itemId, amount: group.totalAmount, displayName: group.groupName, type: 'group', groupId: group.id });
  }
  io.to(`item:${group.itemId}`).emit('group:updated', { groupId: group.id, itemId: group.itemId, totalAmount: group.totalAmount, memberCount: group.members.length, groupName: group.groupName });
  io.to(`group:${group.id}`).emit('group:joined', { groupId: group.id, displayName, memberCount: group.members.length });
  // Send rivalry update
  const itemGroups = Array.from(groups.values()).filter(g => g.itemId === group.itemId && g.status === 'active');
  if (itemGroups.length >= 2) {
    io.to(`event:${eventId}`).emit('rivalry:update', { itemId: group.itemId, groups: itemGroups.map(g => ({ id: g.id, name: g.groupName, total: g.totalAmount, memberCount: g.members.length })) });
  }

  res.status(201).json(group);
});

// ============================================================================
// SOCKET.IO EVENT HANDLERS
// ============================================================================

io.on('connection', (socket) => {

  // Client joins event room (support 'join', 'join:event', and 'join-auction')
  socket.on('join:event', ({ eventId }) => {
    socket.join(`event:${eventId}`);
  });
  socket.on('join', ({ eventId }) => {
    if (eventId) socket.join(`event:${eventId}`);
  });
  socket.on('join-auction', ({ eventId, bidderId }) => {
    if (eventId) socket.join(`event:${eventId}`);
    if (bidderId) socket.join(`user:${bidderId}`);
  });

  socket.on('join:item', ({ eventId, itemId }) => {
    socket.join(`item:${itemId}`);
  });
  socket.on('join:group', ({ groupId }) => {
    socket.join(`group:${groupId}`);
  });
  socket.on('join:user', ({ bidderId }) => {
    socket.join(`user:${bidderId}`);
  });
});

// ============================================================================
// START SERVER
// ============================================================================

async function gracefulShutdown(signal) {
  console.log(`${signal} received: persisting state and shutting down...`);
  await persistStateNow(`shutdown:${signal}`);
  if (mongoEnabled) {
    await mongoose.disconnect();
  }
  process.exit(0);
}

process.on('SIGINT', () => {
  gracefulShutdown('SIGINT').catch(() => process.exit(1));
});
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM').catch(() => process.exit(1));
});

async function bootstrap() {
  await initializePersistenceAndRestore();

  // Seed demo data only when no persisted state was restored.
  if (!stateRestoredFromMongo) {
    seedDemoData();
    await persistStateNow('initial-seed');
  }

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`BidFlow server running on http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap server:', error);
  process.exit(1);
});
