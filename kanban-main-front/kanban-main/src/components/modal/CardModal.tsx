// src/components/modal/CardModal.tsx
import { Fragment, useContext, useEffect, useRef, useState } from "react";
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
} from "@/services/kanbanApi";
import { toast } from "react-toastify";
import { GetCardImagePath } from "@/utility/baseUrl";
import dayjs from "dayjs";
import { DueDateModal } from "../kanban/DueDateModal";
import { useInvalidateKanban } from "@/hooks/useKanbanMutations";

export interface CardModalProps {
  listIndex: number;
  cardIndex: number;
  card: KanbanCard;
}

type CardStatus = "To do" | "In progress" | "Ready to test" | "Done";
const STATUS_OPTIONS: CardStatus[] = ["To do", "In progress", "Ready to test", "Done"];

// ✅ Single (default) tag color — no color picking anymore
const TAG_BLUE = "bg-blue-400 text-white";

export function CardModal(props: CardModalProps) {
  const descTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState<string>(props.card.title);
  const [desc, setDesc] = useState(props.card.desc);

  const [date, setDate] = useState<DateValueType | null>({
    startDate: props.card.startDate,
    endDate: props.card.endDate,
  });

  const [completed, setCompleted] = useState(props.card.completed);

  // ✅ Status dropdown (Figma)
  const [status, setStatus] = useState<CardStatus>(() => {
    const raw = (props.card as any)?.status as CardStatus | undefined;
    if (raw && STATUS_OPTIONS.includes(raw)) return raw;
    return props.card.completed ? "Done" : "In progress";
  });

  useEffect(() => {
    setCompleted(status === "Done");
  }, [status]);

  const CardImagePath = GetCardImagePath();

  // tabs: "overview" | "subtasks"
  const [activeTab, setActiveTab] = useState<"overview" | "subtasks">("overview");

  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);

  // local priority (still saved)
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    ((props.card as any).priority as "low" | "medium" | "high") || "low"
  );

  const assigneeAvatars = ["/icons/Avatar_1.png", "/icons/Avatar_2.png", "/icons/Avatar_3.png"];

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

  const invalidateKanban = useInvalidateKanban();

  // keep autosize for description
  useAutosizeTextArea(descTextAreaRef, desc);

  const { handleUpdateCard, handleCloseModal, modalState, userInfo } = useContext(KanbanContext);

  // ================= DATE LABEL =================
  const formatDateRange = (d: DateValueType | null) => {
    if (!d?.startDate || !d?.endDate) return "—";

    const s = dayjs(d.startDate);
    const e = dayjs(d.endDate);

    const sameYear = s.year() === e.year();
    const sameMonth = s.month() === e.month();

    if (sameYear && sameMonth) {
      // 28 - 29 Dec 2025
      return `${s.format("DD")} - ${e.format("DD")} ${s.format("MMM YYYY")}`;
    }

    if (sameYear && !sameMonth) {
      // 28 Dec - 02 Jan 2025
      return `${s.format("DD MMM")} - ${e.format("DD MMM YYYY")}`;
    }

    // 22 Jun 2025 - 23 Jun 2026
    return `${s.format("DD MMM YYYY")} - ${e.format("DD MMM YYYY")}`;
  };

  // ================= IMAGE UPLOAD =================
  const handleImageUpload = async (f: File) => {
    try {
      setUploadingImage(true);
      setFileSizeExceeded(false);

      const uploadResult = await uploadImageToCloudinary(f);

      if (uploadResult && uploadResult.data) {
        setCloudinaryUrl(uploadResult.data.url);
        setCloudinaryPublicId(uploadResult.data.publicId);
        setImageUrl(uploadResult.data.url);
        toast.success("Image uploaded successfully!", {
          position: toast.POSITION.TOP_CENTER,
        });
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
          handleUpdateCard(props.listIndex, props.cardIndex, {
            ...props.card,
            title,
            desc,
            completed: status === "Done",
            imageUrl: cardData.imageUrl || props.card.imageUrl || "",
            kanbanTags,
            kanbanTasks,
            date,
            startDate: date?.startDate as Date,
            endDate: date?.endDate as Date,
          });

          handleCloseModal();
          setSubmit(false);
          invalidateKanban();
          toast.success(`Card updated successfully!`, {
            position: toast.POSITION.TOP_CENTER,
          });
        }

        if (customResponse?.status != 200 || customResponse?.data == null) {
          toast.error(`something went wrong could not Edit the Card, please try again later`, {
            position: toast.POSITION.TOP_CENTER,
          });
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

    const cardData = {
      title,
      kanbanCardId: props.card.kanbanCardId,
      updatedby: userInfo.username,
      desc: desc || "....",
      imageUrl: finalImageUrl,
      imagePublicId: cloudinaryPublicId,
      completed: status === "Done",
      startDate: date?.startDate ? date.startDate.toString() : undefined,
      endDate: date?.endDate ? date.endDate.toString() : undefined,
      fkboardid: userInfo.fkboardid,
      fkpoid: userInfo.fkpoid,
      priority,
      status,
    };

    mutation.mutate(cardData);
  };

  const deleteCard = () => {
    toast.error(` Please Contact The Admin as you are not Authorized`, {
      position: toast.POSITION.TOP_CENTER,
    });
  };

  // ================= TAGS =================
  // ✅ IMPORTANT: keep (tagName, colorIndex) signature so your CreateTagModal doesn't break
  // but IGNORE colorIndex and always use TAG_BLUE
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
          fkKanbanCardId: props.card.kanbanCardId, // ✅ fix: don't hardcode 1
          seqNo: 1,
          createdAt: new Date(),
          addedBy: userInfo.username,
        });

        setTags(newTags);
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTags: newTags,
        });

        toast.success(`Tag Created Successfully`, {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error(`something went wrong could not add the Tag, please try again later`, {
          position: toast.POSITION.TOP_CENTER,
        });
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
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTags: newTags,
        });

        invalidateKanban();
        toast.success(` ${customResponse?.data}`, {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error(`something went wrong could not Remove the Tag, please try again later`, {
          position: toast.POSITION.TOP_CENTER,
        });
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
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTasks: tempTask,
        });

        invalidateKanban();

        toast.success(` ${customResponse?.data}`, {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error(`something went wrong could not Remove the Task, please try again later`, {
          position: toast.POSITION.TOP_CENTER,
        });
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

      const assignToJoin = selectedOptions.map((option) => `${option.value}`).join(" - ");

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
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTasks: tempTask,
        });

        invalidateKanban();
        toast.success(`Task ID: ${customResponse?.data} Created Successfully`, {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error(`something went wrong could not add the Task, please try again later`, {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    } finally {
      setIsCreatingTask(false);
    }
  };

  // ================= RENDER =================
  return (
    <>
      <Transition appear show={modalState.isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[60]" onClose={handleCloseModal}>
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
                      {/* ================= TOP BAR (UPDATED) ================= */}
                      <div className="relative z-[80] flex items-center justify-between border-b border-slate500_12 px-6 py-4 dark:border-slate500_20">
                        {/* Status dropdown (Figma) */}
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
                            <Menu.Items
                              className="absolute left-0 z-[999] mt-3 w-40 origin-top-left rounded-[16px] bg-white p-2 ring-1 ring-black/5 focus:outline-none pointer-events-auto dark:bg-[#1B232D] shadow-[0_18px_45px_rgba(15,23,42,0.12)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
                            >
                              {STATUS_OPTIONS.map((opt) => (
                                <Menu.Item key={opt}>
                                  {({ active }) => (
                                    <button
                                      type="button"
                                      onClick={() => setStatus(opt)}
                                      className={classNames(
                                        "flex w-full items-center rounded-[12px] px-3 py-3 text-left text-[12px] font-medium outline-none focus:outline-none focus:ring-0",
                                        active ? "bg-[#F4F6F8]/60 dark:bg-white/5" : "",
                                        opt === status
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
                          type="button"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate500_12 dark:hover:bg-slate500_12"
                          aria-label="Delete card"
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
                      <div className="relative flex-1 overflow-y-auto px-6 py-6">
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
                                    className="inline-flex items-center gap-2 rounded-[10px] bg-[#D0F2FF] px-2 py-1 text-[11px] font-semibold text-[#006C9C]"
                                  >
                                    <span className="leading-none">{tag.title}</span>

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteTag(index, tag.kanbanTagId)}
                                      disabled={isDeletingTag === tag.kanbanTagId}
                                      aria-label="Delete tag"
                                    >
                                      <img src="/icons/tag-delete-icon.png" alt="" className="h-4 w-4" />
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
                                  handleSubmit={handleCreateTag} // ✅ still works (2 args), but color is ignored
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
                                className="min-h-[96px] w-full resize-none rounded-[12px] border border-slate500_12 bg-white/60 px-4 py-3 text-[15px] text-ink outline-none dark:border-slate500_20 dark:bg-white/5 dark:text-white"
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
                                      const selectedFile = e.target.files?.[0];

                                      if (selectedFile) {
                                        if (selectedFile.size > maxFileSize) {
                                          setFileSizeExceeded(true);
                                          toast.error("File size must be less than 5MB", {
                                            position: toast.POSITION.TOP_CENTER,
                                          });
                                          return;
                                        }

                                        setFileSizeExceeded(false);
                                        handleImageUpload(selectedFile);

                                        const imageURL = URL.createObjectURL(selectedFile);
                                        setImageUrl(imageURL);
                                      } else {
                                        setImageUrl("");
                                        setFileSizeExceeded(false);
                                      }
                                    }}
                                  />

                                  <img
                                    src="/icons/ic-eva_cloud-upload-fill.svg"
                                    alt="upload"
                                    className="h-6 w-6 opacity-70"
                                  />
                                </label>

                                {(displayImage || cloudinaryUrl) && (
                                  // eslint-disable-next-line @next/next/no-img-element
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

                                {/* Assignee */}
                                <div className="pt-2 text-[13px] font-medium text-[#637381] dark:text-slate500_80">
                                  Assignee
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {assigneeAvatars.map((src, index) => (
                                    <div
                                      key={index}
                                      className="h-9 w-9 overflow-hidden rounded-full ring-2 ring-white dark:ring-[#141A21]"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={src}
                                        alt={`Assignee ${index + 1}`}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                  ))}

                                  <button
                                    type="button"
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-slate500_20 text-slate500 hover:bg-slate500_08 dark:border-slate500_48 dark:text-slate500_80"
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </button>
                                </div>

                                {/* Completed (kept) */}
                                <div className="pt-2 text-[13px] font-medium text-[#637381] dark:text-slate500_80">
                                  Completed
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded-[5px] border-1 border-[#637381]"
                                    checked={completed}
                                    onChange={() => {
                                      setCompleted((p) => {
                                        const next = !p;
                                        setStatus(next ? "Done" : "In progress");
                                        return next;
                                      });
                                    }}
                                  />
                                </div>

                                {/* Description */}
                                <div className="pt-2 text-[13px] font-medium text-[#637381] dark:text-slate500_80">
                                  Description
                                </div>
                                <textarea
                                  ref={descTextAreaRef}
                                  className="min-h-[96px] w-full resize-none rounded-[12px] border border-slate500_12 bg-white/60 px-4 py-3 text-[15px] text-ink outline-none dark:border-slate500_20 dark:bg-white/5 dark:text-white"
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
                                        const selectedFile = e.target.files?.[0];

                                        if (selectedFile) {
                                          if (selectedFile.size > maxFileSize) {
                                            setFileSizeExceeded(true);
                                            toast.error("File size must be less than 5MB", {
                                              position: toast.POSITION.TOP_CENTER,
                                            });
                                            return;
                                          }

                                          setFileSizeExceeded(false);
                                          handleImageUpload(selectedFile);

                                          const imageURL = URL.createObjectURL(selectedFile);
                                          setImageUrl(imageURL);
                                        } else {
                                          setImageUrl("");
                                          setFileSizeExceeded(false);
                                        }
                                      }}
                                    />

                                    <img
                                      src="/icons/ic-eva_cloud-upload-fill.svg"
                                      alt="upload"
                                      className="h-6 w-6 opacity-70"
                                    />
                                  </label>

                                  {(displayImage || cloudinaryUrl) && (
                                    // eslint-disable-next-line @next/next/no-img-element
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
        onChange={(newValue) => setDate(newValue)}
        onClose={() => setIsDueDateModalOpen(false)}
        onApply={() => setIsDueDateModalOpen(false)}
      />
    </>
  );
}
