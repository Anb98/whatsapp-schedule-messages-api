import { DefaultEventsMap, Socket, Server as SocketIOServer } from "socket.io";
import { Server } from "http";

export class SocketService {
  private io: SocketIOServer;
  private onConnection: (
    socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
  ) => void = () => {};

  constructor(server: Server) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    this.io.on("connection", (socket) => {
      if (this.onConnection) {
        this.onConnection(socket);
      }
    });
  }

  public emit(event: string, data: any) {
    this.io.emit(event, data);
  }

  public emitOnConnection(event: string, data: any) {
    this.onConnection = (socket) => socket.emit(event, data);
  }
}
