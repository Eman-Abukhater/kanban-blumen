// src/components/modal/CardModal.tsx
import { Fragment, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Dialog, Transition, Disclosure, Menu } from "@headlessui/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import KanbanContext from "../../context/kanbanContext";
import useAutosizeTextArea from "../../hooks/useAutosizeTextarea";
import { KanbanCard } from "../kanban/KanbanTypes";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import { CreateTagModal } from "./CreateTagModal";
import { AddTaskForm } from "../kanban/AddTaskForm";
import { classNames } from "../../utility/css";
import { useMutation } from "@tanstack/react-query";
import {
  DeleteTask,
  DeleteTag,
  AddTag,
  EditCard,
  AddTask,
  uploadImageToCloudinary,
  DeleteCard,
} from "@/services/kanbanApi";
import { toast } from "react-toastify";
import { GetCardImagePath } from "@/utility/baseUrl";
import dayjs from "dayjs";
import { DueDateModal } from "./DueDateModal";
import { useInvalidateKanban } from "@/hooks/useKanbanMutations";

export interface CardModalProps {
  listIndex: number;
  cardIndex: number;
  card: KanbanCard;
}

// ✅ Single (default) tag color — no color picking anymore
const TAG_BLUE = "bg-[#FFAB00] text-white";

export function CardModal(props: CardModalProps) {
  const descTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const invalidateKanban = useInvalidateKanban();

  const {
    handleUpdateCard,
    handleCloseModal,
    modalState,
    userInfo,
    kanbanState,
    handleDragEnd,
    handleDeleteCard,
  } = useContext(KanbanContext);

  const normalize = (s: string) => (s || "").trim().toLowerCase();

  // ✅ Status options = ALL columns titles (dynamic)
  const statusOptions = useMemo(() => {
    const titles = (kanbanState as any[])
      .map((l) => (l?.title ?? "").trim())
      .filter(Boolean);

    // keep order, remove duplicates
    const seen = new Set<string>();
    return titles.filter((t) => {
      const key = normalize(t);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [kanbanState]);

  // ✅ remember last non-done status (so when uncheck we can go back)
const lastNonDoneStatusRef = useRef<string>("");

// ✅ find the real "Done" column title from your board (case-insensitive)
const doneTitle = useMemo(() => {
  const found = statusOptions.find((t) => normalize(t) === "done");
  return found || "Done"; // fallback
}, [statusOptions]);


  const [title, setTitle] = useState<string>(props.card.title);
  const [desc, setDesc] = useState(props.card.desc);

  const [date, setDate] = useState<DateValueType | null>({
    startDate: props.card.startDate,
    endDate: props.card.endDate,
  });

  const [completed, setCompleted] = useState(props.card.completed);

  // ✅ Local position (because card can move while modal is open)
  const [currentListIndex, setCurrentListIndex] = useState(props.listIndex);
  const [currentCardIndex, setCurrentCardIndex] = useState(props.cardIndex);

  // ✅ Status shown in the dropdown button
  const [status, setStatus] = useState<string>(() => {
    const raw = ((props.card as any)?.status as string | undefined)?.trim();
    if (raw) return raw;
    return props.card.completed ? "Done" : "In progress";
  });
useEffect(() => {
  // Only sync from props if we don't already have a new uploaded url
  if (!cloudinaryUrl) {
    setImageUrl(getImageUrl(props.card.imageUrl || null));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [props.card.imageUrl]);

  // ✅ If user drags the card to another column while modal is open,
  // we detect it from kanbanState and update the status + indices immediately.
  useEffect(() => {
    const cardKey =
      (props.card as any)?.kanbanCardId ?? (props.card as any)?.id ?? props.card.id;

    let foundListIndex = -1;
    let foundCardIndex = -1;
    let foundListTitle = "";

    const lists = kanbanState as any[];

    for (let li = 0; li < lists.length; li++) {
      const cards = lists[li]?.kanbanCards ?? [];
      const ci = cards.findIndex((c: any) => {
        const k = c?.kanbanCardId ?? c?.id;
        return k === cardKey;
      });

      if (ci !== -1) {
        foundListIndex = li;
        foundCardIndex = ci;
        foundListTitle = (lists[li]?.title ?? "").trim();
        break;
      }
    }

    if (foundListIndex !== -1) {
      setCurrentListIndex(foundListIndex);
      setCurrentCardIndex(foundCardIndex);

      if (foundListTitle && normalize(foundListTitle) !== normalize(status)) {
        setStatus(foundListTitle); // ✅ updates the button text (like your screenshot)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kanbanState, props.card.kanbanCardId, props.card.id]);

  // keep completed in sync (ONLY if you literally have a column called "Done")
  useEffect(() => {
    setCompleted(normalize(status) === "done");
  }, [status]);

  const getTargetListIndexByTitle = (titleStr: string) => {
    const t = normalize(titleStr);
    return (kanbanState as any[]).findIndex((l) => normalize(l?.title) === t);
  };

  // ✅ IMMEDIATE UI MOVE when status selected from dropdown
  const moveCardOptimistic = (nextStatus: string) => {
    const targetListIndex = getTargetListIndexByTitle(nextStatus);
    if (targetListIndex < 0) return;

    // same list -> nothing to move
    if (targetListIndex === currentListIndex) return;

    const fromList: any = (kanbanState as any[])[currentListIndex];
    const toList: any = (kanbanState as any[])[targetListIndex];

    if (!fromList?.id || !toList?.id) return;

    // place at end (you can change to 0 to move to top)
    const destinationIndex = (toList?.kanbanCards?.length ?? 0);

    // Call your existing board logic (updates state immediately)
    handleDragEnd({
      draggableId: props.card.id,
      type: "DEFAULT", // must NOT be "all-lists"
      reason: "DROP",
      mode: "FLUID",
      source: { droppableId: fromList.id, index: currentCardIndex },
      destination: { droppableId: toList.id, index: destinationIndex },
      combine: null,
    } as any);

    // update local indices immediately
    setCurrentListIndex(targetListIndex);
    setCurrentCardIndex(destinationIndex);
  };

  const CardImagePath = GetCardImagePath();

  // tabs: "overview" | "subtasks"
  const [activeTab, setActiveTab] = useState<"overview" | "subtasks">("overview");
  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);

  // local priority (still saved)
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    ((props.card as any).priority as "low" | "medium" | "high") || "low"
  );

  const assigneeAvatars = [
    "/icons/Avatar_1.png",
    "/icons/Avatar_2.png",
    "/icons/Avatar_3.png",
  ];

  const isCloudinaryUrl = (url: string) =>
    url && (url.startsWith("http://") || url.startsWith("https://"));

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return "";
    if (isCloudinaryUrl(imageUrl)) return imageUrl;
    return `${CardImagePath}/${props.card.kanbanCardId}/${imageUrl}`;
  };

  const [displayImage, setImageUrl] = useState(getImageUrl(props.card.imageUrl || null));
  const [fileSizeExceeded, setFileSizeExceeded] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string>(
    isCloudinaryUrl(props.card.imageUrl || "") ? props.card.imageUrl || "" : ""
  );
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string>("");

  const [kanbanTags, setTags] = useState(props.card.kanbanTags);
  const [kanbanTasks, setTasks] = useState(props.card.kanbanTasks);
  const [openTagModal, setOpenTagModal] = useState<boolean>(false);
  const [submit, setSubmit] = useState<boolean>(false);

  // tasks loading
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);

  // tag/task loading states
  const [isCreatingTag, setIsCreatingTag] = useState<boolean>(false);
  const [isDeletingTag, setIsDeletingTag] = useState<number | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState<number | null>(null);

  const maxFileSize = 5000000;

  // keep autosize for description
  useAutosizeTextArea(descTextAreaRef, desc);

  // ================= DATE LABEL =================
  const formatDateRange = (d: DateValueType | null) => {
    if (!d?.startDate || !d?.endDate) return "—";

    const s = dayjs(d.startDate);
    const e = dayjs(d.endDate);

    const sameYear = s.year() === e.year();
    const sameMonth = s.month() === e.month();

    if (sameYear && sameMonth) {
      return `${s.format("DD")} - ${e.format("DD")} ${s.format("MMM YYYY")}`;
    }

    if (sameYear && !sameMonth) {
      return `${s.format("DD MMM")} - ${e.format("DD MMM YYYY")}`;
    }

    return `${s.format("DD MMM YYYY")} - ${e.format("DD MMM YYYY")}`;
  };

  // ================= IMAGE UPLOAD =================
const handleImageUpload = async (f: File) => {
  try {
    setUploadingImage(true);
    setFileSizeExceeded(false);

    const uploadResult = await uploadImageToCloudinary(f);

    if (uploadResult?.data?.url) {
      const url = uploadResult.data.url;
      const publicId = uploadResult.data.publicId;

      // 1) keep it in modal states
      setCloudinaryUrl(url);
      setCloudinaryPublicId(publicId);
      setImageUrl(url);

      // 2) ✅ IMPORTANT: update the card in kanban context immediately
      handleUpdateCard(currentListIndex, currentCardIndex, {
        ...props.card,
        imageUrl: url,
        imagePublicId: publicId, // (we'll fix typing below)
      });

      toast.success("Image uploaded successfully!", {
        position: toast.POSITION.TOP_CENTER,
      });

      // optional: you can invalidate after save only, not here
      // await invalidateKanban();
    }
  } catch (error: any) {
    toast.error(error.message || "Failed to upload image", {
      position: toast.POSITION.TOP_CENTER,
    });
  } finally {
    setUploadingImage(false);
  }
};


  // ================= SAVE CARD (EDIT) =================
  const mutation = useMutation({
    mutationFn: async (cardData: any) => {
      try {
        const customResponse = await EditCard(cardData);

        if (customResponse?.status === 200) {
          // ✅ update using CURRENT indices (after drag/status move)
          handleUpdateCard(currentListIndex, currentCardIndex, {
            ...props.card,
            title,
            desc,
            completed: normalize(status) === "done",
            status, // ✅ requires KanbanCard.status?: string
            imageUrl: cardData.imageUrl || props.card.imageUrl || "",
            kanbanTags,
            kanbanTasks,
            date,
            startDate: date?.startDate as Date,
            endDate: date?.endDate as Date,
            priority,
          });

          handleCloseModal();
          setSubmit(false);
          invalidateKanban();

          toast.success(`Card updated successfully!`, {
            position: toast.POSITION.TOP_CENTER,
          });
        }

        if (customResponse?.status !== 200 || customResponse?.data == null) {
          toast.error(
            `something went wrong could not Edit the Card, please try again later`,
            { position: toast.POSITION.TOP_CENTER }
          );
          setSubmit(false);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to update card", {
          position: "top-center",
        });
        setSubmit(false);
        return err.response;
      }
    },
  });

  const handleSave = () => {
    if (title === "") {
      toast.error("Title is required", { position: toast.POSITION.TOP_CENTER });
      return;
    }

    if (uploadingImage) {
      toast.info("Please wait for image upload to complete", {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }

    setSubmit(true);

    const finalImageUrl = cloudinaryUrl || props.card.imageUrl || "";

    // send fkKanbanListId for the selected status (if backend supports it)
    const targetListIndex = getTargetListIndexByTitle(status);
    const targetList: any =
      targetListIndex >= 0 ? (kanbanState as any[])[targetListIndex] : null;

    const cardData = {
      title,
      kanbanCardId: props.card.kanbanCardId,
      updatedby: userInfo.username,
      desc: desc || "....",
      imageUrl: finalImageUrl,
      imagePublicId: cloudinaryPublicId,
      completed: normalize(status) === "done",
      startDate: date?.startDate ? date.startDate.toString() : undefined,
      endDate: date?.endDate ? date.endDate.toString() : undefined,
      fkboardid: userInfo.fkboardid,
      fkpoid: userInfo.fkpoid,
      priority,
      status,
      fkKanbanListId: targetList?.kanbanListId, // safe if your API ignores unknown fields
    };

    mutation.mutate(cardData);
  };

const [deletingCard, setDeletingCard] = useState(false);

const deleteCard = async () => {
  try {
    setDeletingCard(true);

    const res = await DeleteCard(
      props.card.kanbanCardId,
      userInfo.fkpoid,
      userInfo.username
    );

    if (res?.status === 200 || res?.data?.success) {
      // ✅ 1) remove from UI immediately
      handleDeleteCard(currentListIndex, currentCardIndex);

      // ✅ 2) close modal immediately
      handleCloseModal();

      // ✅ 3) refetch in background (optional but recommended)
      invalidateKanban();

      toast.success("Card deleted successfully!", {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }

    toast.error(res?.data?.error || "Failed to delete card", {
      position: toast.POSITION.TOP_CENTER,
    });
  } catch (e: any) {
    toast.error(e?.message || "Failed to delete card", {
      position: toast.POSITION.TOP_CENTER,
    });
  } finally {
    setDeletingCard(false);
  }
};


  // ================= TAGS =================
  const handleCreateTag = async (tagName: string, _colorIndex: number) => {
    const name = (tagName || "").trim();
    if (!name) {
      toast.error(`Tag Name is Empty`, { position: toast.POSITION.TOP_CENTER });
      return;
    }

    try {
      setIsCreatingTag(true);
      const customResponse = await AddTag(
        name,
        TAG_BLUE,
        props.card.kanbanCardId,
        userInfo.username,
        userInfo.id
      );

      if (customResponse?.status === 200) {
        const newTags = [...kanbanTags];
        newTags.push({
          kanbanTagId: customResponse?.data,
          id: "",
          color: TAG_BLUE,
          title: name,
          fkKanbanCardId: props.card.kanbanCardId,
          seqNo: 1,
          createdAt: new Date(),
          addedBy: userInfo.username,
        });

        setTags(newTags);

        handleUpdateCard(currentListIndex, currentCardIndex, {
          ...props.card,
          kanbanTags: newTags,
        });

        toast.success(`Tag Created Successfully`, {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error(
          `something went wrong could not add the Tag, please try again later`,
          { position: toast.POSITION.TOP_CENTER }
        );
      }
    } finally {
      setIsCreatingTag(false);
    }
  };

  const handleDeleteTag = async (tagIndex: number, tagid: number) => {
    if (!tagid) {
      toast.error(`Tag ID is Empty`, { position: toast.POSITION.TOP_CENTER });
      return;
    }

    try {
      setIsDeletingTag(tagid);
      const customResponse = await DeleteTag(tagid);

      if (customResponse?.status === 200) {
        const newTags = [...kanbanTags];
        newTags.splice(tagIndex, 1);

        setTags(newTags);

        handleUpdateCard(currentListIndex, currentCardIndex, {
          ...props.card,
          kanbanTags: newTags,
        });

        invalidateKanban();
        toast.success(` ${customResponse?.data}`, {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error(
          `something went wrong could not Remove the Tag, please try again later`,
          { position: toast.POSITION.TOP_CENTER }
        );
      }
    } finally {
      setIsDeletingTag(null);
    }
  };

  // ================= TASKS (SUBTASKS TAB) =================
  const handleDeleteTask = async (taskIndex: number, taskid: number) => {
    if (!taskid) {
      toast.error(`Task ID is Empty`, { position: toast.POSITION.TOP_CENTER });
      return;
    }

    try {
      setIsDeletingTask(taskid);
      const customResponse = await DeleteTask(taskid);

      if (customResponse?.status === 200) {
        const tempTask = [...kanbanTasks];
        tempTask.splice(taskIndex, 1);

        setTasks(tempTask);

        handleUpdateCard(currentListIndex, currentCardIndex, {
          ...props.card,
          kanbanTasks: tempTask,
        });

        invalidateKanban();

        toast.success(` ${customResponse?.data}`, {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error(
          `something went wrong could not Remove the Task, please try again later`,
          { position: toast.POSITION.TOP_CENTER }
        );
      }
    } finally {
      setIsDeletingTask(null);
    }
  };

  const handleCreateTask = async (taskTitle: string, selectedOptions: any[]) => {
    if (!taskTitle) {
      toast.error(`Task Title is Empty`, { position: toast.POSITION.TOP_CENTER });
      return;
    }

    try {
      setIsCreatingTask(true);

      const assignToJoin = selectedOptions
        .map((option) => `${option.value}`)
        .join(" - ");

      const customResponse = await AddTask(
        taskTitle,
        props.card.kanbanCardId,
        userInfo.username,
        userInfo.id,
        assignToJoin,
        userInfo.fkboardid,
        userInfo.fkpoid
      );

      if (customResponse?.status === 200) {
        const tempTask = [...kanbanTasks];
        tempTask.push({
          kanbanTaskId: customResponse?.data,
          id: "",
          title: taskTitle,
          completed: false,
          fkKanbanCardId: props.card.kanbanCardId,
          seqNo: 1,
          createdAt: new Date(),
          addedBy: userInfo.username,
          assignTo: assignToJoin,
          imageUrl: "",
          updatedBy: "",
        });

        setTasks(tempTask);

        handleUpdateCard(currentListIndex, currentCardIndex, {
          ...props.card,
          kanbanTasks: tempTask,
        });

        invalidateKanban();
        toast.success(`Task ID: ${customResponse?.data} Created Successfully`, {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error(
          `something went wrong could not add the Task, please try again later`,
          { position: toast.POSITION.TOP_CENTER }
        );
      }
    } finally {
      setIsCreatingTask(false);
    }
  };

  // ================= RENDER =================
  return (
    <>
      <Transition appear show={modalState.isOpen} as={Fragment}>
<Dialog
  as="div"
  className="relative z-[60]"
  onClose={() => {
    if (isDueDateModalOpen) return; // ✅ prevent CardModal from closing while DueDateModal is open
    handleCloseModal();
  }}
>
          {/* Overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-in-out duration-250"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-250"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-250 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-250 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-[450px]">
                    <div className="flex h-full flex-col bg-white shadow-xl dark:bg-[#1B232D]">
                      {/* ================= TOP BAR ================= */}
                      <div className="relative z-[80] flex items-center justify-between border-b border-slate500_12 px-6 py-4 dark:border-slate500_20">
                        {/* Status dropdown */}
                        <Menu as="div" className="relative z-[90]">
                          <Menu.Button
                            type="button"
                            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate500_20 bg-[#F4F6F8] px-4 text-[14px] font-semibold text-ink hover:bg-slate500_08 focus:outline-none dark:border-slate500_48 dark:bg-[#232C36] dark:text-white"
                          >
                            {status}
                            <ChevronDownIcon className="h-4 w-4 text-slate500 dark:text-slate500_80" />
                          </Menu.Button>

                          <Transition
                            as={Fragment}
                            enter="transition ease-out duration-150"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                          >
                            <Menu.Items className="absolute left-0 z-[999] mt-3 w-44 origin-top-left rounded-[16px] bg-white p-2 ring-1 ring-black/5 focus:outline-none pointer-events-auto dark:bg-[#1B232D] shadow-[0_18px_45px_rgba(15,23,42,0.12)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                              {statusOptions.map((opt) => (
                                <Menu.Item key={opt}>
                                  {({ active }) => (
                                    <button
                                      type="button"
                                    onClick={() => {
  // ✅ keep last non-done status so checkbox can return back
  if (normalize(opt) !== "done") lastNonDoneStatusRef.current = opt;

  setStatus(opt);           // ✅ update button text immediately
  moveCardOptimistic(opt);  // ✅ move card immediately
}}

                                      className={classNames(
                                        "flex w-full items-center rounded-[12px] px-3 py-3 text-left text-[12px] font-medium outline-none focus:outline-none focus:ring-0",
                                        active ? "bg-[#F4F6F8]/60 dark:bg-white/5" : "",
                                        normalize(opt) === normalize(status)
                                          ? "text-ink dark:text-white"
                                          : "text-ink/90 dark:text-white/90"
                                      )}
                                    >
                                      {opt}
                                    </button>
                                  )}
                                </Menu.Item>
                              ))}
                            </Menu.Items>
                          </Transition>
                        </Menu>

                        {/* Right icon (trash only like Figma) */}
  <button
  onClick={deleteCard}
  disabled={deletingCard}
  type="button"
  className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate500_12 disabled:opacity-50"
>
  <img src="/icons/trash.png" alt="Delete" className="h-5 w-5" />
</button>


                      </div>

                      {/* ================= TABS ================= */}
                      <div className="border-b border-slate500_12 bg-[#F4F6F8] px-3 py-1 dark:border-slate500_20 dark:bg-[#232C36]">
                        <div className="grid grid-cols-2 rounded-[14px] p-1">
                          <button
                            type="button"
                            onClick={() => setActiveTab("overview")}
                            className={classNames(
                              "w-full rounded-[12px] px-6 py-3 text-[12px] font-semibold transition",
                              activeTab === "overview"
                                ? "bg-white text-ink shadow-sm dark:bg-[#1B232D] dark:text-white"
                                : "bg-transparent text-slate500 dark:text-slate500_80"
                            )}
                          >
                            Overview
                          </button>

                          <button
                            type="button"
                            onClick={() => setActiveTab("subtasks")}
                            className={classNames(
                              "w-full rounded-[12px] px-6 py-3 text-[12px] font-semibold transition",
                              activeTab === "subtasks"
                                ? "bg-white text-ink shadow-sm dark:bg-[#1B232D] dark:text-white"
                                : "bg-transparent text-slate500 dark:text-slate500_80"
                            )}
                          >
                            Subtasks
                          </button>
                        </div>
                      </div>

                      {/* ================= CONTENT ================= */}
<div className="card-modal-scroll relative flex-1 overflow-y-auto px-6 py-6">
                        <div className="pointer-events-none absolute inset-0" />
                        <div className="relative z-10">
                          {/* Title input */}
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            minLength={3}
                            className="
                              w-full rounded-[12px]
                              border-2 border-transparent bg-transparent
                              px-4 py-3 text-[18px] font-semibold text-black
                              appearance-none
                              outline-none
                              focus:outline-none focus:ring-0 focus:ring-offset-0
                              focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0
                              focus:border-black
                              dark:text-white
                              dark:focus:border-white
                            "
                          />

                          {/* ============= OVERVIEW TAB ============= */}
                          {activeTab === "overview" && (
                            <div className="mt-6 grid grid-cols-[110px,1fr] items-start gap-x-8 gap-y-6">
{/* Tag */}
<div className="pt-2 text-[13px] font-medium text-[#637381] dark:text-slate500_80">
  Tag
</div>

<div className="flex flex-wrap items-center gap-2">
  {kanbanTags.map((tag, index) => (
    <div
      key={tag.kanbanTagId ?? index}
      className="
        inline-flex items-center gap-2
        rounded-[18px]
        px-3 py-2
        text-[13px] font-semibold
        bg-[#FFAB00]/10 text-[#FFAB00]
        dark:bg-[#FFAB00]/18 dark:text-[#FFAB00]
      "
    >
      <span className="leading-none">{tag.title}</span>

<button
  type="button"
  onClick={() => handleDeleteTag(index, tag.kanbanTagId)}
  disabled={isDeletingTag === tag.kanbanTagId}
  aria-label="Delete tag"
  className="
    inline-flex h-5 w-5 items-center justify-center
    rounded-full
    bg-[#FFAB00]/30 text-[#637381]
    hover:bg-[#FFAB00]/40
    disabled:opacity-50
    dark:bg-[#FFAB00]/30 dark:text-[#141A21]
  "
>
  <svg
    viewBox="0 0 24 24"
    className="h-3 w-3"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <path d="M7 7l10 10M17 7L7 17" />
  </svg>
</button>


    </div>
  ))}

  {isCreatingTag && (
    <div className="h-8 w-24 animate-pulse rounded-md bg-slate500_12 dark:bg-slate500_20" />
  )}

  {kanbanTags.length < 6 && (
    <button
      type="button"
      onClick={() => setOpenTagModal(true)}
      disabled={isCreatingTag}
      className="inline-flex h-8 items-center justify-center rounded-md border border-dashed border-slate500_20 px-3 text-[13px] font-medium text-slate500 hover:bg-slate500_12 dark:border-slate500_48 dark:text-slate500_80"
    >
      <PlusIcon className="mr-1 h-4 w-4" />
      Add tag
    </button>
  )}

  <CreateTagModal
    show={openTagModal}
    handleClose={setOpenTagModal}
    handleSubmit={handleCreateTag}
  />
</div>



                              {/* Due date */}
                              <div className="pt-2 text-[13px] font-medium text-[#637381] dark:text-slate500_80">
                                Due date
                              </div>

                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setIsDueDateModalOpen(true)}
                                  className="text-[15px] font-semibold text-ink hover:opacity-80 dark:text-white"
                                >
                                  {date?.startDate && date?.endDate ? formatDateRange(date) : "—"}
                                </button>
                              </div>

                              {/* Description */}
                              <div className="pt-2 text-[13px] font-medium text-[#637381] dark:text-slate500_80">
                                Description
                              </div>
                              <textarea
                                ref={descTextAreaRef}
                                className="card-desc-scroll
 min-h-[96px] w-full resize-none rounded-[12px] border border-slate500_12 bg-white/60 px-4 py-3 text-[15px] text-ink outline-none dark:border-slate500_20 dark:bg-white/5 dark:text-white "
                                placeholder="Add a short description..."
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                minLength={3}
                              />

                              {/* Image */}
                              <div className="pt-2 text-[13px] font-medium text-[#637381] dark:text-slate500_80">
                                Image
                              </div>
                              <div className="flex items-start gap-4">
                                <label className="flex h-[64px] w-[64px] cursor-pointer items-center justify-center rounded-[16px] border border-dashed border-slate500_20 bg-[#919EAB33] hover:bg-slate500_08/60 dark:border-slate500_48 dark:bg-white/5">
                                  <input
                                    className="hidden"
                                    type="file"
                                    accept="image/*"
                                    disabled={uploadingImage}
                                  onChange={(e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > maxFileSize) {
    setFileSizeExceeded(true);
    toast.error("File size must be less than 5MB", { position: toast.POSITION.TOP_CENTER });
    return;
  }

  setFileSizeExceeded(false);

  // show preview immediately
  const previewUrl = URL.createObjectURL(file);
  setImageUrl(previewUrl);

  // upload to cloudinary, then it will replace preview with real url
  handleImageUpload(file);

  // ✅ allow selecting same file again
  e.currentTarget.value = "";
}}

                                  />

                                  <img
                                    src="/icons/ic-eva_cloud-upload-fill.svg"
                                    alt="upload"
                                    className="h-6 w-6 opacity-70"
                                  />
                                </label>

                                {(displayImage || cloudinaryUrl) && (
                                  <img
                                    src={cloudinaryUrl || displayImage}
                                    alt="Card image"
                                    className="h-[64px] w-[64px] rounded-[16px] border border-slate500_12 object-cover dark:border-slate500_20"
                                  />
                                )}
                              </div>

                              {fileSizeExceeded && (
                                <p className="col-span-2 text-[13px] font-semibold text-red-600">
                                  File size exceeded the limit of 5MB
                                </p>
                              )}
                            </div>
                          )}

                          {/* ============= SUBTASKS TAB ============= */}
                          {activeTab === "subtasks" && (
                            <div className="mt-6">
                              <div className="grid grid-cols-[110px,1fr] items-start gap-x-8 gap-y-6">
                                {/* Due date */}
                                <div className="pt-2 text-[13px] font-medium text-slate600 dark:text-slate500_80">
                                  Due date
                                </div>
                                <div className="flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => setIsDueDateModalOpen(true)}
                                    className="text-[15px] font-semibold text-ink hover:opacity-80 dark:text-white"
                                  >
                                    {date?.startDate && date?.endDate ? formatDateRange(date) : "—"}
                                  </button>
                                </div>

                               
                              

                                {/* Completed */}
                                <div className="pt-2 text-[13px] font-medium text-[#637381] dark:text-slate500_80">
                                  Completed
                                </div>
                                <div className="flex items-center">
<button
  type="button"
  onClick={() => {
    setCompleted((prev) => {
      const next = !prev;

      if (next) {
        if (normalize(status) !== "done") lastNonDoneStatusRef.current = status;
        setStatus(doneTitle);
        moveCardOptimistic(doneTitle);
      } else {
        const fallback =
          lastNonDoneStatusRef.current &&
          normalize(lastNonDoneStatusRef.current) !== "done"
            ? lastNonDoneStatusRef.current
            : statusOptions.find((s) => normalize(s) !== "done") || "In progress";

        if (normalize(fallback) !== "done") lastNonDoneStatusRef.current = fallback;
        setStatus(fallback);
        moveCardOptimistic(fallback);
      }

      return next;
    });
  }}
  aria-pressed={completed}
  className={[
    "flex h-5 w-5 items-center justify-center rounded-[6px] border transition",
    completed
      ? "border-[#FFAB00] bg-[#FFAB00]"
      : "border-[#637381] bg-transparent",
  ].join(" ")}
>
  {/* check icon */}
  <svg
    className={completed ? "h-4 w-4 text-white" : "hidden"}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 011.414-1.414l2.793 2.793 6.793-6.793a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
</button>




                                </div>

                                {/* Description */}
                                <div className="pt-2 text-[13px] font-medium text-[#637381] dark:text-slate500_80">
                                  Description
                                </div>
                                  <textarea
                                ref={descTextAreaRef}
                                className="card-desc-scroll
 min-h-[96px] w-full resize-none rounded-[12px] border border-slate500_12 bg-white/60 px-4 py-3 text-[15px] text-ink outline-none dark:border-slate500_20 dark:bg-white/5 dark:text-white "
                                placeholder="Add a short description..."
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                minLength={3}
                              />

                                {/* Image */}
                                <div className="pt-2 text-[13px] font-medium text-[#637381] dark:text-slate500_80">
                                  Image
                                </div>
                                <div className="flex items-start gap-4">
                                  <label className="flex h-[64px] w-[64px] cursor-pointer items-center justify-center rounded-[16px] border border-dashed border-slate500_20 bg-[#919EAB33] hover:bg-slate500_08/60 dark:border-slate500_48 dark:bg-white/5">
                                    <input
                                      className="hidden"
                                      type="file"
                                      accept="image/*"
                                      disabled={uploadingImage}
                                    onChange={(e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > maxFileSize) {
    setFileSizeExceeded(true);
    toast.error("File size must be less than 5MB", { position: toast.POSITION.TOP_CENTER });
    return;
  }

  setFileSizeExceeded(false);

  // show preview immediately
  const previewUrl = URL.createObjectURL(file);
  setImageUrl(previewUrl);

  // upload to cloudinary, then it will replace preview with real url
  handleImageUpload(file);

  // ✅ allow selecting same file again
  e.currentTarget.value = "";
}}

                                    />

                                    <img
                                      src="/icons/ic-eva_cloud-upload-fill.svg"
                                      alt="upload"
                                      className="h-6 w-6 opacity-70"
                                    />
                                  </label>

                                  {(displayImage || cloudinaryUrl) && (
                                    <img
                                      src={cloudinaryUrl || displayImage}
                                      alt="Card image"
                                      className="h-[64px] w-[64px] rounded-[16px] border border-slate500_12 object-cover dark:border-slate500_20"
                                    />
                                  )}
                                </div>
                              </div>

                              {/* Tasks list + AddTask button */}
                              <div className="mt-8">
                                <div className="w-full">
                                  {kanbanTasks.map((_t, index) => (
                                    <Disclosure key={_t.kanbanTaskId ?? index}>
                                      {({ open }) => (
                                        <>
                                          <div className="mb-2 flex items-center justify-between rounded-[14px] border border-slate500_12 bg-white/60 px-4 py-3 dark:border-slate500_20 dark:bg-white/5 dark:text-white">
                                            <div className="flex items-center gap-2">
                                              <span className="text-[14px] font-semibold">{_t.title}</span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                              <Disclosure.Button className="rounded-full p-2 hover:bg-slate500_08 dark:hover:bg-slate500_12">
                                                <ChevronUpIcon
                                                  className={classNames(
                                                    "h-4 w-4 text-slate500 transition-transform",
                                                    open ? "rotate-0" : "rotate-180"
                                                  )}
                                                />
                                              </Disclosure.Button>

                                              {_t.addedBy === userInfo.username && _t.completed === false && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteTask(index, _t.kanbanTaskId)}
                                                  disabled={isDeletingTask === _t.kanbanTaskId}
                                                  className="rounded-full p-2 hover:bg-slate500_08 dark:hover:bg-slate500_12"
                                                >
                                                  {isDeletingTask === _t.kanbanTaskId ? (
                                                    <svg
                                                      className="h-5 w-5 animate-spin text-slate500"
                                                      xmlns="http://www.w3.org/2000/svg"
                                                      fill="none"
                                                      viewBox="0 0 24 24"
                                                    >
                                                      <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                      ></circle>
                                                      <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                      ></path>
                                                    </svg>
                                                  ) : (
                                                    <TrashIcon className="h-5 w-5 text-slate500" />
                                                  )}
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </Disclosure>
                                  ))}

                                  {isCreatingTask && (
                                    <div className="mb-2 animate-pulse rounded-[14px] bg-slate500_08 px-4 py-3 dark:bg-slate500_12">
                                      <div className="h-5 w-3/4 rounded bg-slate500_12 dark:bg-slate500_20"></div>
                                    </div>
                                  )}

                                  {kanbanTasks.length < 21 && (
                                    <AddTaskForm
                                      text="Subtasks"
                                      placeholder="Task name..."
                                      onSubmit={handleCreateTask}
                                      userInfo={userInfo}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ================= STICKY BOTTOM ACTIONS ================= */}
                      <div className="sticky bottom-0 border-t border-slate500_12 bg-white/70 px-6 py-4 backdrop-blur dark:border-slate500_20 dark:bg-[#1B232D]/70">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={handleCloseModal}
                            className="inline-flex items-center justify-center rounded-[12px] border border-slate500_20 bg-white px-4 py-2 text-[14px] font-semibold text-ink hover:bg-slate500_08 dark:bg-transparent dark:text-white dark:border-[#919EAB52]"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={submit || uploadingImage}
                            className="inline-flex items-center justify-center rounded-[12px] bg-[#1C252E] px-4 py-2 text-[14px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#1C252E] dark:border-[#1C252E]"
                          >
                            {submit ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>

     <DueDateModal
  open={isDueDateModalOpen}
  value={date}
  onClose={() => setIsDueDateModalOpen(false)}
  onApply={(newValue) => {
    setDate(newValue);
    setIsDueDateModalOpen(false);
  }}
/>

    </>
  );
}
