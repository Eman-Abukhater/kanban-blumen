export declare const FILE_UPLOAD_LIMITS: {
    MAX_SIZE: number;
    ALLOWED_TYPES: string[];
};
export declare const DEFAULT_BOARD_LISTS: {
    title: string;
    seqNo: number;
}[];
export declare const TAG_COLORS: string[];
export declare const USER_ROLES: {
    readonly ADMIN: "admin";
    readonly MEMBER: "member";
};
export declare const SOCKET_EVENTS: {
    readonly JOIN_BOARD_GROUP: "JoinBoardGroup";
    readonly JOIN_BOARD: "JoinBoard";
    readonly USER_JOINED_BOARD: "UserJoinedBoard";
    readonly USER_LEFT_BOARD: "UserLeftBoard";
    readonly KANBAN_UPDATE: "KanbanUpdate";
    readonly BOARD_UPDATE: "BoardUpdate";
    readonly BOARD_LIST_UPDATE: "BoardListUpdate";
    readonly RECEIVE_MESSAGE: "ReceiveMessage";
    readonly USER_IN_OUT_MSG: "UserInOutMsg";
    readonly USERS_IN_BOARD: "UsersInBoard";
    readonly ADD_EDIT_BOARD: "addEditBoard";
};
//# sourceMappingURL=constants.d.ts.map