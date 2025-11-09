"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
// In-memory store for connected users (in production, use Redis)
const connectedUsers = new Map();
const boardUsers = new Map(); // boardId -> Set of socketIds
const setupSocketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);
        // Handle user joining a board group
        socket.on('JoinBoardGroup', async (data) => {
            try {
                const { fkpoid, userid, username, userPic } = data;
                const projectId = parseInt(fkpoid);
                const userId = parseInt(userid);
                // Store user info
                const user = {
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
                boardUsers.get(projectId).add(socket.id);
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
            }
            catch (error) {
                console.error('Error in JoinBoardGroup:', error);
                socket.emit('error', { message: 'Failed to join board group' });
            }
        });
        // Handle user joining a specific board
        socket.on('JoinBoard', async (data) => {
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
            }
            catch (error) {
                console.error('Error in JoinBoard:', error);
                socket.emit('error', { message: 'Failed to join board' });
            }
        });
        // Handle real-time updates for kanban operations
        socket.on('KanbanUpdate', (data) => {
            try {
                const { type, projectId, boardId, message, data: updateData } = data;
                const user = connectedUsers.get(socket.id);
                if (!user)
                    return;
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
            }
            catch (error) {
                console.error('Error in KanbanUpdate:', error);
            }
        });
        // Handle board list updates
        socket.on('BoardListUpdate', (data) => {
            try {
                const { projectId, message } = data;
                const user = connectedUsers.get(socket.id);
                if (!user)
                    return;
                // Emit to project room
                socket.to(`project_${projectId}`).emit('addEditBoard', message);
                console.log(`Board list update by ${user.username} in project ${projectId}`);
            }
            catch (error) {
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
                        boardUsers.get(projectId).delete(socket.id);
                        // If no more users in the project, clean up
                        if (boardUsers.get(projectId).size === 0) {
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
            }
            catch (error) {
                console.error('Error in disconnect handler:', error);
            }
        });
        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });
    // Utility function to get online users for a project
    io.getOnlineUsers = (projectId) => {
        return Array.from(connectedUsers.values())
            .filter(user => user.projectId === projectId)
            .map(user => ({
            userid: user.userId,
            username: user.username,
            userPic: user.userPic
        }));
    };
    // Utility function to emit to project
    io.emitToProject = (projectId, event, data) => {
        io.to(`project_${projectId}`).emit(event, data);
    };
    // Utility function to emit to board
    io.emitToBoard = (boardId, event, data) => {
        io.to(`board_${boardId}`).emit(event, data);
    };
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=socketHandlers.js.map