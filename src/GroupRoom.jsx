import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { PaperAirplaneIcon, SparklesIcon, UserGroupIcon, HandThumbUpIcon, HandThumbDownIcon, LightBulbIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { translateHindiToEnglish } from './utils/translate';
import { Dialog } from '@headlessui/react';

const socket = io('http://localhost:3000');
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ProfileDropdown component for user profile and logout dropdown
function ProfileDropdown({ user, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  React.useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick(e) {
      if (!e.target.closest('.profile-dropdown')) setDropdownOpen(false);
    }
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);
  return (
    <div className="relative profile-dropdown ml-4">
      <button
        className="flex items-center gap-2 focus:outline-none"
        onClick={() => setDropdownOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={dropdownOpen}
      >
        <span className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center text-pink-700 text-lg font-bold">
          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
        </span>
        <span className="font-semibold text-gray-700 text-base">{user.name}</span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded shadow-lg z-50 animate-fade-in">
          <button
            onClick={onLogout}
            className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-pink-50 rounded"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function GroupRoom() {
  const { roomId } = useParams();
  const LOCAL_STORAGE_GROUP_KEY = `groupChatMessages_${roomId}`;
  const [messages, setMessages] = useState(() => {
    // Load messages for this group from localStorage on initial mount
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GROUP_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputMessage, setInputMessage] = useState('');
  const [cart, setCart] = useState([]);
  const [aiStatus, setAiStatus] = useState({ initialized: false, message: '' });
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const user = JSON.parse(localStorage.getItem('user'));
  const [username] = useState(user?.name || '');
  // Store translation for the next message
  const translationRef = useRef(null);
  const navigate = useNavigate();
  const [trendingSuggestions, setTrendingSuggestions] = useState([]);
  const [cartTrends, setCartTrends] = useState({});
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState(null);
  const [aiWishlistSuggestions, setAiWishlistSuggestions] = useState([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [groupDetails, setGroupDetails] = useState(null);
  const [nudge, setNudge] = useState(null);
  const nudgeTimeoutRef = useRef(null);

  // Add notification state and logic at the top of GroupRoom function
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Example address and gift note state (replace with your actual state if needed)
  const [address, setAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    pincode: '',
    addressLine1: '',
    city: '',
    state: '',
    phone: '',
    nickname: '',
    shareWithGroup: false,
  });
  const [addressEditMode, setAddressEditMode] = useState(false);
  // Fetch address for this room on mount
  useEffect(() => {
    if (!roomId) return;
    axios.get(`${API_URL}/api/address/${roomId}`)
      .then(res => setAddress(res.data))
      .catch(() => setAddress(null));
  }, [roomId]);
  // Address form submit handler
  const handleAddressSave = () => {
    console.log('Submitting address:', roomId, addressForm); // Add this line
    axios.post(`${API_URL}/api/address/${roomId}`, { ...addressForm })
      .then(res => {
        setAddress(res.data);
        setAddressEditMode(false);
      });
  };

  useEffect(() => {
    socket.on('message', (message) => {
      console.log('Full message received (GroupRoom):', message);
      if (message.suggestions) {
        console.log('Suggestions received (GroupRoom):', message.suggestions);
      }
      setMessages(prev => [...prev, message]);
      if (message.username === 'AI Assistant' && message.suggestions) {
        setTrendingSuggestions(message.suggestions);
      }
    });
    socket.on('cartUpdate', (updatedCart) => {
      console.log('Received cartUpdate:', updatedCart);
      setCart(Array.isArray(updatedCart) ? [...updatedCart] : []);
    });
    socket.on('aiStatus', (status) => {
      setAiStatus(status);
    });
    socket.on('error', (error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    });
    // Emit join event for this room and user
    if (username && roomId) {
      socket.emit('join', username, roomId);
      socket.emit('getMessages');
    }
    return () => {
      socket.off('message');
      socket.off('cartUpdate');
      socket.off('aiStatus');
      socket.off('error');
      socket.off('messages');
    };
  }, [roomId, username]);

  // Fetch only ai-nudge notifications for this group (roomId)
  useEffect(() => {
    if (roomId && notifOpen) {
      axios.get(`${API_URL}/api/notifications?user_id=${roomId}`)
        .then(res => {
          const aiNudges = res.data.filter(n => n.type === 'ai-nudge');
          setNotifications(aiNudges);
          setUnreadCount(aiNudges.filter(n => !n.is_read).length);
        });
    }
  }, [roomId, notifOpen]);

  useEffect(() => {
    if (!user) return;
    // Listen for real-time notifications
    socket.on('notification', (notif) => {
      console.log('Received notification:', notif); // Debug log
      if (notif.user_id === user.name) {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(count => count + 1);
      }
    });
    return () => {
      socket.off('notification');
    };
  }, [user]);

  useEffect(() => {
    if (!roomId) return;
    fetch(`${API_URL}/api/groups`)
      .then(res => res.json())
      .then(groups => {
        console.log('Fetched groups:', groups);
        console.log('Current roomId:', roomId);
        const found = groups.find(g => g.id === roomId);
        console.log('Found group:', found);
        if (found) setGroupDetails(found);
      });
  }, [roomId]);

  const handleMarkRead = (id) => {
    axios.post(`${API_URL}/api/notifications/${id}/read`).then(() => {
      setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(count => Math.max(0, count - 1));
    });
  };

  // Fetch wishlist and AI suggestions
  useEffect(() => {
    if (!roomId) return;
    setWishlistLoading(true);
    axios.get(`${API_URL}/api/wishlist/${roomId}`)
      .then(res => setWishlist(res.data))
      .catch(() => setWishlist([]))
      .finally(() => setWishlistLoading(false));
    axios.get(`${API_URL}/api/wishlist/${roomId}/ai-suggestions`)
      .then(res => setAiWishlistSuggestions(res.data))
      .catch(() => setAiWishlistSuggestions([]));
  }, [roomId]);

  useEffect(() => {
    socket.on('wishlistUpdate', (updatedWishlist) => {
      setWishlist(updatedWishlist);
    });
    return () => {
      socket.off('wishlistUpdate');
    };
  }, []);

  // Add to wishlist
  const handleAddToWishlist = (product) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const addedBy = user?.name || '';
    axios.post(`${API_URL}/api/wishlist/${roomId}`, { product, addedBy })
      .then(res => {
        setWishlist(res.data);
        // Remove from AI suggestions
        setAiWishlistSuggestions(prev => prev.filter(p => p.id !== product.id));
      })
      .catch(err => setWishlistError(err.response?.data?.error || 'Failed to add to wishlist'));
  };
  // Upvote/downvote
  const handleVoteWishlist = (productId, vote) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const username = user?.name || '';
    axios.post(`${API_URL}/api/wishlist/${roomId}/vote`, { productId, username, vote })
      .then(res => {
        setWishlist(wishlist => wishlist.map(item => item.id === productId ? { ...item, votes: res.data.votes, voters: res.data.voters } : item));
      })
      .catch(err => setWishlistError(err.response?.data?.error || 'Failed to vote'));
  };
  // Remove from wishlist
  const handleRemoveFromWishlist = (productId) => {
    axios.delete(`${API_URL}/api/wishlist/${roomId}/${productId}`)
      .then(res => setWishlist(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Save messages to localStorage whenever they change
    localStorage.setItem(LOCAL_STORAGE_GROUP_KEY, JSON.stringify(messages));
  }, [messages, LOCAL_STORAGE_GROUP_KEY]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      const english = await translateHindiToEnglish(inputMessage);
      socket.emit('message', { text: english, timestamp: new Date().toISOString(), roomId });
      setInputMessage('');
    }
  };

  const handleAddToCart = (product) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const username = user?.name || '';
    socket.emit('addToCart', { ...product, addedBy: username, roomId });
    // Update trending count
    setCartTrends(prev => {
      const newTrends = { ...prev };
      newTrends[product.id] = (newTrends[product.id] || 0) + 1;
      return newTrends;
    });
  };

  const translateToEnglish = async (text) => {
    try {
      return await translateHindiToEnglish(text);
    } catch (e) {
      console.error('Translation error:', e);
      return text;
    }
  };

  const startListening = () => {
    if (!SpeechRecognition) {
      alert('Sorry, your browser does not support speech recognition.');
      return;
    }
    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'hi-IN';
      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        const translated = await translateToEnglish(transcript);
        // Store both original and translation for the next message
        translationRef.current = { original: transcript, english: translated };
        setInputMessage((prev) => prev + translated);
        setListening(false);
      };
      recognitionRef.current.onerror = () => setListening(false);
      recognitionRef.current.onend = () => setListening(false);
    }
    setListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleCheckout = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    const tax = subtotal * 0.10;
    const delivery = 8.99;
    const total = subtotal + tax + delivery;
    const contributors = [...new Set(cart.map(item => item.addedBy))];
    const perPerson = contributors.length > 0 ? total / contributors.length : total;
    navigate("/checkout-success", {
      state: {
        cart,
        contributors,
        subtotal,
        tax,
        delivery,
        total,
        perPerson,
        address,
        giftNote
      }
    });
  };

  // Clear group chat history on logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    // Remove all group chat histories
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('groupChatMessages_')) {
        localStorage.removeItem(key);
      }
    });
    setMessages([]);
    window.location.reload(); // Optionally force reload to reset state
  };

  function getTopTrendingProducts(cart, trends, topN = 3) {
    // Get all unique products in the cart
    const allProducts = {};
    cart.forEach(item => {
      allProducts[item.id] = item;
    });
    // Sort by trend count
    return Object.values(allProducts)
      .sort((a, b) => (trends[b.id] || 0) - (trends[a.id] || 0))
      .slice(0, topN);
  }

  function maskPhone(phone) {
    if (!phone || phone.length < 5) return phone;
    return phone.slice(0, 2) + '*****' + phone.slice(-3);
  }

  // --- UI ---
  // Determine group name from roomId
  let groupType = roomId ? roomId.split('-')[0] : '';
  let groupHeading = '';
  let aiMood = { text: '', emoji: '' };
  switch (groupType) {
    case 'festive':
      groupHeading = 'Festive Fiesta';
      aiMood = { text: 'Festive', emoji: '🎉' };
      break;
    case 'family':
      groupHeading = 'Family Circle';
      aiMood = { text: 'Family Time', emoji: '👨‍👩‍👧‍👦' };
      break;
    case 'friends':
      groupHeading = 'Friends Hangout';
      aiMood = { text: 'Friendly Vibes', emoji: '🧑‍🤝‍🧑' };
      break;
    case 'travel':
      groupHeading = 'Travel Crew';
      aiMood = { text: 'Adventure', emoji: '🌏' };
      break;
    default:
      groupHeading = 'Shopping Party';
      aiMood = { text: 'Shopping', emoji: '🛒' };
  }
  // Use real group name if available
  const displayGroupName = groupDetails?.name || groupHeading;

  // Trending suggestion content by group type
  const trendingSuggestion = {
    festive: {
      label: 'Festive Combo',
      title: 'Colorful Navratri Combo',
      image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=80&q=80',
    },
    family: {
      label: 'Family Essentials',
      title: 'Family Grocery Pack',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=80&q=80',
    },
    friends: {
      label: 'Friends Hangout',
      title: 'Party Snacks Bundle',
      image: 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=80&q=80',
    },
    travel: {
      label: 'Travel Must-Have',
      title: 'Travel Essentials Kit',
      image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=80&q=80',
    },
    default: {
      label: 'Trending Now',
      title: 'Popular Picks',
      image: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=80&q=80',
    },
  };
  const suggestion = trendingSuggestion[groupType] || trendingSuggestion.default;

  // Navbar for group room
  const Navbar = () => (
    <nav className="w-full bg-[#F3E6FA] shadow flex items-center justify-between px-8 py-4 mb-2 fixed top-0 left-0 z-30 backdrop-blur" style={{ borderBottom: 'none' }}>
      <div className="flex items-center gap-2">
        <Link to="/" className="text-2xl font-extrabold" style={{ color: '#222A68' }}>OneCart</Link>
      </div>
      <div className="flex gap-6 items-center">
        <Link to="/home" className="text-gray-700 font-semibold hover:text-pink-500 transition-colors">Home</Link>
        {/* Notification Bell */}
        {user && (
          <div className="relative notification-bell">
            <button
              className="relative focus:outline-none"
              onClick={() => setNotifOpen(v => !v)}
              aria-label="Notifications"
            >
              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded shadow-lg z-50 animate-fade-in max-h-80 overflow-y-auto notification-dropdown" style={{maxHeight: '20rem', overflowY: 'auto'}}>
                <div className="p-3 font-bold border-b">AI Nudges</div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-gray-500">No AI nudges yet</div>
                ) : notifications.map(n => (
                  <div key={n.id} className={`p-3 border-b flex items-start gap-2 ${n.is_read ? 'bg-gray-50' : 'bg-blue-50'}`}>
                    <div className="flex-1">
                      <div className="text-sm">{n.message}</div>
                      <div className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {user && <ProfileDropdown user={user} onLogout={handleLogout} />}
      </div>
    </nav>
  );

  // Add click-outside-to-close for notification bar
  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e) {
      // Only close if click is outside the notification dropdown and bell
      if (!e.target.closest('.notification-dropdown') && !e.target.closest('.notification-bell')) {
        setNotifOpen(false);
      }
    }
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [notifOpen]);

  // Listen for nudge events from backend
  useEffect(() => {
    socket.on('nudge', (nudgeObj) => {
      setNudge(nudgeObj);
      if (nudgeTimeoutRef.current) clearTimeout(nudgeTimeoutRef.current);
      nudgeTimeoutRef.current = setTimeout(() => handleDismissNudge(), 8000); // auto-dismiss after 8s
    });
    return () => {
      socket.off('nudge');
      if (nudgeTimeoutRef.current) clearTimeout(nudgeTimeoutRef.current);
    };
  }, []);

  // Mark nudge as read and store it when user closes the banner
  const handleDismissNudge = async () => {
    setNudge(null);
    if (nudge) {
      // Mark as read in backend
      try {
        await axios.post(`${API_URL}/api/notifications/${nudge.id}/read`);
      } catch {}
      // Refetch notifications
      if (roomId) {
        axios.get(`${API_URL}/api/notifications?user_id=${roomId}`)
          .then(res => {
            const aiNudges = res.data.filter(n => n.type === 'ai-nudge');
            setNotifications(aiNudges);
            setUnreadCount(aiNudges.filter(n => !n.is_read).length);
          });
      }
    }
  };

  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  if (!username) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Please log in to join a room.</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F3E6FA' }}>
      {/* Nudge Banner/Toast */}
      {nudge && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 animate-fade-in" style={{maxWidth:'90vw'}}>
          <span className="font-bold">AI Suggestion:</span>
          <span>{nudge.nudge}</span>
          <button onClick={handleDismissNudge} className="ml-4 text-white text-xl font-bold hover:text-yellow-200">×</button>
        </div>
      )}
      {/* Navbar */}
      <Navbar />
      {/* Sticky Group Header only */}
      <div className="sticky top-[64px] z-20 w-full flex flex-col items-center justify-center bg-[#F3E6FA] py-2 shadow-sm" style={{minHeight:'64px'}}>
        <h1 className="text-2xl md:text-3xl font-bold text-purple-800 flex items-center gap-2 max-w-xl w-fit truncate" style={{marginBottom:0}}>
          {groupDetails && groupDetails.category === 'Custom' && groupDetails.creator === username ? (
            editingGroupName ? (
              <>
                <input
                  className="border rounded px-2 py-1 text-lg font-bold"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  style={{ minWidth: 120 }}
                />
                <button
                  className="ml-2 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-semibold shadow hover:bg-green-600 transition-colors"
                  style={{ minWidth: 48 }}
                  onClick={async () => {
                    if (!newGroupName.trim()) return;
                    try {
                      await axios.patch(`${API_URL}/api/groups/${groupDetails.id}`, { name: newGroupName });
                      setGroupDetails(g => ({ ...g, name: newGroupName }));
                      setEditingGroupName(false);
                    } catch {
                      alert('Failed to update group name');
                    }
                  }}
                >Save</button>
                <button
                  className="ml-1 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs font-semibold shadow hover:bg-gray-300 transition-colors border border-gray-300"
                  style={{ minWidth: 48 }}
                  onClick={() => { setEditingGroupName(false); setNewGroupName(groupDetails.name); }}
                >Cancel</button>
              </>
            ) : (
              <>
                {groupDetails.name}
                <button
                  className="ml-2 text-blue-500 hover:text-blue-700"
                  onClick={() => { setEditingGroupName(true); setNewGroupName(groupDetails.name); }}
                  title="Edit group name"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
              </>
            )
          ) : (
            displayGroupName
          )}
        </h1>
        <div className="mt-2 px-3 py-1 bg-gray-200 rounded-full text-sm text-gray-700 font-mono shadow-sm">
          Room Code: <span className="font-bold">{roomId}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 px-4 md:px-8 py-6">
        {/* Chat Section */}
        <div className="flex-1 flex flex-col">
          {/* AI Status Banner sticky inside chat box */}
          <div className={`sticky top-0 z-10 px-4 py-2 flex items-center gap-2 text-sm ${
            aiStatus.initialized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          } rounded-t-xl mb-2`}>
            <SparklesIcon className="h-5 w-5" />
            {aiStatus.message || "AI-powered suggestions are active"}
          </div>
          {/* Error Message */}
          {error && (
            <div className="bg-red-100 text-red-800 px-4 py-2 text-sm rounded mb-2">
              {error}
            </div>
          )}
          <div
            className="flex-1 overflow-y-auto p-2 md:p-4 space-y-4 bg-white rounded-xl shadow pt-16"
            style={{
              backgroundImage: "url('/assets/6ceb4bcb5a93b0c49552a57449cbd0a2.jpg')",
              backgroundSize: 'cover', // stretch to chat area
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundColor: 'rgba(255,255,255,0.7)', // semi-transparent white overlay
              backgroundBlendMode: 'lighten'
            }}
          >
            <div className={`sticky top-0 z-10 px-4 py-2 flex items-center gap-2 text-sm ${aiStatus.initialized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} rounded-t-xl mb-2`}>
              <SparklesIcon className="h-5 w-5" />
              {aiStatus.message || "AI-powered suggestions are active"}
            </div>
            {messages.map((message, index) => {
              // Only render valid chat messages
              if (typeof message !== 'object' || (!('text' in message) && message.username !== 'AI Assistant')) {
                console.warn('Skipping invalid message:', message);
                return null;
              }
              const isAI = message.username === 'AI Assistant';
              const isUser = message.username === username;
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xl w-fit ${isAI ? 'bg-purple-50' : isUser ? 'bg-pink-100' : 'bg-white'} rounded-xl shadow px-5 py-3 mb-2`}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${isAI ? 'bg-yellow-200 text-yellow-700' : isUser ? 'bg-pink-400 text-white' : 'bg-purple-200 text-purple-700'}`}>
                          {isAI ? <SparklesIcon className="h-5 w-5" /> : (typeof message.username === 'string' && message.username.trim().length > 0 ? message.username.trim()[0].toUpperCase() : '🧑')}
                        </div>
                        <span className="text-xs font-semibold mt-1">{message.username}</span>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(message.timestamp).toLocaleTimeString()}</span>
                      {message.mic && <span className="ml-1">🎤</span>}
                    </div>
                    <div className="text-gray-800">{message.text}</div>
                    {message.translation && (
                      <div className="mt-2 text-xs italic text-blue-700 bg-blue-50 rounded px-2 py-1">
                        Hindi: <span className="font-semibold text-gray-700">{message.translation.original}</span><br/>
                        English: <span className="font-semibold text-gray-900">{message.translation.english}</span>
                      </div>
                    )}
                    {/* AI Suggestions rendering */}
                    {isAI && Array.isArray(message.suggestions) && message.suggestions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {message.suggestions[0]?.phrase && (
                          <div className="text-blue-700 font-semibold mb-1">{message.suggestions[0].phrase}</div>
                        )}
                        {message.suggestions.map((product, idx) => {
                          const isWishlisted = wishlist.some(item => item.id === product.id);
                          return (
                            <div key={idx} className="flex items-center gap-3 bg-pink-50 rounded-lg p-3 shadow-sm">
                              <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 overflow-hidden">
                                {product.image ? (
                                  product.image.trim().startsWith('<svg') ? (
                                    <span dangerouslySetInnerHTML={{ __html: product.image }} />
                                  ) : (
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                  )
                                ) : (
                                  <span className="text-2xl">🛍️</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{product.name}</div>
                                <div className="text-sm text-gray-600">₹{product.price}</div>
                              </div>
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="p-2 text-pink-500 hover:bg-pink-100 rounded-full transition-colors"
                                title="Add to cart"
                              >
                                <span className="text-lg">＋</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (isWishlisted) {
                                    handleRemoveFromWishlist(product.id);
                                  } else {
                                    handleAddToWishlist(product);
                                  }
                                }}
                                className={`p-2 ${isWishlisted ? 'text-red-500' : 'text-purple-500'} hover:bg-purple-100 rounded-full transition-colors ml-1`}
                                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                              >
                                {isWishlisted ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.54 0-2.877.792-3.562 2.008C11.565 4.542 10.228 3.75 8.688 3.75 6.099 3.75 4 5.765 4 8.25c0 7.22 8 11.25 8 11.25s8-4.03 8-11.25z" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.54 0-2.877.792-3.562 2.008C11.565 4.542 10.228 3.75 8.688 3.75 6.099 3.75 4 5.765 4 8.25c0 7.22 8 11.25 8 11.25s8-4.03 8-11.25z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          {/* Chat Input */}
          <form onSubmit={handleSendMessage} className="mt-4 flex gap-2 items-center bg-white rounded-full shadow px-4 py-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 rounded-full outline-none border-none bg-transparent"
            />
            <button
              type="button"
              onClick={listening ? stopListening : startListening}
              className={`w-10 h-10 flex items-center justify-center rounded-full ${listening ? 'bg-red-200' : 'bg-gray-200'} hover:bg-gray-300`}
              aria-label={listening ? 'Stop recording' : 'Start recording'}
            >
              {listening ? '🛑' : '🎤'}
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-pink-400 text-white px-6 py-2 rounded-full font-bold shadow hover:from-purple-600"
            >
              Send
            </button>
          </form>
        </div>
        {/* Sidebar */}
        <div className="w-full md:w-96 flex flex-col gap-6">
          {/* Cart Summary */}
          <div
            className="bg-white rounded-xl shadow p-6 mt-8"
            style={{ position: 'sticky', top: '160px', alignSelf: 'flex-start', maxHeight: '80vh', overflowY: 'auto', zIndex: 20 }}
          >
            <h2 className="font-bold text-xl text-purple-700 mb-4 flex items-center gap-2">
              <span role="img" aria-label="cart">🛒</span> Cart Summary
            </h2>
            {cart.map((item) => (
              <div key={item.id + '-' + item.addedBy} className="flex items-center justify-between border-b py-2">
                <div>
                  <div className="font-medium">{item.name}</div>
                  {item.addedBy && (
                    <div className="text-xs text-gray-500">Added by: {item.addedBy}</div>
                  )}
                  <div className="text-gray-600">₹{item.price * item.quantity}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const user = JSON.parse(localStorage.getItem('user'));
                      const fallbackAddedBy = item.addedBy || user?.name || '';
                      if (!item.id || !fallbackAddedBy) {
                        alert('Cart item is missing required info. Please try again.');
                        console.log('Decrement failed:', item);
                        return;
                      }
                      console.log('Decrementing:', item.id, fallbackAddedBy);
                      socket.emit('decrementCartItem', item.id, fallbackAddedBy, roomId);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-lg text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 border border-purple-200"
                    title="Decrease quantity"
                    aria-label="Decrease quantity"
                  >−</button>
                  <span className="w-8 text-center font-semibold text-lg select-none">{item.quantity || 1}</span>
                  <button
                    onClick={() => {
                      const user = JSON.parse(localStorage.getItem('user'));
                      const fallbackAddedBy = item.addedBy || user?.name || '';
                      if (!item.id || !fallbackAddedBy) {
                        alert('Cart item is missing required info. Please try again.');
                        console.log('Increment failed:', item);
                        return;
                      }
                      console.log('Incrementing:', item.id, fallbackAddedBy);
                      socket.emit('incrementCartItem', item.id, fallbackAddedBy, roomId);
                    }}
                    className="w-8 h-8 flex items-center justify-center text-lg text-purple-700 bg-purple-100 rounded-full hover:bg-purple-200 border border-purple-200"
                    title="Increase quantity"
                    aria-label="Increase quantity"
                  >+</button>
                </div>
              </div>
            ))}
            <div className="mt-4 border-t pt-4">
              <div className="font-bold text-lg text-purple-700 flex justify-between">
                Total: <span>₹{cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)}</span>
              </div>
              <button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-400 text-white font-bold py-2 rounded-xl shadow hover:from-purple-600"
                onClick={handleCheckout}>
                Checkout
              </button>
            </div>
          </div>
          {/* Delivery Address Section removed as per request */}
        </div>
        {/* Floating Wishlist Button */}
        <button
          className="fixed bottom-8 right-8 z-40 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg p-4 flex items-center gap-2 text-lg font-bold"
          onClick={() => setWishlistOpen(true)}
          style={{ boxShadow: '0 4px 24px rgba(80,0,120,0.15)' }}
        >
          <LightBulbIcon className="h-7 w-7 text-yellow-300" /> Wishlist
        </button>
        {/* Wishlist Drawer/Modal */}
        <Dialog open={wishlistOpen} onClose={() => setWishlistOpen(false)} className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
          <div className="w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-xl p-6 mx-auto mb-0 md:mb-8 animate-fade-in-up relative z-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-xl text-purple-700 flex items-center gap-2">
                <LightBulbIcon className="h-7 w-7 text-yellow-400" /> Group Wishlist
              </h2>
              <button onClick={() => setWishlistOpen(false)} className="text-gray-400 hover:text-red-500 text-2xl font-bold">×</button>
            </div>
            {wishlistLoading ? (
              <div className="text-gray-500">Loading wishlist...</div>
            ) : wishlist.length === 0 ? (
              <div className="text-gray-500">No items in wishlist yet.</div>
            ) : (
              wishlist.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 bg-purple-50 rounded-lg p-3 shadow mb-2">
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">₹{item.price}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => handleVoteWishlist(item.id, 1)} className="text-green-600 hover:text-green-800" title="Upvote"><HandThumbUpIcon className="h-5 w-5" /></button>
                      <span className="font-semibold text-purple-700">{item.votes || 1}</span>
                      <button onClick={() => handleVoteWishlist(item.id, -1)} className="text-red-500 hover:text-red-700" title="Remove vote"><HandThumbDownIcon className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <button onClick={() => handleAddToCart(item)} className="p-2 text-pink-500 hover:bg-pink-100 rounded-full transition-colors" title="Add to cart"><span className="text-lg">＋</span></button>
                  <button onClick={() => handleRemoveFromWishlist(item.id)} className="ml-1 text-gray-400 hover:text-red-500" title="Remove from wishlist">✕</button>
                </div>
              ))
            )}
            {wishlistError && <div className="text-red-500 text-xs mt-2">{wishlistError}</div>}
            {/* AI Suggestions for Wishlist */}
            <div className="mt-4">
              <div className="font-semibold text-purple-600 mb-2 flex items-center gap-1"><LightBulbIcon className="h-5 w-5 text-yellow-400" /> AI Suggestions for Wishlist</div>
              {aiWishlistSuggestions.length === 0 ? (
                <div className="text-gray-400 text-sm">No new suggestions right now.</div>
              ) : (
                aiWishlistSuggestions.map((product, idx) => (
                  <div key={product.id} className="flex items-center gap-3 bg-pink-50 rounded-lg p-3 shadow mb-2">
                    <img src={product.image} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">₹{product.price}</div>
                    </div>
                    <button onClick={() => handleAddToWishlist(product)} className="p-2 text-purple-500 hover:bg-purple-100 rounded-full transition-colors" title="Add to wishlist"><span className="text-lg">＋</span></button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

export default GroupRoom; 