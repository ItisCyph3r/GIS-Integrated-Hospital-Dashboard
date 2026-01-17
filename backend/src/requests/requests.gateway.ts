import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { EmergencyRequest } from './entities/request.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/requests',
})
export class RequestsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RequestsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to requests: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from requests: ${client.id}`);
  }

  // Broadcast when new request created
  broadcastRequestCreated(request: EmergencyRequest) {
    this.server.emit('request:created', {
      requestId: request.id,
      userLocation: request.userLocation,
      hospitalId: request.hospitalId,
      status: request.status,
      createdAt: request.createdAt,
    });
    this.logger.log(`Broadcasting request created: ${request.id}`);
  }

  broadcastRequestAccepted(request: EmergencyRequest) {
    this.notifyRequestAccepted(request);
  }

  // Notify user when request accepted
  notifyRequestAccepted(request: EmergencyRequest) {
    this.server.emit('request:accepted', {
      requestId: request.id,
      ambulanceId: request.ambulanceId,
      status: request.status,
      acceptedAt: request.acceptedAt,
    });
    this.logger.log(`Request ${request.id} accepted`);
  }

  // Notify when status changes
  broadcastStatusChange(request: EmergencyRequest) {
    this.server.emit('request:status', {
      requestId: request.id,
      status: request.status,
      updatedAt: request.updatedAt,
    });
    this.logger.log(`Request ${request.id} status: ${request.status}`);
  }

  // Notify when request cancelled
  broadcastRequestCancelled(requestId: number) {
    this.server.emit('request:cancelled', {
      requestId,
      cancelledAt: new Date(),
    });
    this.logger.log(`Request ${requestId} cancelled`);
  }

  // Notify when request completed
  broadcastRequestCompleted(request: EmergencyRequest) {
    this.server.emit('request:completed', {
      requestId: request.id,
      completedAt: request.completedAt,
    });
    this.logger.log(`Request ${request.id} completed`);
  }
}
