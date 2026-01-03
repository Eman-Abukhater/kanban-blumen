import { PropsWithChildren, useState } from "react";
import { DropResult } from "react-beautiful-dnd";
import { KanbanBoardState, KanbanCard } from "../components/kanban/KanbanTypes";

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

import { useOnDragEndCard } from "@/services/kanbanApi";
import { toast } from "react-toastify";
import { HubConnection } from "@microsoft/signalr";
import { debounceWithCardId } from "@/utility/debounce";

export interface IAppProps extends PropsWithChildren {}

export function KanbanContextComponent(props: IAppProps) {
  const { children } = props;

  const [userInfo, setUserInfo] = useState<any>();

  const [signalRConnection, setConnection] = useState<HubConnection | undefined>();
  const [onlineUsers, setOnlineUsers] = useState<any>([]);

  const [kanbanState, setKanbanState] = useLocalStorage<KanbanBoardState>(
    "kanban-state",
    defaultKanbanBoardState
  );

  const [modalState, setModalState] = useState<ModalContextState>(
    defaultModalContextState
  );

  const handleCreateList = (
    title: string,
    kanbanListId: number,
    seqNo: number,
    fkBoardId: number
  ) => {
    const tempList = [...kanbanState];
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
    const tempList = [...kanbanState];
    tempList.splice(listIndex, 1);
    setKanbanState(tempList);
  };

  const handleRenameList = (listIndex: number, title: string) => {
    const tempList = [...kanbanState];
    if (!tempList[listIndex]) return;
    tempList[listIndex].title = title;
    setKanbanState(tempList);
  };

  const setKanbanListState = (KanbanList: KanbanBoardState) => {
    setKanbanState(KanbanList);
  };

  const handleCreateCard = (
    listIndex: number,
    title: string,
    kanbanCardId: number,
    seqNo: number,
    fkKanbanListId: number
  ) => {
    const tempList = [...kanbanState];
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
    const tempList = [...kanbanState];
    tempList[listIndex].kanbanCards.splice(cardIndex, 1);
    setKanbanState(tempList);
  };

  const handleUpdateCard = (
    listIndex: number,
    cardIndex: number,
    updatedCard: KanbanCard
  ) => {
    const tempList = [...kanbanState];
    tempList[listIndex].kanbanCards[cardIndex] = updatedCard;
    setKanbanState(tempList);
  };

  let lastCardId: number | null = null;

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
      toast.success(` ${customResponse?.data} `, {
        position: toast.POSITION.TOP_CENTER,
      });
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

    //###### LIST  #########
    if (type === "all-lists") {
      const tempBoard = [...kanbanState];
      const draggedBoard = tempBoard[source.index];
      const draggedListSeqNo = draggedBoard.seqNo;
      const fkBoardId = draggedBoard.fkBoardId;

      const destListSeqNo = tempBoard[destination.index].seqNo;

      if (draggedListSeqNo < destListSeqNo) {
        const minSeqNo = draggedListSeqNo;
        const maxSeqNo = destListSeqNo;

        for (let i = 0; i < tempBoard.length; i++) {
          const item = tempBoard[i];
          if (
            item.seqNo > minSeqNo &&
            item.seqNo <= maxSeqNo &&
            item.fkBoardId === fkBoardId
          ) {
            item.seqNo--;
          }
        }
      } else if (draggedListSeqNo > destListSeqNo) {
        const minSeqNo = destListSeqNo;
        const maxSeqNo = draggedListSeqNo;

        for (let i = 0; i < tempBoard.length; i++) {
          const item = tempBoard[i];
          if (
            item.seqNo >= minSeqNo &&
            item.seqNo < maxSeqNo &&
            item.fkBoardId === fkBoardId
          ) {
            item.seqNo++;
          }
        }
      }

      draggedBoard.seqNo = destListSeqNo;

      tempBoard.splice(source.index, 1);
      tempBoard.splice(destination.index, 0, draggedBoard);
      setKanbanState(tempBoard);
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

        if (lastCardId === kanbanCardId) teardown();
        lastCardId = kanbanCardId;

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

        if (lastCardId === kanbanCardId) teardown();
        lastCardId = kanbanCardId;

        debouncedFunc({}, kanbanCardId);
      }
    }
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, type: null, modalProps: null });
  };

  const handleSetUserInfo = (user: any) => {
    setUserInfo(user);
  };

  const setSignalRConnection = (SignalRConnection: HubConnection | undefined) => {
    setConnection(SignalRConnection);
  };

  const setUsersOnline = (onlineUsesr: any) => {
    setOnlineUsers(onlineUsesr);
  };

const handleOpenModal = (payload: hanbleOpenModalProps) => {
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
};


  // ✅ لازم تقبل userInfo عشان ListMenu بمررها
  const handleClearList = (listid: number, _userInfo: any) => {
    const idx = kanbanState.findIndex((l) => l.kanbanListId === listid);

    if (idx === -1) {
      toast.error("List not found");
      return;
    }

    const copy = [...kanbanState];
    copy[idx] = { ...copy[idx], kanbanCards: [] };

    setKanbanState(copy);

    toast.success("List cleared", { position: toast.POSITION.TOP_CENTER });
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

    return null;
  };

  return (
    <KanbanContextProvider
      value={{
        kanbanState,
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
