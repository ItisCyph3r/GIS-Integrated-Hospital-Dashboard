import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class TrackingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedClients = 0;

  handleConnection(client: Socket) {
    this.connectedClients++;
    console.log(
      `🔌 Client connected: ${client.id} (Total: ${this.connectedClients})`,
    );
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    console.log(
      `🔌 Client disconnected: ${client.id} (Total: ${this.connectedClients})`,
    );
  }

  broadcastLocationUpdate(payload: unknown) {
    void this.server.emit('ambulance:location:updated', {
      ...(payload as object),
      timestamp: Date.now(),
    });
  }

  broadcastStatusChange(payload: unknown) {
    void this.server.emit('ambulance:status:changed', {
      ...(payload as object),
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('subscribe:hospital')
  handleSubscribeHospital(client: Socket, payload: { hospitalId: number }) {
    void client.join(`hospital:${payload.hospitalId}`);
    console.log(
      `📍 Client ${client.id} subscribed to hospital ${payload.hospitalId}`,
    );
    return { success: true };
  }

  @SubscribeMessage('unsubscribe:hospital')
  handleUnsubscribeHospital(client: Socket, payload: { hospitalId: number }) {
    void client.leave(`hospital:${payload.hospitalId}`);
    console.log(
      `📍 Client ${client.id} unsubscribed from hospital ${payload.hospitalId}`,
    );
    return { success: true };
  }
}
