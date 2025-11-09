import { Server } from 'socket.io';
export declare const setupSocketHandlers: (io: Server) => void;
declare module 'socket.io' {
    interface Server {
        getOnlineUsers(projectId: number): Array<{
            userid: number;
            username: string;
            userPic?: string;
        }>;
        emitToProject(projectId: number, event: string, data: any): void;
        emitToBoard(boardId: number, event: string, data: any): void;
    }
}
//# sourceMappingURL=socketHandlers.d.ts.map