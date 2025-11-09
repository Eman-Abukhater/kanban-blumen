import { Server, Socket } from 'socket.io';
import { SocketUser } from '../types';

// In-memory store for connected users (in production, use Redis)
const connectedUsers = new Map<string, SocketUser>();
const boardUsers = new Map<number, Set<string>>(); // boardId -> Set of socketIds

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle user joining a board group
    socket.on('JoinBoardGroup', async (data: {
      fkpoid: string;
      userid: string;
      username: string;
      userPic?: string;
    }) => {
      try {
        const { fkpoid, userid, username, userPic } = data;
        const projectId = parseInt(fkpoid);
        const userId = parseInt(userid);

        // Store user info
        const user: SocketUser = {
          userId,
          username,
          userPic,
          socketId: socket.id,
          projectId
        };

        connectedUsers.set(socket.id, user);

        // Join the project room
        const roomName = `project_${projectId}`;
        await socket.join(roomName);

        // Initialize board users set if not exists
        if (!boardUsers.has(projectId)) {
          boardUsers.set(projectId, new Set());
        }
        boardUsers.get(projectId)!.add(socket.id);

        // Get all users in this project
        const projectUsers = Array.from(connectedUsers.values())
          .filter(u => u.projectId === projectId);

        // Notify all users in the project about the new user
        socket.to(roomName).emit('UserInOutMsg', `${username} joined the board`);
        
        // Send updated user list to all users in the project
        io.to(roomName).emit('UsersInBoard', projectUsers.map(u => ({
          userid: u.userId,
          username: u.username,
          userPic: u.userPic
        })));

        console.log(`User ${username} joined project ${projectId}`);
      } catch (error) {
        console.error('Error in JoinBoardGroup:', error);
        socket.emit('error', { message: 'Failed to join board group' });
      }
    });

    // Handle user joining a specific board
    socket.on('JoinBoard', async (data: { boardId: number }) => {
      try {
        const { boardId } = data;
        const user = connectedUsers.get(socket.id);
        
        if (!user) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Leave previous board room if any
        if (user.boardId) {
          socket.leave(`board_${user.boardId}`);
        }

        // Join new board room
        user.boardId = boardId;
        connectedUsers.set(socket.id, user);
        await socket.join(`board_${boardId}`);

        // Notify others in the board
        socket.to(`board_${boardId}`).emit('UserJoinedBoard', {
          username: user.username,
          userId: user.userId
        });

        console.log(`User ${user.username} joined board ${boardId}`);
      } catch (error) {
        console.error('Error in JoinBoard:', error);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Handle real-time updates for kanban operations
    socket.on('KanbanUpdate', (data: {
      type: 'list_added' | 'list_updated' | 'list_deleted' | 'card_added' | 'card_updated' | 'card_moved' | 'task_added' | 'task_updated';
      projectId: number;
      boardId: number;
      message: string;
      data?: any;
    }) => {
      try {
        const { type, projectId, boardId, message, data: updateData } = data;
        const user = connectedUsers.get(socket.id);

        if (!user) return;

        // Emit to project room
        socket.to(`project_${projectId}`).emit('ReceiveMessage', message);
        
        // Emit to board room if specific board update
        if (boardId) {
          socket.to(`board_${boardId}`).emit('BoardUpdate', {
            type,
            message,
            updatedBy: user.username,
            data: updateData,
            timestamp: new Date().toISOString()
          });
        }

        console.log(`Kanban update: ${type} by ${user.username} in board ${boardId}`);
      } catch (error) {
        console.error('Error in KanbanUpdate:', error);
      }
    });

    // Handle board list updates
    socket.on('BoardListUpdate', (data: {
      projectId: number;
      message: string;
    }) => {
      try {
        const { projectId, message } = data;
        const user = connectedUsers.get(socket.id);

        if (!user) return;

        // Emit to project room
        socket.to(`project_${projectId}`).emit('addEditBoard', message);

        console.log(`Board list update by ${user.username} in project ${projectId}`);
      } catch (error) {
        console.error('Error in BoardListUpdate:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      try {
        const user = connectedUsers.get(socket.id);
        
        if (user) {
          const { projectId, boardId, username } = user;
          
          // Remove from connected users
          connectedUsers.delete(socket.id);
          
          // Remove from board users
          if (projectId && boardUsers.has(projectId)) {
            boardUsers.get(projectId)!.delete(socket.id);
            
            // If no more users in the project, clean up
            if (boardUsers.get(projectId)!.size === 0) {
              boardUsers.delete(projectId);
            }
          }
          
          // Notify remaining users in project
          if (projectId) {
            const remainingUsers = Array.from(connectedUsers.values())
              .filter(u => u.projectId === projectId);
              
            socket.to(`project_${projectId}`).emit('UserInOutMsg', `${username} left the board`);
            socket.to(`project_${projectId}`).emit('UsersInBoard', remainingUsers.map(u => ({
              userid: u.userId,
              username: u.username,
              userPic: u.userPic
            })));
          }
          
          // Notify remaining users in board
          if (boardId) {
            socket.to(`board_${boardId}`).emit('UserLeftBoard', {
              username,
              userId: user.userId
            });
          }
          
          console.log(`User ${username} disconnected`);
        }
      } catch (error) {
        console.error('Error in disconnect handler:', error);
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Utility function to get online users for a project
  io.getOnlineUsers = (projectId: number) => {
    return Array.from(connectedUsers.values())
      .filter(user => user.projectId === projectId)
      .map(user => ({
        userid: user.userId,
        username: user.username,
        userPic: user.userPic
      }));
  };

  // Utility function to emit to project
  io.emitToProject = (projectId: number, event: string, data: any) => {
    io.to(`project_${projectId}`).emit(event, data);
  };

  // Utility function to emit to board
  io.emitToBoard = (boardId: number, event: string, data: any) => {
    io.to(`board_${boardId}`).emit(event, data);
  };
};

// Extend Socket.IO server interface
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