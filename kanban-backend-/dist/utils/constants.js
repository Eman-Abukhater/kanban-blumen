"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_EVENTS = exports.USER_ROLES = exports.TAG_COLORS = exports.DEFAULT_BOARD_LISTS = exports.FILE_UPLOAD_LIMITS = void 0;
exports.FILE_UPLOAD_LIMITS = {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
    ]
};
exports.DEFAULT_BOARD_LISTS = [
    { title: 'To Do', seqNo: 1 },
    { title: 'In Progress', seqNo: 2 },
    { title: 'Review', seqNo: 3 },
    { title: 'Done', seqNo: 4 }
];
exports.TAG_COLORS = [
    'bg-red-600 text-white',
    'bg-blue-600 text-white',
    'bg-green-600 text-white',
    'bg-yellow-400 text-slate-900',
    'bg-purple-600 text-white',
    'bg-teal-600 text-white',
    'bg-cyan-400 text-slate-900',
    'bg-orange-400 text-slate-900'
];
exports.USER_ROLES = {
    ADMIN: 'admin',
    MEMBER: 'member'
};
exports.SOCKET_EVENTS = {
    // Connection events
    JOIN_BOARD_GROUP: 'JoinBoardGroup',
    JOIN_BOARD: 'JoinBoard',
    USER_JOINED_BOARD: 'UserJoinedBoard',
    USER_LEFT_BOARD: 'UserLeftBoard',
    // Update events
    KANBAN_UPDATE: 'KanbanUpdate',
    BOARD_UPDATE: 'BoardUpdate',
    BOARD_LIST_UPDATE: 'BoardListUpdate',
    // Message events
    RECEIVE_MESSAGE: 'ReceiveMessage',
    USER_IN_OUT_MSG: 'UserInOutMsg',
    USERS_IN_BOARD: 'UsersInBoard',
    ADD_EDIT_BOARD: 'addEditBoard'
};
//# sourceMappingURL=constants.js.map