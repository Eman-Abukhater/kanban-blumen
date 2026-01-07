import { DropResult } from "react-beautiful-dnd";
import { KanbanBoardState, KanbanCard } from "../components/kanban/KanbanTypes";
import { CardModalProps } from "../components/modal/CardModal";
import { DeleteListModalProps } from "../components/modal/DeleteListModal";
import { RenameListModalProps } from "../components/modal/RenameListModal";
import { HubConnection } from "@microsoft/signalr/dist/esm/HubConnection";

export type ModalTypes = "DELETE_LIST" | "UPDATE_CARD" | "RENAME_LIST";

/**
 * ✅ Discriminated Union (حل مشكلة Vercel)
 */
export type ModalContextState =
  | { isOpen: false; type: null; modalProps: null }
  | { isOpen: true; type: "DELETE_LIST"; modalProps: DeleteListModalProps }
  | { isOpen: true; type: "UPDATE_CARD"; modalProps: CardModalProps }
  | { isOpen: true; type: "RENAME_LIST"; modalProps: RenameListModalProps };

/**
 * ✅ handleOpenModal payload
 */
export type hanbleOpenModalProps =
  | { type: "DELETE_LIST"; modalProps: DeleteListModalProps }
  | { type: "UPDATE_CARD"; modalProps: CardModalProps }
  | { type: "RENAME_LIST"; modalProps: RenameListModalProps };

export type KanbanContext = {
  kanbanState: KanbanBoardState;
  modalState: ModalContextState;
  userInfo: any;
  signalRConnection: HubConnection | undefined;
  onlineUsers: any;

  handleCreateList: (
    title: string,
    kanbanListId: number,
    seqNo: number,
    fkBoardId: number
  ) => void;

  handleDeleteList: (listIndex: number) => void;
  handleRenameList: (listIndex: number, title: string) => void;

  handleCreateCard: (
    listIndex: number,
    title: string,
    kanbanCardId: number,
    seqNo: number,
    fkKanbanListId: number
  ) => void;

  handleDeleteCard: (listIndex: number, cardIndex: number) => void;

  handleUpdateCard: (
    listIndex: number,
    cardIndex: number,
    updatedCard: KanbanCard
  ) => void;

  handleDragEnd: (dropResult: DropResult) => void;

  handleOpenModal: (props: hanbleOpenModalProps) => void;
  handleCloseModal: () => void;


  handleClearList: (listid: number, userInfo: any) => void;

  setKanbanListState: (KanbanList: KanbanBoardState) => void;
  handleSetUserInfo: (user: any) => void;

  setSignalRConnection: (signalRConnection: HubConnection | undefined) => void;
  setUsersOnline: (onlineUsers: any) => void;
};
