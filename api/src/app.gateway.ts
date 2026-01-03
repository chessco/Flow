import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('AppGateway');

    handleConnection(client: Socket) {
        const tenantId = client.handshake.headers['x-tenant-id'] as string;
        if (tenantId) {
            client.join(`tenant_${tenantId}`);
            this.logger.log(`Client ${client.id} connected to tenant_${tenantId}`);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client ${client.id} disconnected`);
    }

    /**
     * Notifica a todos los clientes de un tenant sobre un nuevo mensaje.
     */
    notifyNewMessage(tenantId: string, message: any) {
        this.server.to(`tenant_${tenantId}`).emit('new_message', message);
    }

    /**
     * Notifica cambios en el estado del Kanban.
     */
    notifyKanbanUpdate(tenantId: string, update: any) {
        this.server.to(`tenant_${tenantId}`).emit('kanban_updated', update);
    }

    @SubscribeMessage('ping')
    handlePing(@ConnectedSocket() client: Socket): string {
        return 'pong';
    }
}
