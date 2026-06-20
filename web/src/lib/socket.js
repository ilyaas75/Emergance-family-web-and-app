import { io } from 'socket.io-client';
import { tokens } from './api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let socket = null;

export function connectSocket() {
  if (socket) return socket;
  socket = io(SOCKET_URL, { auth: { token: tokens.access }, autoConnect: true });
  return socket;
}
export function getSocket() { return socket; }
export function disconnectSocket() { if (socket) { socket.disconnect(); socket = null; } }
