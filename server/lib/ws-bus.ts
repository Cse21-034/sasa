import { WebSocket } from 'ws';

class WsBus {
  private clients = new Map<string, WebSocket>();

  /** Called once from registerRoutes after the WebSocket server creates the clients map */
  setClients(clients: Map<string, WebSocket>) {
    this.clients = clients;
  }

  /** Send a typed event to one specific connected user */
  sendToUser(userId: string, type: string, payload: object = {}) {
    const ws = this.clients.get(userId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  }

  /** Send a typed event to every connected client */
  broadcast(type: string, payload: object = {}) {
    const message = JSON.stringify({ type, payload });
    this.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }
}

export const wsBus = new WsBus();
