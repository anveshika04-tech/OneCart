import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { PaperAirplaneIcon, ShoppingCartIcon, PlusIcon, SparklesIcon } from '@heroicons/react/24/outline';
import axios from "axios";

const socket = io('http://localhost:3000');

const LOCAL_STORAGE_MESSAGES_KEY = 'chatMessages';

function App() {
  const [messages, setMessages] = useState(() => {
    // Load messages from localStorage on initial mount
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [inputMessage, setInputMessage] = useState('');
  const [username] = useState(JSON.parse(localStorage.getItem("user"))?.name || "");
  const [isJoined, setIsJoined] = useState(false);
  const [cart, setCart] = useState([]);
  const [aiStatus, setAiStatus] = useState({ initialized: false, message: '' });
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    socket.on('message', (message) => {
      console.log('Full message received:', message);
      if (message.suggestions) {
        console.log('Suggestions received:', message.suggestions);
      }
      setMessages(prev => [...prev, message]);
    });

    socket.on('cartUpdate', (updatedCart) => {
      setCart(updatedCart);
    });

    socket.on('aiStatus', (status) => {
      setAiStatus(status);
    });

    socket.on('error', (error) => {
      setError(error.message);
      setTimeout(() => setError(null), 5000);
    });

    return () => {
      socket.off('message');
      socket.off('cartUpdate');
      socket.off('aiStatus');
      socket.off('error');
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Save messages to localStorage whenever they change
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit('join', username);
      setIsJoined(true);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      socket.emit('message', { text: inputMessage, timestamp: new Date().toISOString() });
      setInputMessage('');
    }
  };

  const handleAddToCart = (product) => {
    socket.emit('addToCart', product);
  };

  const translateToEnglish = async (text) => {
    try {
      const res = await axios.post("http://localhost:5002/translate", { text });
      return res.data.translation;
    } catch (e) {
      console.error("Translation error:", e);
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
      recognitionRef.current.lang = 'hi-IN'; // Set to Hindi
      recognitionRef.current.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        // Translate Hindi to English using IndicBART microservice
        const translated = await translateToEnglish(transcript);
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

  const renderMessage = (message, index) => {
    const isAI = message.username === 'AI Assistant';
    const isUser = message.username === username;
    // Avatar logic: use first letter of username, fallback to emoji
    let avatarContent = '?';
    if (message.username && message.username.trim().length > 0) {
      avatarContent = message.username.trim()[0].toUpperCase();
    } else {
      avatarContent = '🧑';
    }

    return (
      <div key={index} className={`chat-bubble flex items-center gap-3 ${isAI ? 'chat-bubble-ai' : isUser ? 'chat-bubble-user' : 'chat-bubble-other'}`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg ${isAI ? 'bg-yellow-200 text-yellow-700' : isUser ? 'bg-blue-400 text-white' : 'bg-purple-200 text-purple-700'}`}>
          {isAI ? <SparklesIcon className="h-5 w-5" /> : avatarContent}
        </div>
        <div className="flex-1">
          <div className="font-bold flex items-center gap-2">
            {message.username}
            {isAI && <SparklesIcon className={`h-4 w-4 ${message.isAI ? 'text-yellow-400' : 'text-gray-400'}`} title={message.isAI ? 'AI-powered suggestion' : 'Keyword-based suggestion'} />}
            <span className="text-xs opacity-75 ml-2">{new Date(message.timestamp).toLocaleTimeString()}</span>
          </div>
          <div>{message.text}</div>
          {isAI && Array.isArray(message.suggestions) && message.suggestions.length > 0 && (
            <div className="mt-4 space-y-2">
              {message.suggestions[0]?.phrase && (
                <div className="text-blue-700 font-semibold mb-1">{message.suggestions[0].phrase}</div>
              )}
              {message.suggestions.map((product, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 overflow-hidden">
                      {product.image && product.image.trim().startsWith('<svg')
                        ? <span dangerouslySetInnerHTML={{ __html: product.image }} />
                        : <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      }
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-600">₹{product.price}</div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                      title="Add to cart">
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Clear chat history on logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem(LOCAL_STORAGE_MESSAGES_KEY); // Clear chat history
    setIsJoined(false);
    setMessages([]);
    window.location.reload(); // Optionally force reload to reset state
  };

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
    <div className="min-h-screen bg-gray-100 flex p-4 gap-4">
      {/* Chat Section */}
      <div className="flex-1 flex flex-col bg-white shadow-lg rounded-lg overflow-hidden">
        {/* AI Status Banner */}
        <div className={`px-4 py-2 flex items-center gap-2 text-sm ${aiStatus.initialized ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
          <SparklesIcon className="h-5 w-5" />
          {aiStatus.message || "AI-powered suggestions are active"}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-800 px-4 py-2 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="button"
            onClick={listening ? stopListening : startListening}
            className={`p-2 rounded ${listening ? 'bg-red-200' : 'bg-gray-200'} hover:bg-gray-300`}
            aria-label={listening ? 'Stop recording' : 'Start recording'}
            style={{ minWidth: 40 }}
          >
            {listening ? '🛑' : '🎤'}
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            <PaperAirplaneIcon className="h-6 w-6" />
          </button>
        </form>
      </div>

      {/* Suggestions Section */}
      <div className="w-80 bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SparklesIcon className="h-6 w-6" />
            AI Suggestions
          </h2>
        </div>
        <div className="p-4 space-y-4 max-h-[40vh] overflow-y-auto">
          {messages
            .filter(msg => msg.suggestions)
            .map((message, index) => (
              <div key={index} className="space-y-2">
                <div className="text-sm text-gray-500">{new Date(message.timestamp).toLocaleTimeString()}</div>
                {/* Show phrase if present on the first suggestion */}
                {message.suggestions[0] && message.suggestions[0].phrase && (
                  <div className="text-blue-700 font-semibold mb-1">{message.suggestions[0].phrase}</div>
                )}
                {message.suggestions.map((product, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-400 overflow-hidden">
                        {product.image && product.image.trim().startsWith('<svg')
                          ? <span dangerouslySetInnerHTML={{ __html: product.image }} />
                          : <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        }
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-600">₹{product.price}</div>
                      </div>
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                        title="Add to cart">
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-80 bg-white shadow-lg p-4 flex flex-col rounded-lg">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ShoppingCartIcon className="h-6 w-6" />
          Shared Cart
        </h2>
        <div className="flex-1 overflow-y-auto">
          {cart.map((item) => (
            <div key={item.id + '-' + item.addedBy} className="border-b py-2 flex items-center justify-between">
              <div>
              <div className="font-medium">{item.name}</div>
                <div className="text-gray-600">
                  ₹{item.price * item.quantity}
                </div>
                {item.addedBy && (
                  <div className="text-xs text-gray-400">Added by: {item.addedBy}</div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => socket.emit('decrementCartItem', item.id, item.addedBy)}
                  className="w-8 h-8 flex items-center justify-center text-lg text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 border border-gray-300"
                  title="Decrease quantity"
                  aria-label="Decrease quantity"
                >−</button>
                <span className="w-8 text-center font-semibold text-lg select-none">{item.quantity || 1}</span>
                <button
                  onClick={() => socket.emit('incrementCartItem', item.id, item.addedBy)}
                  className="w-8 h-8 flex items-center justify-center text-lg text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 border border-gray-300"
                  title="Increase quantity"
                  aria-label="Increase quantity"
                >+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="font-bold text-lg">
            Total: ₹{cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)}
          </div>
        </div>
      </div>
      <div className="flex gap-6 items-center">
        <button
          className="bg-pink-500 text-white px-4 py-2 rounded-full font-semibold shadow hover:bg-pink-600"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;
