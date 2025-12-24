// src/components/modal/CardModal.tsx
import { Fragment, useContext, useRef, useState } from "react";
import { Dialog, Transition, Disclosure } from "@headlessui/react";
import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import KanbanContext from "../../context/kanbanContext";
import useAutosizeTextArea from "../../hooks/useAutosizeTextarea";
import { KanbanCard } from "../kanban/KanbanTypes";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import { CreateTagModal, tagColors } from "./CreateTagModal";
import { AddTaskForm } from "../kanban/AddTaskForm";
import { classNames } from "../../utility/css";
import { useMutation } from "@tanstack/react-query";
import {
  DeleteTask,
  DeleteTag,
  AddTag,
  EditCard,
  AddTask,
  SubmitTask,
  uploadImageToCloudinary,
} from "@/services/kanbanApi";
import { toast } from "react-toastify";
import { GetCardImagePath } from "@/utility/baseUrl";
import dayjs from "dayjs";
import { DueDateModal } from "../kanban/DueDateModal";

export interface CardModalProps {
  listIndex: number;
  cardIndex: number;
  card: KanbanCard;
}

export function CardModal(props: CardModalProps) {
  const descTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState<string>(props.card.title);
  const [desc, setDesc] = useState(props.card.desc);
  const [date, setDate] = useState<DateValueType | null>({
    startDate: props.card.startDate,
    endDate: props.card.endDate,
  });
  const [completed, setCompleted] = useState(props.card.completed);
  const CardImagePath = GetCardImagePath();

  // tabs: "overview" | "subtasks"
  const [activeTab, setActiveTab] = useState<"overview" | "subtasks">(
    "overview"
  );

  const [isDueDateModalOpen, setIsDueDateModalOpen] = useState(false);

  // local priority (still saved; UI removed from overview to match your screenshots)
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

  const [displayImage, setImageUrl] = useState(
    getImageUrl(props.card.imageUrl || null)
  );
  const [file, setFile] = useState<File | null>(null);
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

  // task state (subtasks tab)
  const [taskCompleted, setTaskCompleted] = useState<boolean>(false);
  const [taskFile, setTaskFile] = useState<File | null>(null);
  const [taskFileSizeExceeded, setTaskFileSizeExceeded] = useState(false);
  const [submitTask, setSubmitTask] = useState<boolean>(false);
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);

  // tag/task loading states
  const [isCreatingTag, setIsCreatingTag] = useState<boolean>(false);
  const [isDeletingTag, setIsDeletingTag] = useState<number | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState<number | null>(null);

  const maxFileSize = 5000000;

  // keep autosize for description
  useAutosizeTextArea(descTextAreaRef, desc);

  const { handleUpdateCard, handleCloseModal, modalState, userInfo } =
    useContext(KanbanContext);

  // ================= DATE LABEL (matches screenshot style) =================
  const formatDateRange = (d: DateValueType | null) => {
    if (!d?.startDate || !d?.endDate) return "DD - DD MMM";

    const s = dayjs(d.startDate);
    const e = dayjs(d.endDate);

    const sameYear = s.year() === e.year();
    const sameMonth = s.month() === e.month();

    if (sameYear && sameMonth) {
      // 22 - 23 Jun
      return `${s.format("DD")} - ${e.format("DD")} ${s.format("MMM")}`;
    }

    if (sameYear && !sameMonth) {
      // 28 Jun - 02 Jul
      return `${s.format("DD MMM")} - ${e.format("DD MMM")}`;
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
            completed,
            imageUrl: cardData.imageUrl || props.card.imageUrl || "",
            kanbanTags,
            kanbanTasks,
            date,
            startDate: date?.startDate as Date,
            endDate: date?.endDate as Date,
          });
          handleCloseModal();
          setSubmit(false);
          toast.success(`Card updated successfully!`, {
            position: toast.POSITION.TOP_CENTER,
          });
        }

        if (customResponse?.status != 200 || customResponse?.data == null) {
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

    const cardData = {
      title,
      kanbanCardId: props.card.kanbanCardId,
      updatedby: userInfo.username,
      desc: desc || "....",
      imageUrl: finalImageUrl,
      imagePublicId: cloudinaryPublicId,
      completed,
      startDate: date?.startDate ? date.startDate.toString() : undefined,
      endDate: date?.endDate ? date.endDate.toString() : undefined,
      fkboardid: userInfo.fkboardid,
      fkpoid: userInfo.fkpoid,
      priority,
    };

    mutation.mutate(cardData);
  };

  const deleteCard = () => {
    toast.info(` Please Contact The Admin as you are not Authorized`, {
      position: toast.POSITION.TOP_CENTER,
    });
  };

  // ================= TAGS =================
  const handleCreateTag = async (tagName: string, colorIndex: number) => {
    if (!tagName) {
      toast.error(`Tag Name is Empty`, { position: toast.POSITION.TOP_CENTER });
      return;
    }

    try {
      setIsCreatingTag(true);
      const customResponse = await AddTag(
        tagName,
        tagColors[colorIndex],
        props.card.kanbanCardId,
        userInfo.username,
        userInfo.id
      );

      if (customResponse?.status === 200) {
        const newTags = [...kanbanTags];
        newTags.push({
          kanbanTagId: customResponse?.data,
          id: "",
          color: tagColors[colorIndex],
          title: tagName,
          fkKanbanCardId: 1,
          seqNo: 1,
          createdAt: new Date(),
          addedBy: userInfo.username,
        });
        setTags(newTags);
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTags: newTags,
        });

        toast.success(`Tag ID: ${customResponse?.data} Created Successfully`, {
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
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTags: newTags,
        });
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
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTasks: tempTask,
        });
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
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTasks: tempTask,
        });
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

  const handleSubmitTask = async (kanbanTaskId: number, index: number) => {
    if (!taskCompleted) return;

    try {
      setSubmitTask(true);

      let fileUrl: string | null = null;

      if (taskFile) {
        try {
          toast.info("Uploading file...", {
            position: toast.POSITION.TOP_CENTER,
            autoClose: 2000,
          });

          const uploadResult = await uploadImageToCloudinary(taskFile);

          if (uploadResult && uploadResult.data) {
            fileUrl = uploadResult.data.url;
          } else {
            throw new Error("Upload failed - no URL returned");
          }
        } catch (uploadError: any) {
          toast.error(uploadError.message || "Failed to upload file", {
            position: toast.POSITION.TOP_CENTER,
          });
          setSubmitTask(false);
          return;
        }
      }

      const customResponse = await SubmitTask(
        kanbanTaskId,
        userInfo.username,
        taskCompleted,
        fileUrl,
        userInfo.fkboardid,
        userInfo.fkpoid
      );

      if (customResponse?.status === 200) {
        const tempTask = [...kanbanTasks];
        tempTask[index].completed = !tempTask[index].completed;
        tempTask[index].updatedBy = userInfo.username;
        if (fileUrl) tempTask[index].imageUrl = fileUrl;

        setTasks(tempTask);
        handleUpdateCard(props.listIndex, props.cardIndex, {
          ...props.card,
          kanbanTasks: tempTask,
        });

        setSubmitTask(false);
        setTaskCompleted(false);
        setTaskFile(null);

        toast.success("Task submitted successfully!", {
          position: toast.POSITION.TOP_CENTER,
        });
      } else {
        toast.error("Failed to submit task", {
          position: toast.POSITION.TOP_CENTER,
        });
        setSubmit(false);
      }
    } catch (err: any) {
      toast.error(err, { position: "top-center" });
      setSubmit(false);
      return err.response;
    }
  };

  const handleToggleTaskCompleted = () => {
    setTaskCompleted((prev) => !prev);
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
                      {/* ================= TOP BAR ================= */}
                      <div className="flex items-center justify-between border-b border-slate500_12 px-6 py-4 dark:border-slate500_20">
                        {/* Status pill */}
                        <button
                          type="button"
                          onClick={() => setCompleted((prev) => !prev)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate500_20 bg-[#F4F6F8] px-4 py-2 text-[14px] font-semibold text-ink dark:bg-[#232C36] dark:text-white"
                        >
                          {completed ? "Done" : "In progress"}
                          <ChevronUpIcon className="h-4 w-4 rotate-180 opacity-70" />
                        </button>

                        {/* Icons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={deleteCard}
                            type="button"
                            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-slate500_12 dark:hover:bg-slate500_12"
                          >
                            <TrashIcon className="h-5 w-5 text-slate500 dark:text-slate500_80" />
                          </button>

                          <button
                            onClick={handleCloseModal}
                            type="button"
                            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-slate500_12 dark:hover:bg-slate500_12"
                          >
                            <XMarkIcon className="h-5 w-5 text-slate500 dark:text-slate500_80" />
                          </button>
                        </div>
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
                      <div className="relative flex-1 overflow-y-auto px-6 py-6 
                      ">
                        <div className="pointer-events-none absolute inset-0 " />
                        <div className="relative z-10">
                          {/* Title input */}
                          <input
                            className="w-full rounded-[12px] border-2 border-ink bg-white/60 px-4 py-3 text-[18px] font-semibold text-ink outline-none dark:border-white dark:bg-white/5 dark:text-white"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            minLength={3}
                          />

                          {/* ============= OVERVIEW TAB (MATCH SCREEN 1) ============= */}
                          {activeTab === "overview" && (
                            <div className="mt-6 grid grid-cols-[110px,1fr] items-start gap-x-8 gap-y-6">
                              {/* Tag */}
                              <div className="pt-2 text-[13px] font-medium text-slate600 dark:text-slate500_80">
                                Tag
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {kanbanTags.map((tag, index) => (
                                  <div
                                    key={tag.kanbanTagId ?? index}
                                    className="flex items-center gap-2 rounded-full bg-[#D0F2FF] px-3 py-1 text-[13px] font-semibold text-[#006C9C]"
                                  >
                                    <span>{tag.title}</span>

                                    {tag.addedBy === userInfo.username && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDeleteTag(index, tag.kanbanTagId)
                                        }
                                        disabled={isDeletingTag === tag.kanbanTagId}
                                        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70 hover:bg-white"
                                      >
                                        <XMarkIcon className="h-4 w-4 text-slate500" />
                                      </button>
                                    )}
                                  </div>
                                ))}

                                {isCreatingTag && (
                                  <div className="h-7 w-20 animate-pulse rounded-full bg-slate500_12 dark:bg-slate500_20" />
                                )}

                                {kanbanTags.length < 6 && (
                                  <button
                                    type="button"
                                    onClick={() => setOpenTagModal(true)}
                                    disabled={isCreatingTag}
                                    className="inline-flex h-8 items-center justify-center rounded-full border border-dashed border-slate500_20 px-3 text-[13px] font-medium text-slate500 hover:bg-slate500_08 dark:border-slate500_48 dark:text-slate500_80"
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
                              <div className="pt-2 text-[13px] font-medium text-slate600 dark:text-slate500_80">
                                Due date
                              </div>
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setIsDueDateModalOpen(true)}
                                  className="text-[15px] font-semibold text-ink hover:opacity-80 dark:text-white"
                                >
                                  {date?.startDate && date?.endDate
                                    ? formatDateRange(date)
                                    : "—"}
                                </button>
                              </div>

                              {/* Description */}
                              <div className="pt-2 text-[13px] font-medium text-slate600 dark:text-slate500_80">
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
                              <div className="pt-2 text-[13px] font-medium text-slate600 dark:text-slate500_80">
                                Image
                              </div>
                              <div className="flex items-start gap-4">
                                <label className="flex h-[64px] w-[64px] cursor-pointer items-center justify-center rounded-[16px] border border-dashed border-slate500_20 bg-white hover:bg-slate500_08/60 dark:border-slate500_48 dark:bg-white/5">
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
                                        setFile(selectedFile);

                                        handleImageUpload(selectedFile);
                                        const imageURL = URL.createObjectURL(selectedFile);
                                        setImageUrl(imageURL);
                                      } else {
                                        setFile(null);
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

                          {/* ============= SUBTASKS TAB (MATCH SCREEN 2) ============= */}
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
                                    {date?.startDate && date?.endDate
                                      ? formatDateRange(date)
                                      : "—"}
                                  </button>
                                </div>

                                {/* Assignee */}
                                <div className="pt-2 text-[13px] font-medium text-slate600 dark:text-slate500_80">
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

                                {/* Completed */}
                                <div className="pt-2 text-[13px] font-medium text-slate600 dark:text-slate500_80">
                                  Completed
                                </div>
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    className="h-5 w-5 rounded-md"
                                    checked={completed}
                                    onChange={() => setCompleted((p) => !p)}
                                  />
                                </div>

                                {/* Description */}
                                <div className="pt-2 text-[13px] font-medium text-slate600 dark:text-slate500_80">
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
                                <div className="pt-2 text-[13px] font-medium text-slate600 dark:text-slate500_80">
                                  Image
                                </div>
                                <div className="flex items-start gap-4">
                                  <label className="flex h-[64px] w-[64px] cursor-pointer items-center justify-center rounded-[16px] border border-dashed border-slate500_20 bg-white hover:bg-slate500_08/60 dark:border-slate500_48 dark:bg-white/5">
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
                                            toast.error(
                                              "File size must be less than 5MB",
                                              { position: toast.POSITION.TOP_CENTER }
                                            );
                                            return;
                                          }

                                          setFileSizeExceeded(false);
                                          setFile(selectedFile);

                                          handleImageUpload(selectedFile);
                                          const imageURL = URL.createObjectURL(selectedFile);
                                          setImageUrl(imageURL);
                                        } else {
                                          setFile(null);
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

                              {/* ===== keep your existing Tasks UI under the fields ===== */}
                              <div className="mt-8">
                                <div className="mb-3 text-[14px] font-medium text-slate500 dark:text-slate500_80">
                                  Tasks
                                </div>

                                <div className="w-full">
                                  {kanbanTasks.map((_t, index) => (
                                    <Disclosure key={_t.kanbanTaskId ?? index}>
                                      {({ open }) => (
                                        <>
                                          <div className="mb-2 flex items-center justify-between rounded-[14px] border border-slate500_12 bg-white/60 px-4 py-3 dark:border-slate500_20 dark:bg-white/5 dark:text-white">
                                            <div className="flex items-center gap-2">
                                              <span className="text-[14px] font-semibold">
                                                {_t.title}
                                              </span>
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

                                              {_t.addedBy === userInfo.username &&
                                                _t.completed === false && (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleDeleteTask(index, _t.kanbanTaskId)
                                                    }
                                                    disabled={
                                                      isDeletingTask === _t.kanbanTaskId
                                                    }
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

                                          <Disclosure.Panel className="mb-4 rounded-[14px] border border-slate500_12 bg-white/50 px-4 py-4 text-[14px] text-ink dark:border-slate500_20 dark:bg-white/5 dark:text-white">
                                            {_t.completed ? (
                                              <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                  <span className="text-slate500 dark:text-slate500_80">
                                                    Completed:
                                                  </span>
                                                  <span className="font-semibold">Yes</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                  <span className="text-slate500 dark:text-slate500_80">
                                                    Uploaded File:
                                                  </span>
                                                  {_t.imageUrl ? (
                                                    <a
                                                      href={`${_t.imageUrl}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="font-semibold underline"
                                                    >
                                                      Open
                                                    </a>
                                                  ) : (
                                                    <span className="font-semibold">—</span>
                                                  )}
                                                </div>

                                                <div className="flex items-center gap-2">
                                                  <span className="text-slate500 dark:text-slate500_80">
                                                    Submit By:
                                                  </span>
                                                  <span className="font-semibold">
                                                    {_t.updatedBy}
                                                  </span>
                                                </div>
                                              </div>
                                            ) : (
                                              <form
                                                onSubmit={(e) => {
                                                  e.preventDefault();
                                                  handleSubmitTask(_t.kanbanTaskId, index);
                                                }}
                                                className="space-y-4"
                                              >
                                                <div className="flex items-center gap-3">
                                                  <span className="text-slate500 dark:text-slate500_80">
                                                    Completed
                                                  </span>
                                                  <input
                                                    type="checkbox"
                                                    className="h-5 w-5 rounded-md"
                                                    value={taskCompleted ? "on" : "off"}
                                                    checked={taskCompleted}
                                                    onChange={() => handleToggleTaskCompleted()}
                                                    required
                                                  />
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                  <span className="text-slate500 dark:text-slate500_80">
                                                    Upload File
                                                  </span>
                                                  <input
                                                    onChange={(e) => {
                                                      const selectedFile =
                                                        e.target.files?.[0];

                                                      if (selectedFile) {
                                                        if (selectedFile.size > maxFileSize) {
                                                          setTaskFileSizeExceeded(true);
                                                          return;
                                                        }
                                                        setTaskFile(selectedFile);
                                                        setTaskFileSizeExceeded(false);
                                                      } else {
                                                        setTaskFile(null);
                                                        setTaskFileSizeExceeded(false);
                                                      }
                                                    }}
                                                    className="block w-full cursor-pointer rounded-[12px] border border-slate500_20 bg-white px-3 py-2 text-[13px] text-ink dark:bg-transparent dark:text-white"
                                                    type="file"
                                                    accept=".xlsx,.xls,image/*,.doc, .docx,.ppt, .pptx,.txt,.pdf"
                                                  />

                                                  {taskFileSizeExceeded && (
                                                    <p className="text-[13px] font-semibold text-red-600">
                                                      File size exceeded the limit of 5MB
                                                    </p>
                                                  )}
                                                </div>

                                                <div className="flex justify-end">
                                                  <button
                                                    disabled={submitTask}
                                                    type="submit"
                                                    className="inline-flex items-center justify-center rounded-[12px] bg-[#FFAB00] px-5 py-2 text-[14px] font-semibold text-ink transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                                  >
                                                    {submitTask ? "Submitting..." : "Submit"}
                                                  </button>
                                                </div>
                                              </form>
                                            )}
                                          </Disclosure.Panel>
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
                                      text="Add task"
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
                            className="inline-flex items-center justify-center rounded-[12px] border border-slate500_20 bg-white px-4 py-2 text-[14px] font-semibold text-ink hover:bg-slate500_08 dark:bg-transparent dark:text-white"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={submit || uploadingImage}
                            className="inline-flex items-center justify-center rounded-[12px] bg-[#1C252E] px-5 py-2 text-[14px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
