import { io } from "socket.io-client";

// Use environment variable for production, fallback to localhost for local dev
const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000");

export default socket; 