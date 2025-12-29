import { createContext } from "react";
import type { KanbanBoardState } from "../components/kanban/KanbanTypes";
import type {
  KanbanContext as KanbanContextType,
  ModalContextState,
} from "./KanbanContextTypes";
import type { HubConnection } from "@microsoft/signalr/dist/esm/HubConnection";

export const defaultKanbanBoardState: KanbanBoardState = [];

export const defaultModalContextState: ModalContextState = {
  isOpen: false,
  type: null,
  modalProps: null,
};

export const userInfo: any = {};

const initialContextState: KanbanContextType = {
  kanbanState: defaultKanbanBoardState,
  modalState: defaultModalContextState,
  userInfo,
  signalRConnection: undefined as HubConnection | undefined,
  onlineUsers: [],

  handleCreateList: () => {},
  handleDeleteList: () => {},
  handleRenameList: () => {},
  handleCreateCard: () => {},
  handleDeleteCard: () => {},
  handleUpdateCard: () => {},
  handleDragEnd: () => {},

  handleOpenModal: () => {},
  handleCloseModal: () => {},

  handleClearList: () => {},

  setKanbanListState: () => {},
  handleSetUserInfo: () => {},
  setSignalRConnection: () => {},
  setUsersOnline: () => {},
};

const KanbanContext = createContext<KanbanContextType>(initialContextState);

export const KanbanContextConsumer = KanbanContext.Consumer;
export const KanbanContextProvider = KanbanContext.Provider;

export default KanbanContext;
