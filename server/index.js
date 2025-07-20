import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { analyzeMessage, analyzeMessageNoCombo, loadProductsForGroupExport as loadProductsForGroup } from './aiService.js';
import dotenv from 'dotenv';
import axios from 'axios';
import authRouter from './auth.js'; 
import fs from 'fs';
import path from 'path';


dotenv.config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  'https://w-azd2.onrender.com', // deployed frontend
  'https://oih.onrender.com', // backend (optional)
  'http://localhost:5173'         // local frontend for development
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



const connectedUsers = new Map();
const groupCarts = {}; // { [roomId]: [cartItems] }


const groupWishlists = {}; 


app.get('/api/wishlist/:roomId', (req, res) => {
  const { roomId } = req.params;
  res.json(groupWishlists[roomId] || []);
});

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



app.delete('/api/wishlist/:roomId/:productId', (req, res) => {
  const { roomId, productId } = req.params;
  if (!groupWishlists[roomId]) return res.status(404).json({ error: 'Wishlist not found' });
  groupWishlists[roomId] = groupWishlists[roomId].filter(item => String(item.id) !== String(productId));
  res.json(groupWishlists[roomId]);
});



app.get('/api/wishlist/:roomId/ai-suggestions', async (req, res) => {
  const { roomId } = req.params;

  
  const groupMessages = recentMessages.filter(m => m.roomId === roomId);
  const N = 3;
  const context = groupMessages.slice(-N).map(m => m.text).join('\n');

  
  let groupType = 'default';
  const group = getGroupById(roomId);
  if (group && group.category === 'Custom') {
    groupType = null;
  } else if (roomId) {
    groupType = roomId.split('-')[0];
  }
  try {
   
    
    const suggestions = await analyzeMessageNoCombo(context, 5, groupType);
   
    
    const wishlist = groupWishlists[roomId] || [];
    const filteredSuggestions = suggestions.filter(s => !wishlist.some(w => w.id === s.id));
    res.json(filteredSuggestions);
  } catch (e) {
    res.status(500).json({ error: 'AI suggestion failed' });
  }
});


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


function saveAddressesToFile() {
  try {
    fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(groupAddresses, null, 2));
    console.log('addresses.json written successfully');
  } catch (err) {
    console.error('Failed to write addresses.json:', err);
  }
}



app.get('/api/address/:roomId', (req, res) => {
  const { roomId } = req.params;
  res.json(groupAddresses[roomId] || null);
});


app.post('/api/address/:roomId', (req, res) => {
  console.log('POST /api/address/:roomId called', req.params.roomId, req.body);
  const { roomId } = req.params;
  const address = req.body;
  groupAddresses[roomId] = address;
  saveAddressesToFile();
  res.json(address);
});



const NOTIFICATIONS_FILE = './notifications.json';
let notifications = [];


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


async function generateNotificationMessage(activity) {

  
  return `🔔 ${activity}`;
}


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


app.get('/api/notifications', (req, res) => {
  const { user_id } = req.query;
  const userNotifications = notifications.filter(n => String(n.user_id) === String(user_id));
  res.json(userNotifications);
});


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



app.get('/api/groups', (req, res) => {
  res.json(groups);
});



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
 
  
  group.name = name.trim();
  saveGroupsToFile();
  res.json(group);
});



let recentMessages = [];
const MAX_RECENT = 20;



const SUGGESTION_INTERVAL = 3;
global.messageCountSinceAISuggestion = 0;

let lastComboSuggested = null;



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


const cartNotificationState = {};
const CART_NOTIFICATION_RATE_LIMIT_MS = 30 * 1000; // 30 seconds
const CART_NOTIFICATION_BATCH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

// --- Smart Nudge Logic ---
const NUDGE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes per theme
const nudgeState = {}; // { [roomId]: { lastTheme: '', lastTime: 0 } }
const NUDGE_SERVER_URL = 'http://localhost:5003/nudge_theme';

async function maybeSendSmartNudge(roomId) {
 
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
   
    io.to(roomId).emit('nudge', {
      nudge,
      theme,
      timestamp: notification.timestamp,
      id: notification.id 
    });
  } catch (e) {
    console.error('Nudge: Error calling semantic server', e.message);
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  
  socket.emit('aiStatus', { 
    initialized: true,
    message: 'AI-powered suggestions are active'
  });

  socket.on('join', (username, roomId) => {
    console.log(`[JOIN] User: ${username}, Socket: ${socket.id}, Room: ${roomId}`);
    connectedUsers.set(socket.id, username);
    if (roomId) {
      socket.join(roomId);
     
      
      socket.emit('cartUpdate', groupCarts[roomId] || []);
    }
    io.emit('userJoined', { id: socket.id, username });
  });

  socket.on('message', async (message) => {
    const username = connectedUsers.get(socket.id);
    const messageWithUser = { ...message, username, id: socket.id };
    io.emit('message', messageWithUser);

  
    
    const command = parseCartCommand(message.text);
    if (command) {
    
      io.emit('message', {
        username: 'AI Assistant',
        text: 'Product image generation is currently unavailable.',
        timestamp: new Date().toISOString(),
        isAI: true
      });
    }

 
    recentMessages.push(messageWithUser);
    if (recentMessages.length > MAX_RECENT) {
      recentMessages.shift(); // Remove oldest
    }

   
    let groupType = 'default';
    const group = getGroupById(message.roomId);
    if (group && group.category === 'Custom') {
      groupType = null; 
    } else if (message.roomId) {
      groupType = message.roomId.split('-')[0];
    } else if (message.groupType) {
      groupType = message.groupType;
    }
  
    console.log('Calling loadProductsForGroup with groupType:', groupType);
   
    const allProducts = loadProductsForGroup(groupType); 
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
    
    console.log('Sending products to semantic server. First product:', filteredProducts[0]?.name, 'Total:', filteredProducts.length);
    console.log('Calling loadProductsForGroup with groupType:', groupType);

    
    const N = 3; 
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
        lastComboSuggested = null; 
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      socket.emit('error', { 
        message: 'Failed to generate product suggestions. Please try again.'
      });
      return;
    }

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