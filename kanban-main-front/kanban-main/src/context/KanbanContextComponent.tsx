import { PropsWithChildren, useState, useMemo, useCallback, useRef,useEffect } from "react";
import { DropResult } from "react-beautiful-dnd";
import { KanbanBoardState, KanbanCard } from "../components/kanban/KanbanTypes";
import { ClearListModal } from "../components/modal/ClearListModal";
import { CardModal } from "../components/modal/CardModal";
import { DeleteListModal } from "../components/modal/DeleteListModal";
import RenameListModal from "../components/modal/RenameListModal";
import useLocalStorage from "../hooks/useLocalStorage";
import { s4 } from "../utility/uuidGenerator";
import {
  defaultKanbanBoardState,
  defaultModalContextState,
  KanbanContextProvider,
} from "./kanbanContext";
import { hanbleOpenModalProps, ModalContextState } from "./KanbanContextTypes";
import { SaveListsOrder } from "@/services/kanbanApi";
import { useOnDragEndCard } from "@/services/kanbanApi";
import { toast } from "react-toastify";
import { HubConnection } from "@microsoft/signalr";
import { debounceWithCardId } from "@/utility/debounce";
import { ClearKanbanList } from "@/services/kanbanApi";
export interface IAppProps extends PropsWithChildren { }

export function KanbanContextComponent(props: IAppProps) {
  const { children } = props;

  const [userInfo, setUserInfo] = useState<any>();
  useEffect(() => {
  if (typeof window === "undefined") return;

  try {
    const stored = window.sessionStorage.getItem("userData");
    if (stored) {
      setUserInfo(JSON.parse(stored));
    }
  } catch {
    // ignore sessionStorage parse errors
  }
}, []);

  const [signalRConnection, setConnection] = useState<HubConnection | undefined>();
  const [onlineUsers, setOnlineUsers] = useState<any>([]);

  const [kanbanState, setKanbanState] = useLocalStorage<KanbanBoardState>(
    "kanban-state",
    defaultKanbanBoardState
  );
  const safeKanbanState = useMemo(() => {
    return (Array.isArray(kanbanState) ? kanbanState : [])
      .filter(Boolean)
      .map((l: any) => ({
        ...l,
        kanbanCards: Array.isArray(l?.kanbanCards) ? l.kanbanCards : [],
      }));
  }, [kanbanState]);


  const [modalState, setModalState] = useState<ModalContextState>(
    defaultModalContextState
  );

  const handleCreateList = (
    title: string,
    kanbanListId: number,
    seqNo: number,
    fkBoardId: number
  ) => {
    const tempList = [...safeKanbanState];
    tempList.push({
      kanbanListId,
      id: s4(),
      title,
      kanbanCards: [],
      fkBoardId,
      seqNo,
      createdAt: new Date(),
      addedBy: "",
    });
    setKanbanState(tempList);
  };

  const handleDeleteList = (listIndex: number) => {
    const tempList = [...safeKanbanState];
    tempList.splice(listIndex, 1);
    setKanbanState(tempList);
  };

  const handleRenameList = (listIndex: number, title: string) => {
    const tempList = [...safeKanbanState];
    if (!tempList[listIndex]) return;
    tempList[listIndex].title = title;
    setKanbanState(tempList);
  };

const setKanbanListState = useCallback((KanbanList: KanbanBoardState) => {
  setKanbanState(KanbanList);
}, [setKanbanState]);

  const handleCreateCard = (
    listIndex: number,
    title: string,
    kanbanCardId: number,
    seqNo: number,
    fkKanbanListId: number
  ) => {
    const tempList = [...safeKanbanState];
    tempList[listIndex].kanbanCards.push({
      kanbanCardId,
      id: s4(),
      title,
      desc: title,
      completed: false,
      kanbanTasks: [],
      kanbanTags: [],
      date: null,
      fkKanbanListId,
      seqNo,
      createdAt: new Date(),
      addedBy: "",
      startDate: new Date(),
      endDate: new Date(),
    });
    setKanbanListState(tempList);
  };

  const handleDeleteCard = (listIndex: number, cardIndex: number) => {
    const tempList = [...safeKanbanState];
    tempList[listIndex].kanbanCards.splice(cardIndex, 1);
    setKanbanState(tempList);
  };

  const handleUpdateCard = (
    listIndex: number,
    cardIndex: number,
    updatedCard: KanbanCard
  ) => {
    const tempList = [...safeKanbanState];
    tempList[listIndex].kanbanCards[cardIndex] = updatedCard;
    setKanbanState(tempList);
  };

  const lastCardIdRef = useRef<number | null>(null);
  async function updateCardPosition(
    SourceListId: number,
    DestinationListId: number,
    kanbanCardId: number,
    cardTitle: string,
    oldSeqNo: number,
    newSeqNo: number
  ) {
    const customResponse = await useOnDragEndCard(
      SourceListId,
      DestinationListId,
      kanbanCardId,
      cardTitle,
      userInfo.username,
      oldSeqNo,
      newSeqNo,
      userInfo.fkboardid,
      userInfo.fkpoid
    );
    if (customResponse?.status === 200) {
      return;
    } else {
      toast.error(
        `something went wrong, could not save the changes for swapped Lists`,
        { position: toast.POSITION.TOP_CENTER }
      );
    }
  }

  const handleDragEnd = async (dropResult: DropResult) => {
    const { source, destination, type } = dropResult;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    //###### LIST (COLUMNS) #########
    if (type === "all-lists") {
      // ✅ Guard: need userInfo to save
      if (!userInfo?.username || !userInfo?.fkpoid) {
        toast.error("User info missing - cannot save list order", {
          position: toast.POSITION.TOP_CENTER,
        });
        return;
      }

      // ✅ copy
      const tempBoard = [...kanbanState];

      // ✅ move dragged list by index (this is the real order in UI)
      const [moved] = tempBoard.splice(source.index, 1);
      tempBoard.splice(destination.index, 0, moved);

      // ✅ normalize seqNo for THIS board lists only (1..N)
      const fkBoardId = moved.fkBoardId;
      const boardLists = tempBoard.filter((l) => l.fkBoardId === fkBoardId);

      boardLists.forEach((l, idx) => {
        l.seqNo = idx + 1;
      });

      // ✅ update UI immediately
      setKanbanState(tempBoard);

      // ✅ persist order in DB
      try {
        const listsPayload = boardLists.map((l) => ({
          listid: Number(l.kanbanListId), // ✅ DB id
          seqNo: Number(l.seqNo),
        }));

        await SaveListsOrder({
          fkboardid: Number(fkBoardId),
          fkpoid: Number(userInfo.fkpoid),
          updatedby: userInfo.username,
          lists: listsPayload,
        });

        // optional success toast
        // toast.success("Lists order saved", { position: toast.POSITION.TOP_CENTER });
      } catch (e: any) {
        console.error("SaveListsOrder error:", e?.response?.data || e);
        toast.error(
          e?.response?.data?.error ||
          e?.response?.data?.message ||
          e?.message ||
          "Failed to save list order",
          { position: toast.POSITION.TOP_CENTER }
        );
      }

      return;
    }

    let SourceListId = 0;
    let DestinationListId = 0;
    let kanbanCardId = 0;
    let oldSeqNo = 0;
    let newSeqNo = 0;

    // Handle card reordering logic
    if (source.droppableId === destination.droppableId) {
      const listIndex = kanbanState.findIndex(
        (list) => list.id === source.droppableId
      );

      if (listIndex !== -1) {
        const updatedList = { ...kanbanState[listIndex] };

        SourceListId = updatedList.kanbanListId;
        DestinationListId = updatedList.kanbanListId;

        const [draggedCard] = updatedList.kanbanCards.splice(source.index, 1);
        oldSeqNo = draggedCard.seqNo;

        updatedList.kanbanCards.splice(destination.index, 0, draggedCard);

        updatedList.kanbanCards.forEach((card, index) => {
          card.seqNo = index + 1;
        });

        const updatedKanbanState = [...kanbanState];
        updatedKanbanState[listIndex] = updatedList;
        setKanbanState(updatedKanbanState);

        kanbanCardId = draggedCard.kanbanCardId;
        newSeqNo = draggedCard.seqNo;
        const cardTitle = draggedCard.title;

        const [debouncedFunc, teardown] = debounceWithCardId(
          async () => {
            updateCardPosition(
              SourceListId,
              DestinationListId,
              kanbanCardId,
              cardTitle,
              oldSeqNo,
              newSeqNo
            );
          },
          2000
        );

        if (lastCardIdRef.current === kanbanCardId) teardown();
        lastCardIdRef.current = kanbanCardId;

        debouncedFunc({}, kanbanCardId);
      }
    } else {
      const sourceListIndex = kanbanState.findIndex(
        (list) => list.id === source.droppableId
      );

      const destinationListIndex = kanbanState.findIndex(
        (list) => list.id === destination.droppableId
      );

      if (sourceListIndex !== -1 && destinationListIndex !== -1) {
        const sourceList = { ...kanbanState[sourceListIndex] };
        const destinationList = { ...kanbanState[destinationListIndex] };

        SourceListId = sourceList.kanbanListId;
        DestinationListId = destinationList.kanbanListId;

        const [draggedCard] = sourceList.kanbanCards.splice(source.index, 1);
        oldSeqNo = draggedCard.seqNo;

        destinationList.kanbanCards.splice(destination.index, 0, draggedCard);

        sourceList.kanbanCards.forEach((card, index) => {
          card.seqNo = index + 1;
        });
        destinationList.kanbanCards.forEach((card, index) => {
          card.seqNo = index + 1;
        });

        const updatedKanbanState = [...kanbanState];
        updatedKanbanState[sourceListIndex] = sourceList;
        updatedKanbanState[destinationListIndex] = destinationList;
        setKanbanState(updatedKanbanState);

        kanbanCardId = draggedCard.kanbanCardId;
        newSeqNo = draggedCard.seqNo;
        const cardTitle = draggedCard.title;

        const [debouncedFunc, teardown] = debounceWithCardId(
          async () => {
            updateCardPosition(
              SourceListId,
              DestinationListId,
              kanbanCardId,
              cardTitle,
              oldSeqNo,
              newSeqNo
            );
          },
          2000
        );

        if (lastCardIdRef.current === kanbanCardId) teardown();
        lastCardIdRef.current = kanbanCardId;

        debouncedFunc({}, kanbanCardId);
      }
    }
  };
  const handleCloseModal = useCallback(() => {
    setModalState({ isOpen: false, type: null, modalProps: null });
  }, []);

  const handleSetUserInfo = useCallback((user: any) => {
    setUserInfo(user);
  }, []);

  const setSignalRConnection = useCallback((SignalRConnection: HubConnection | undefined) => {
    setConnection(SignalRConnection);
  }, []);

  const setUsersOnline = useCallback((onlineUsesr: any) => {
    setOnlineUsers(onlineUsesr);
  }, []);

 const handleOpenModal = useCallback((payload: hanbleOpenModalProps) => {
  if (payload.type === "DELETE_LIST") {
    setModalState({
      isOpen: true,
      type: "DELETE_LIST",
      modalProps: payload.modalProps,
    });
    return;
  }

  if (payload.type === "UPDATE_CARD") {
    setModalState({
      isOpen: true,
      type: "UPDATE_CARD",
      modalProps: payload.modalProps,
    });
    return;
  }

  if (payload.type === "RENAME_LIST") {
    setModalState({
      isOpen: true,
      type: "RENAME_LIST",
      modalProps: payload.modalProps,
    });
    return;
  }

  if (payload.type === "CLEAR_LIST") {
    setModalState({
      isOpen: true,
      type: "CLEAR_LIST",
      modalProps: payload.modalProps,
    });
    return;
  }
}, []);


  // ✅ Clear all cards in a list (by listIndex - always matches kanbanState UI order)
  const handleClearList = async (listid: number, _userInfo: any) => {
    const id = Number(listid);

    if (!userInfo?.fkpoid || !userInfo?.username) {
      toast.error("Missing user info", { position: toast.POSITION.TOP_CENTER });
      return;
    }

    // ✅ 1) Optimistic UI: clear immediately
    setKanbanState((prev) => {
      const idx = prev.findIndex((l) => Number(l.kanbanListId) === id);
      if (idx === -1) return prev;

      const next = [...prev];
      next[idx] = { ...next[idx], kanbanCards: [] };
      return next;
    });

    // ✅ 2) Persist in DB (THIS is what triggers Network tab)
    try {
      const res = await ClearKanbanList(id, Number(userInfo.fkpoid), userInfo.username);

      if (res?.status === 200) {
        return;
      }

      toast.error("Failed to clear list", { position: toast.POSITION.TOP_CENTER });
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Failed to clear list", {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };
  const renderModal = (state: ModalContextState) => {
    if (!state.isOpen) return null;

    if (state.type === "DELETE_LIST") {
      return <DeleteListModal {...state.modalProps} />;
    }

    if (state.type === "UPDATE_CARD") {
      return <CardModal {...state.modalProps} />;
    }

    if (state.type === "RENAME_LIST") {
      return <RenameListModal {...state.modalProps} />;
    }

    if (state.type === "CLEAR_LIST") {
      return <ClearListModal {...state.modalProps} />;
    }

    return null;
  };

  return (
    <KanbanContextProvider
      value={{
        kanbanState: safeKanbanState,
        userInfo,
        signalRConnection,
        onlineUsers,
        modalState,
        handleCreateList,
        handleCreateCard,
        handleRenameList,
        handleDeleteList,
        handleDeleteCard,
        handleUpdateCard,
        handleDragEnd,
        handleOpenModal,
        handleCloseModal,
        setKanbanListState,
        handleSetUserInfo,
        setSignalRConnection,
        setUsersOnline,
        handleClearList,
      }}
    >
      {renderModal(modalState)}
      {children}
    </KanbanContextProvider>
  );
}
