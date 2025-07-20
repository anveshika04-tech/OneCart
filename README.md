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

## Open Source Attribution

| Name                   | Version         | License      | Role in Build                | Source Link                                      |
|------------------------|----------------|-------------|------------------------------|--------------------------------------------------|
| React                  | ^18.2.0        | MIT         | Frontend framework           | https://github.com/facebook/react                |
| Vite                   | ^4.0.0         | MIT         | Frontend build tool          | https://github.com/vitejs/vite                   |
| Tailwind CSS           | ^3.4.17        | MIT         | CSS framework                | https://github.com/tailwindlabs/tailwindcss      |
| Framer Motion          | ^10.12.16      | MIT         | UI animation                 | https://github.com/framer/motion                 |
| Heroicons              | ^2.0.18        | MIT         | UI icons                     | https://github.com/tailwindlabs/heroicons        |
| @headlessui/react      | ^2.2.4         | MIT         | UI components                | https://github.com/tailwindlabs/headlessui       |
| Socket.IO (client)     | ^4.7.2         | MIT         | Real-time frontend comms     | https://github.com/socketio/socket.io-client     |
| Socket.IO (server)     | ^4.8.1         | MIT         | Real-time backend comms      | https://github.com/socketio/socket.io            |
| Express                | ^5.1.0         | MIT         | Backend web server           | https://github.com/expressjs/express             |
| CORS                   | ^2.8.5         | MIT         | CORS middleware              | https://github.com/expressjs/cors                |
| dotenv                 | ^17.2.0        | MIT         | Env variable loader          | https://github.com/motdotla/dotenv               |
| bcryptjs               | ^3.0.2         | MIT         | Password hashing             | https://github.com/dcodeIO/bcrypt.js             |
| jsonwebtoken           | ^9.0.2         | MIT         | JWT auth                     | https://github.com/auth0/node-jsonwebtoken       |
| axios                  | ^1.10.0        | MIT         | HTTP client                  | https://github.com/axios/axios                   |
| Python (Flask)         | >=2.0          | BSD         | AI/translation microservices | https://github.com/pallets/flask                 |
| transformers           | >=4.0          | Apache 2.0  | AI models (Python)           | https://github.com/huggingface/transformers      |
| torch                  | >=1.0          | BSD         | AI models (Python)           | https://github.com/pytorch/pytorch               |
| sentence-transformers  | >=2.0          | Apache 2.0  | Semantic search (Python)     | https://github.com/UKPLab/sentence-transformers  |
| serve                  | ^14.2.0        | MIT         | Static file serving          | https://github.com/vercel/serve                  |
| @vitejs/plugin-react   | ^4.7.0         | MIT         | React plugin for Vite        | https://github.com/vitejs/vite-plugin-react      |
| autoprefixer           | ^10.4.21       | MIT         | CSS post-processing          | https://github.com/postcss/autoprefixer          |
| postcss                | ^8.5.6         | MIT         | CSS post-processing          | https://github.com/postcss/postcss               |
| @tailwindcss/forms     | ^0.5.10        | MIT         | Tailwind plugin              | https://github.com/tailwindlabs/tailwindcss-forms|
| @tailwindcss/typography| ^0.5.16        | MIT         | Tailwind plugin              | https://github.com/tailwindlabs/tailwindcss-typography|
| @tailwindcss/aspect-ratio| ^0.4.2      | MIT         | Tailwind plugin              | https://github.com/tailwindlabs/tailwindcss-aspect-ratio|
| eslint                 | ^9.31.0        | MIT         | Linting                      | https://github.com/eslint/eslint                 |
| @eslint/js             | ^9.31.0        | MIT         | Linting config               | https://github.com/eslint/js                     |
| eslint-plugin-react-hooks| ^5.2.0       | MIT         | Linting                      | https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks |
| eslint-plugin-react-refresh| ^0.4.20    | MIT         | Linting                      | https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-refresh |
| globals                | ^16.3.0        | MIT         | Linting                      | https://github.com/sindresorhus/globals          |

> All libraries are used via direct integration unless otherwise noted. No code from these libraries has been modified unless stated in the codebase.

## License
[MIT](LICENSE)
