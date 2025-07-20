import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { analyzeMessage, analyzeMessageNoCombo, loadProductsForGroupExport as loadProductsForGroup } from './aiService.js';
import dotenv from 'dotenv';
import axios from 'axios';
import authRouter from './auth.js'; // <-- use import, not require
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  'https://cart-7rqq.onrender.com', // your frontend
  'https://on-34vf.onrender.com'    // your backend (optional, for self-calls)
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST']
}));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

app.use(express.json());
app.use('/api/auth', authRouter);

// (Removed static file serving and index.html fallback for development)

// Store connected users and shared cart
const connectedUsers = new Map();
const groupCarts = {}; // { [roomId]: [cartItems] }

// --- Group Wishlist (in-memory, per group) ---
const groupWishlists = {}; // { [roomId]: [ { id, name, votes, addedBy, ...product } ] }

// Get wishlist for a group
app.get('/api/wishlist/:roomId', (req, res) => {
  const { roomId } = req.params;
  res.json(groupWishlists[roomId] || []);
});

// Add product to wishlist
app.post('/api/wishlist/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { product, addedBy } = req.body;
  if (!groupWishlists[roomId]) groupWishlists[roomId] = [];
  // Prevent duplicates by product id
  if (groupWishlists[roomId].some(item => item.id === product.id)) {
    return res.status(400).json({ error: 'Product already in wishlist' });
  }
  groupWishlists[roomId].push({ ...product, votes: 1, addedBy, voters: [addedBy] });
  res.json(groupWishlists[roomId]);
});

// Upvote/downvote wishlist item
app.post('/api/wishlist/:roomId/vote', (req, res) => {
  const { roomId } = req.params;
  const { productId, username, vote } = req.body; // vote: +1 or -1
  const wishlist = groupWishlists[roomId];
  if (!wishlist) return res.status(404).json({ error: 'Wishlist not found' });
  const item = wishlist.find(i => i.id === productId);
  if (!item) return res.status(404).json({ error: 'Product not in wishlist' });
  if (!item.voters) item.voters = [];
  if (vote === 1 && !item.voters.includes(username)) {
    item.votes = (item.votes || 0) + 1;
    item.voters.push(username);
  } else if (vote === -1 && item.voters.includes(username)) {
    item.votes = Math.max(0, (item.votes || 1) - 1);
    item.voters = item.voters.filter(u => u !== username);
  }
  res.json(item);
});

// Remove product from wishlist
app.delete('/api/wishlist/:roomId/:productId', (req, res) => {
  const { roomId, productId } = req.params;
  if (!groupWishlists[roomId]) return res.status(404).json({ error: 'Wishlist not found' });
  groupWishlists[roomId] = groupWishlists[roomId].filter(item => String(item.id) !== String(productId));
  res.json(groupWishlists[roomId]);
});

// AI-powered suggestions for wishlist (reuse analyzeMessageNoCombo)
app.get('/api/wishlist/:roomId/ai-suggestions', async (req, res) => {
  const { roomId } = req.params;
  // Use last 3 group messages as context
  const groupMessages = recentMessages.filter(m => m.roomId === roomId);
  const N = 3;
  const context = groupMessages.slice(-N).map(m => m.text).join('\n');
  // Extract groupType from group
  let groupType = 'default';
  const group = getGroupById(roomId);
  if (group && group.category === 'Custom') {
    groupType = null;
  } else if (roomId) {
    groupType = roomId.split('-')[0];
  }
  try {
    // Debug: print first product sent to semantic server
    const suggestions = await analyzeMessageNoCombo(context, 5, groupType);
    // Filter out products already in wishlist
    const wishlist = groupWishlists[roomId] || [];
    const filteredSuggestions = suggestions.filter(s => !wishlist.some(w => w.id === s.id));
    res.json(filteredSuggestions);
  } catch (e) {
    res.status(500).json({ error: 'AI suggestion failed' });
  }
});

// --- Group Delivery Address (in-memory, per group) ---
// PRIVACY NOTE: In production, encrypt address/phone fields and do not store in plaintext!
const ADDRESSES_FILE = './addresses.json';
let groupAddresses = {};
// Load addresses from file on server start
if (fs.existsSync(ADDRESSES_FILE)) {
  try {
    groupAddresses = JSON.parse(fs.readFileSync(ADDRESSES_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load addresses.json:', e);
    groupAddresses = {};
  }
}
// Helper to save addresses to file
function saveAddressesToFile() {
  try {
    fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(groupAddresses, null, 2));
    console.log('addresses.json written successfully');
  } catch (err) {
    console.error('Failed to write addresses.json:', err);
  }
}
// Get address for a group
app.get('/api/address/:roomId', (req, res) => {
  const { roomId } = req.params;
  res.json(groupAddresses[roomId] || null);
});
// Set address for a group
app.post('/api/address/:roomId', (req, res) => {
  console.log('POST /api/address/:roomId called', req.params.roomId, req.body);
  const { roomId } = req.params;
  const address = req.body;
  groupAddresses[roomId] = address;
  saveAddressesToFile();
  res.json(address);
});

// --- Smart Notifications Module (JSON DB) ---
const NOTIFICATIONS_FILE = './notifications.json';
let notifications = [];
// Load notifications from file on server start
if (fs.existsSync(NOTIFICATIONS_FILE)) {
  try {
    notifications = JSON.parse(fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load notifications.json:', e);
    notifications = [];
  }
}
function saveNotificationsToFile() {
  try {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(notifications, null, 2));
    console.log('notifications.json written successfully');
  } catch (err) {
    console.error('Failed to write notifications.json:', err);
  }
}
// Mock GenAI notification generator
async function generateNotificationMessage(activity) {
  // In production, call OpenAI/AIMLAPI here
  return `🔔 ${activity}`;
}
// Add a notification
app.post('/api/notifications', async (req, res) => {
  const { user_id, message, type } = req.body;
  const friendlyMessage = await generateNotificationMessage(message);
  const notification = {
    id: Date.now(),
    user_id,
    message: friendlyMessage,
    type: type || 'info',
    is_read: false,
    timestamp: new Date().toISOString()
  };
  notifications.push(notification);
  saveNotificationsToFile();
  res.json(notification);
});
// Get notifications for a user
app.get('/api/notifications', (req, res) => {
  const { user_id } = req.query;
  const userNotifications = notifications.filter(n => String(n.user_id) === String(user_id));
  res.json(userNotifications);
});
// Mark notification as read
app.post('/api/notifications/:id/read', (req, res) => {
  const { id } = req.params;
  const notification = notifications.find(n => String(n.id) === String(id));
  if (notification) {
    notification.is_read = true;
    saveNotificationsToFile();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// --- Group Management (groups.json) ---
const GROUPS_FILE = './groups.json';
let groups = [];
if (fs.existsSync(GROUPS_FILE)) {
  try {
    groups = JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to load groups.json:', e);
    groups = [];
  }
}
function getGroupById(id) {
  return groups.find(g => g.id === id);
}
function saveGroupsToFile() {
  try {
    fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2));
    console.log('groups.json written successfully');
  } catch (err) {
    console.error('Failed to write groups.json:', err);
  }
}
function generateGroupId(length = 7) {
  return Math.random().toString(36).substr(2, length);
}
// Create a new group
app.post('/api/groups', (req, res) => {
  const { name, category, creator, members, accessType } = req.body;
  if (!name || !creator) {
    return res.status(400).json({ error: 'Group name and creator are required' });
  }
  const groupId = generateGroupId();
  const group = {
    id: groupId,
    name,
    category: category || '',
    creator,
    members: Array.isArray(members) ? members : (typeof members === 'string' ? members.split(',').map(m => m.trim()).filter(Boolean) : []),
    accessType: accessType || 'open', // 'open' or 'approval'
    createdAt: new Date().toISOString()
  };
  groups.push(group);
  saveGroupsToFile();
  const inviteLink = `${req.protocol}://${req.get('host')}/room/${groupId}`;
  res.json({ ...group, inviteLink });
});

// Get all groups
app.get('/api/groups', (req, res) => {
  res.json(groups);
});

// Delete a group (only if custom)
app.delete('/api/groups/:groupId', (req, res) => {
  const { groupId } = req.params;
  const group = groups.find(g => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  if (group.category !== 'Custom') {
    return res.status(403).json({ error: 'Only custom groups can be deleted' });
  }
  groups = groups.filter(g => g.id !== groupId);
  saveGroupsToFile();
  res.json({ success: true });
});

// PATCH endpoint to update custom group name
app.patch('/api/groups/:groupId', (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Group name is required' });
  }
  const group = groups.find(g => g.id === groupId);
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  if (group.category !== 'Custom') {
    return res.status(403).json({ error: 'Only custom groups can be renamed' });
  }
  // Optionally, check that the requester is the creator (if you have auth)
  group.name = name.trim();
  saveGroupsToFile();
  res.json(group);
});

// Track a rolling window of the last 20 messages from all users
let recentMessages = [];
const MAX_RECENT = 20;

// At the top:
const SUGGESTION_INTERVAL = 3;
global.messageCountSinceAISuggestion = 0;

let lastComboSuggested = null;

// Helper: parse cart commands from chat
function parseCartCommand(message) {
  const text = message.toLowerCase();
  const addMatch = text.match(/add\s+(\d+)?\s*([a-z]+)/);
  const removeMatch = text.match(/remove\s+(\d+)?\s*([a-z]+)/);
  if (addMatch) {
    return {
      action: 'add',
      quantity: parseInt(addMatch[1] || '1', 10),
      product: addMatch[2]
    };
  }
  if (removeMatch) {
    return {
      action: 'remove',
      quantity: parseInt(removeMatch[1] || '1', 10),
      product: removeMatch[2]
    };
  }
  return null;
}

// Helper: cart logic
const sharedCartHandler = {
  addToCart(product, username) {
    const existing = sharedCart.find(item => item.id === product.id && item.addedBy === username);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      sharedCart.push({ ...product, addedBy: username, quantity: 1 });
    }
  },
  removeFromCart(product, username) {
    const existing = sharedCart.find(item => item.id === product.id && item.addedBy === username);
    if (existing) {
      existing.quantity = (existing.quantity || 1) - 1;
      if (existing.quantity <= 0) {
        sharedCart = sharedCart.filter(item => !(item.id === product.id && item.addedBy === username));
      }
    }
  }
};

// --- Notification Rate Limiting and Batching ---
// Structure: { [roomId]: { [username]: { lastTime: Date, batchCount: number, batchTimer: Timeout|null } } }
const cartNotificationState = {};
const CART_NOTIFICATION_RATE_LIMIT_MS = 30 * 1000; // 30 seconds
const CART_NOTIFICATION_BATCH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// --- Smart Nudge Logic ---
const NUDGE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes per theme
const nudgeState = {}; // { [roomId]: { lastTheme: '', lastTime: 0 } }
const NUDGE_SERVER_URL = 'http://localhost:5003/nudge_theme';

async function maybeSendSmartNudge(roomId) {
  // Summarize recent activity (cart adds + chat)
  const recent = recentMessages.filter(m => m.roomId === roomId).slice(-10);
  let summary = recent.map(m => m.text || m.product?.name || '').join(' ');
  if (!summary.trim()) {
    console.log('Nudge: No summary text');
    return;
  }
  // Call Python semantic server for nudge theme
  try {
    const resp = await axios.post(NUDGE_SERVER_URL, { summary });
    const { theme, similarity, nudge } = resp.data;
    console.log('Nudge candidate:', { summary, theme, similarity, nudge });
    if (!nudge || similarity < 0.4) return;
    if (!nudgeState[roomId]) nudgeState[roomId] = { lastTheme: '', lastTime: 0 };
    const now = Date.now();
    if (nudgeState[roomId].lastTheme === theme && now - nudgeState[roomId].lastTime < NUDGE_INTERVAL_MS) return;
    nudgeState[roomId] = { lastTheme: theme, lastTime: now };
    // Store nudge as a notification (replace previous notification logic)
    const notification = {
      id: Date.now() + Math.floor(Math.random() * 10000),
      user_id: roomId, // Use roomId as the group identifier
      message: nudge,
      type: 'ai-nudge',
      is_read: false,
      timestamp: new Date().toISOString()
    };
    notifications.push(notification);
    saveNotificationsToFile();
    // Only emit as a special nudge event for banner/toast (not as chat message)
    io.to(roomId).emit('nudge', {
      nudge,
      theme,
      timestamp: notification.timestamp,
      id: notification.id // include the id for frontend
    });
  } catch (e) {
    console.error('Nudge: Error calling semantic server', e.message);
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Inform client about AI service status (always active now)
  socket.emit('aiStatus', { 
    initialized: true,
    message: 'AI-powered suggestions are active'
  });

  socket.on('join', (username, roomId) => {
    console.log(`[JOIN] User: ${username}, Socket: ${socket.id}, Room: ${roomId}`);
    connectedUsers.set(socket.id, username);
    if (roomId) {
      socket.join(roomId);
      // Send the current cart for this group
      socket.emit('cartUpdate', groupCarts[roomId] || []);
    }
    io.emit('userJoined', { id: socket.id, username });
  });

  socket.on('message', async (message) => {
    const username = connectedUsers.get(socket.id);
    const messageWithUser = { ...message, username, id: socket.id };
    io.emit('message', messageWithUser);

    // Parse for cart commands
    const command = parseCartCommand(message.text);
    if (command) {
      // The original code had loadProducts() here, but loadProducts is not defined.
      // Assuming the intent was to find a product if the command was 'add' or 'remove'.
      // Since image generation is removed, we'll just emit a message saying it's not available.
      io.emit('message', {
        username: 'AI Assistant',
        text: 'Product image generation is currently unavailable.',
        timestamp: new Date().toISOString(),
        isAI: true
      });
    }

    // Store the full message object
    recentMessages.push(messageWithUser);
    if (recentMessages.length > MAX_RECENT) {
      recentMessages.shift(); // Remove oldest
    }

    // Extract groupType from roomId if available
    let groupType = 'default';
    const group = getGroupById(message.roomId);
    if (group && group.category === 'Custom') {
      groupType = null; // Use all products
    } else if (message.roomId) {
      groupType = message.roomId.split('-')[0];
    } else if (message.groupType) {
      groupType = message.groupType;
    }
    // Debug: print groupType before loading products
    console.log('Calling loadProductsForGroup with groupType:', groupType);
    // Load and log filtered products for debugging
    const allProducts = loadProductsForGroup(groupType); // If groupType is null, returns all products
    console.log('First product loaded:', allProducts[0]?.name, 'Total:', allProducts.length);
    let filteredProducts = allProducts;
    if (groupType && groupType !== 'default') {
      filteredProducts = allProducts.filter(p =>
        p.tags && p.tags.map(t => t.toLowerCase()).includes(groupType.toLowerCase())
      );
      if (filteredProducts.length < 4) filteredProducts = allProducts;
    }
    console.log('Group type for suggestions:', groupType);
    console.log('First product in filteredProducts:', filteredProducts[0]?.name);
    // Debug: print first product sent to semantic server
    console.log('Sending products to semantic server. First product:', filteredProducts[0]?.name, 'Total:', filteredProducts.length);
    console.log('Calling loadProductsForGroup with groupType:', groupType);

    // 1. Check for combo suggestion on every message
    const N = 3; // Use the last 3 messages for context
    const recentTexts = recentMessages.slice(-N).map(m => m.text).join('\n');
    try {
      const suggestions = await analyzeMessage(recentTexts, 5, groupType);
      if (
        suggestions &&
        suggestions.length > 0 &&
        suggestions[0].phrase &&
        suggestions[0].phrase.startsWith('Super Saving Deal!')
      ) {
        setTimeout(() => {
          io.emit('message', {
            username: 'AI Assistant',
            text: 'Combo suggestion just for you!',
            timestamp: new Date().toISOString(),
            suggestions,
            isAI: true
          });
        }, 1000);
        return;
      } else {
        lastComboSuggested = null; // Reset if no combo is suggested
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      socket.emit('error', { 
        message: 'Failed to generate product suggestions. Please try again.'
      });
      return;
    }

    // 2. Normal AI suggestion every 3 messages (never combos)
    global.messageCountSinceAISuggestion = (global.messageCountSinceAISuggestion || 0) + 1;
    if (global.messageCountSinceAISuggestion % SUGGESTION_INTERVAL === 0) {
      try {
        const recentTexts = recentMessages.slice(-N).map(m => m.text).join('\n');
        const suggestions = await analyzeMessageNoCombo(recentTexts, 5, groupType);
        if (suggestions && suggestions.length > 0) {
          console.log('Emitting suggestions to UI:', suggestions.map(p => p.name));
          setTimeout(() => {
            io.emit('message', {
              username: 'AI Assistant',
              text: 'Based on AI analysis of everyone\'s recent conversation, you might be interested in:',
              timestamp: new Date().toISOString(),
              suggestions,
              isAI: true
            });
          }, 1000);
        }
      } catch (error) {
        console.error('Error generating suggestions:', error);
        socket.emit('error', { 
          message: 'Failed to generate product suggestions. Please try again.'
        });
      }
    }
    await maybeSendSmartNudge(message.roomId);
  });

  socket.on('addToCart', async (product) => {
    console.log(`[ADD TO CART] Product: ${product.name}, Room: ${product.roomId}, By: ${product.addedBy}`);
    const { roomId, addedBy } = product;
    if (!roomId) return;
    if (!groupCarts[roomId]) groupCarts[roomId] = [];
    const cart = groupCarts[roomId];
    const existing = cart.find(item => item.id === product.id && item.addedBy === addedBy);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }
    io.to(roomId).emit('cartUpdate', cart);
  });

  socket.on('incrementCartItem', (itemId, addedBy, roomId) => {
    console.log('incrementCartItem called with:', { itemId, addedBy, roomId });
    if (!roomId || !groupCarts[roomId]) return;
    const cart = groupCarts[roomId];
    const item = cart.find(i => i.id === itemId && i.addedBy === addedBy);
    if (item) {
      item.quantity = (item.quantity || 1) + 1;
      io.to(roomId).emit('cartUpdate', cart);
    }
  });

  socket.on('decrementCartItem', (itemId, addedBy, roomId) => {
    console.log('decrementCartItem called with:', { itemId, addedBy, roomId });
    if (!roomId || !groupCarts[roomId]) return;
    const cart = groupCarts[roomId];
    const item = cart.find(i => i.id === itemId && i.addedBy === addedBy);
    if (item) {
      item.quantity = (item.quantity || 1) - 1;
      if (item.quantity <= 0) {
        groupCarts[roomId] = cart.filter(i => !(i.id === itemId && i.addedBy === addedBy));
      }
      io.to(roomId).emit('cartUpdate', groupCarts[roomId]);
    }
  });

  socket.on('removeFromCart', (productId, roomId) => {
    console.log('removeFromCart called with:', { productId, roomId });
    if (!roomId || !groupCarts[roomId]) return;
    groupCarts[roomId] = groupCarts[roomId].filter(item => item.id !== productId);
    io.to(roomId).emit('cartUpdate', groupCarts[roomId]);
  });

  socket.on('getMessages', () => {
    socket.emit('messages', recentMessages);
    // Optionally send cart for this room if you want
  });

  socket.on('disconnect', () => {
    const username = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    io.emit('userLeft', { id: socket.id, username });
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('AI Service Status: Active');
});