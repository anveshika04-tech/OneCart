import { io } from "socket.io-client";

// Use deployed backend for production, fallback to localhost for local dev
const socket = io(import.meta.env.VITE_SOCKET_URL);

export default socket; 