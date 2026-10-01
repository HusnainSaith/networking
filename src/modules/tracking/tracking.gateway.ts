import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TechnicianLocation } from './entities/technician-location.entity';

@WebSocketGateway({
  namespace: '/tracking',
  cors: { origin: true, credentials: true },
})
export class TrackingGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const authorization = client.handshake.headers.authorization;
      const token =
        client.handshake.auth?.token ||
        (authorization?.startsWith('Bearer ')
          ? authorization.slice('Bearer '.length)
          : undefined);
      if (!token) throw new Error('Missing authentication token');
      const payload = await this.jwtService.verifyAsync(token);
      client.data.userId = payload.sub;
      await client.join('authenticated');
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('tracking:subscribe')
  subscribe(@ConnectedSocket() client: Socket): { subscribed: boolean } {
    return { subscribed: Boolean(client.data.userId) };
  }

  broadcastLocation(location: TechnicianLocation): void {
    this.server?.to('authenticated').emit('technician:location', location);
  }
}
