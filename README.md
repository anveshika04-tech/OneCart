# OneCart MVP - Real-time Group Shopping Experience

OneCart is a collaborative shopping platform that combines the convenience of group chat with AI-powered shopping suggestions. Users can join shared chat rooms, discuss products, and maintain a synchronized shopping cart across all participants.

## Features

- **Real-time Group Chat**
  - WhatsApp-style messaging interface
  - User join/leave notifications
  - Message history with timestamps

- **Shared Shopping Cart**
  - Synchronized cart across all users
  - Real-time updates
  - Running total calculation

- **AI Shopping Suggestions**
  - OpenAI-powered smart product recommendations
  - Context-aware suggestions based on chat messages
  - Easy one-click add to cart
  - Intelligent product categorization
  - Fallback to keyword-based suggestions when AI is unavailable

## Tech Stack

- **Frontend**
  - React.js with Vite
  - Tailwind CSS for styling
  - Socket.IO client for real-time communication
  - Heroicons for UI icons

- **Backend**
  - Node.js with Express
  - Socket.IO for WebSocket communication
  - OpenAI GPT-3.5 for intelligent suggestions
  - CORS enabled for security
  - Environment variables for configuration

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Create a `.env` file in the project root
   - Add your OpenAI API key:
     ```env
     OPENAI_API_KEY=your_openai_api_key_here
     PORT=3000
     ```
   - Get your API key from [OpenAI Platform](https://platform.openai.com/)
   - Note: The app will fall back to keyword-based suggestions if no API key is provided

3. **Start the Backend Server**
   ```bash
   npm run server
   ```
   The server will run on http://localhost:3000

4. **Start the Frontend Development Server**
   ```bash
   npm run dev
   ```
   The development server will run on http://localhost:5173 (or next available port)

5. **Open in Browser**
   - Open the provided localhost URL in multiple browsers or tabs
   - Enter different usernames to simulate multiple users
   - Start chatting and see the AI suggestions in action

## Project Structure

```
├── server/
│   ├── index.js        # Express server & Socket.IO setup
│   └── aiService.js    # AI integration & suggestion logic
├── src/
│   ├── App.jsx        # Main React component
│   ├── index.css      # Global styles & Tailwind
│   └── main.jsx       # React entry point
├── .env              # Environment configuration
└── package.json      # Project dependencies
```

## AI Integration

The application uses OpenAI's GPT-3.5 model to provide intelligent shopping suggestions:

- **Smart Analysis**: Messages are analyzed using GPT to understand shopping context and intent
- **Category Matching**: The AI suggests relevant product categories based on conversation
- **Fallback System**: Keyword-based suggestions are used when AI is unavailable
- **Real-time Responses**: Suggestions appear naturally in the chat flow

## Future Enhancements

- Voice-to-text input using Web Speech API
- Integration with real e-commerce APIs
- Multilingual support using translation services
- User authentication and persistent chat history
- Mobile-responsive design optimizations
- Enhanced AI features with GPT-4
- Personalized product recommendations based on user history

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC License
