import { Request } from 'express';
export interface AuthUser {
    id: number;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    userPic?: string;
}
export interface AuthRequest extends Request {
    user?: AuthUser;
}
export interface JWTPayload {
    userId: number;
    iat?: number;
    exp?: number;
}
export interface ProjectMemberWithUser {
    id: number;
    role: string;
    user: {
        id: number;
        username: string;
        email: string;
        userPic?: string;
    };
}
export interface KanbanListWithCards {
    id: number;
    title: string;
    seqNo: number;
    cards: KanbanCardWithDetails[];
}
export interface KanbanCardWithDetails {
    id: number;
    title: string;
    description?: string;
    imageUrl?: string;
    completed: boolean;
    startDate?: Date;
    endDate?: Date;
    seqNo: number;
    tags: Array<{
        id: number;
        title: string;
        color: string;
    }>;
    tasks: Array<{
        id: number;
        title: string;
        completed: boolean;
        fileUrl?: string;
        assignments: Array<{
            user: {
                id: number;
                username: string;
            };
        }>;
    }>;
}
export interface SocketUser {
    userId: number;
    username: string;
    userPic?: string;
    socketId: string;
    projectId?: number;
    boardId?: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface AuthResponse {
    success: boolean;
    data: {
        user: AuthUser;
        token: string;
    };
}
export interface EnvConfig {
    PORT: string;
    NODE_ENV: string;
    DATABASE_URL: string;
    JWT_SECRET: string;
    JWT_EXPIRES_IN: string;
    CLOUDINARY_CLOUD_NAME: string;
    CLOUDINARY_API_KEY: string;
    CLOUDINARY_API_SECRET: string;
    FRONTEND_URL: string;
    MAX_FILE_SIZE: string;
    UPLOAD_PATH: string;
}
//# sourceMappingURL=index.d.ts.map