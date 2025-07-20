# OneCart – Group Shopping Platform

## Overview
OneCart is a next-generation group shopping platform powered by Generative AI. It enables collaborative, inclusive, and personalized online shopping for users across India. Users can create or join groups, chat in real-time, get AI-powered product suggestions, manage a shared cart, and enjoy features like wishlist, smart notifications, and voice-to-text translation.

## Features
- **Group Creation & Management:** Create, edit, delete, and join custom or themed shopping groups.
- **Real-Time Chat:** Chat with group members using Socket.IO.
- **AI-Powered Suggestions:** Get smart product recommendations based on group chat context.
- **Shared Cart:** Add, update, and manage products together in real-time.
- **Wishlist:** Group wishlist with voting and AI suggestions.
- **Smart Notifications:** AI-generated nudges and notifications.
- **Voice-to-Text & Translation:** Seamless Hindi to English chat using microservices.
- **Checkout & Address Management:** Group checkout summary and delivery address capture.
- **Modern UI:** Built with React, Vite, and Tailwind CSS for a fast, responsive experience.

## Tech Stack
- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, Heroicons
- **Backend:** Node.js, Express, Socket.IO
- **AI & Translation Microservices:** Python (Flask), HuggingFace Transformers,e5 basev2 (semantic search)
- **Deployment:** Render

## Getting Started (Local Development)

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- Python 3.8+

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd <your-repo-folder>
```

### 2. Install Node.js Dependencies
```sh
npm install
```

### 3. Install Python Dependencies (for AI/translation)
```sh
cd hindi_translate_server
pip install -r requirements.txt
cd ..
```

### 4. Start Python Microservices
In separate terminals:
```sh
# Semantic search service
cd hindi_translate_server
python semantic_search_server.py

# Translation service
python translate_server.py
```

### 5. Start the Backend
```sh
npm run server
```

### 6. Start the Frontend
```sh
npm run dev
```



## Deployment (Render)

### Frontend (Static Site)
- Create a Static Site on Render
- Build command: `npm run build`
- Publish directory: `dist`
- Set environment variables as above

### Backend (Web Service)
- Create a Web Service on Render
- Build command: `npm install`
- Start command: `npm run server`
- Set environment variables as above

### Python Microservices (Web Service)
- Create a Web Service for each Python service
- Root directory: `hindi_translate_server`
- Build command: `pip install -r requirements.txt`
- Start command: `python semantic_search_server.py` or `python translate_server.py`
- Set environment variables as needed

## About the Project
OneCart is designed to make online shopping more social, fun, and efficient. It leverages AI to provide smart suggestions, supports group decision-making, and streamlines the checkout process for groups. The platform is built with scalability and extensibility in mind, making it easy to add new features and integrations.

## Future Enhancements
- **Payment Gateway Integration:** Support for UPI, credit/debit cards, and group payment splitting.
- **Mobile App:** Native mobile apps for iOS and Android.
- **More AI Features:** Personalized deals, advanced semantic search, and GenAI-powered notifications.
- **Order Tracking:** Real-time order status and delivery tracking.
- **Social Sharing:** Deeper integration with WhatsApp, Telegram, and email invites.
- **Multi-language Support:** Expand translation and UI to more Indian languages.
- **Admin Dashboard:** Analytics and management tools for group creators and admins.


## License
[MIT](LICENSE)
