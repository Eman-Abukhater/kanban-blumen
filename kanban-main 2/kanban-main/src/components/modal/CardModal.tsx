// src/components/modal/CardModal.tsx
import { Fragment, useContext, useRef, useState } from "react";
import { Dialog, Transition, Disclosure } from "@headlessui/react";
import {
  CheckIcon,
  DocumentCheckIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChevronUpIcon } from "@heroicons/react/20/solid";
import KanbanContext from "../../context/kanbanContext";
import useAutosizeTextArea from "../../hooks/useAutosizeTextarea";
import { KanbanCard, KanbanTask } from "../kanban/KanbanTypes";
import Datepicker from "react-tailwindcss-datepicker";
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

export interface CardModalProps {
  listIndex: number;
  cardIndex: number;
  card: KanbanCard;
}

export function CardModal(props: CardModalProps) {
  const imageTextAreaRef = useRef<HTMLTextAreaElement>(null);
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

  let imageUrl = file?.name;
  if (!file || file === undefined || (file as any).length < 1) {
    if (props.card.imageUrl) {
      imageUrl = props.card.imageUrl;
    }
  }

  const {
    handleDeleteCard,
    handleUpdateCard,
    handleCloseModal,
    modalState,
    userInfo,
  } = useContext(KanbanContext);

  useAutosizeTextArea(descTextAreaRef, desc);

  // ================= IMAGE UPLOAD =================
  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      setFileSizeExceeded(false);

      const uploadResult = await uploadImageToCloudinary(file);

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
            {
              position: toast.POSITION.TOP_CENTER,
            }
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
      toast.error("Title is required", {
        position: toast.POSITION.TOP_CENTER,
      });
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
    };

    mutation.mutate(cardData);
  };

  const deleteCard = () => {
    toast.info(` Please Contact The Admin as you are not Authorized`, {
      position: toast.POSITION.TOP_CENTER,
    });
    // handleDeleteCard(props.listIndex, props.cardIndex);
    // handleCloseModal();
  };

  // ================= TAGS =================
  const handleCreateTag = async (tagName: string, colorIndex: number) => {
    if (tagName) {
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
          toast.success(
            `Tag ID: ${customResponse?.data} Created Successfully`,
            {
              position: toast.POSITION.TOP_CENTER,
            }
          );
        }

        if (customResponse?.status != 200 || customResponse?.data == null) {
          toast.error(
            `something went wrong could not add the Tag, please try again later` +
              customResponse,
            {
              position: toast.POSITION.TOP_CENTER,
            }
          );
        }
      } finally {
        setIsCreatingTag(false);
      }
    } else {
      toast.error(`Tag Name is Empty`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  const handleDeleteTag = async (tagIndex: number, tagid: number) => {
    if (tagid) {
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
        }

        if (customResponse?.status != 200 || customResponse?.data == null) {
          toast.error(
            `something went wrong could not Remove the Tag, please try again later` +
              customResponse,
            {
              position: toast.POSITION.TOP_CENTER,
            }
          );
        }
      } finally {
        setIsDeletingTag(null);
      }
    } else {
      toast.error(`Tag ID is Empty`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  // ================= TASKS (SUBTASKS TAB) =================
  const handleDeleteTask = async (taskIndex: number, taskid: number) => {
    if (taskid) {
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
        }

        if (customResponse?.status != 200 || customResponse?.data == null) {
          toast.error(
            `something went wrong could not Remove the Task, please try again later` +
              customResponse,
            {
              position: toast.POSITION.TOP_CENTER,
            }
          );
        }
      } finally {
        setIsDeletingTask(null);
      }
    } else {
      toast.error(`Task ID is Empty`, {
        position: toast.POSITION.TOP_CENTER,
      });
    }
  };

  const handleCreateTask = async (taskTitle: string, selectedOptions: any[]) => {
    if (taskTitle) {
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
          toast.success(
            `Task ID: ${customResponse?.data} Created Successfully`,
            {
              position: toast.POSITION.TOP_CENTER,
            }
          );
        }

        if (customResponse?.status != 200 || customResponse?.data == null) {
          toast.error(
            `something went wrong could not add the Task, please try again later` +
              customResponse,
            {
              position: toast.POSITION.TOP_CENTER,
            }
          );
        }
      } finally {
        setIsCreatingTask(false);
      }
    } else {
      toast.error(`Task Title is Empty`, {
        position: toast.POSITION.TOP_CENTER,
      });
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
        if (fileUrl) {
          tempTask[index].imageUrl = fileUrl;
        }
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
      toast.error(err, {
        position: "top-center",
      });
      setSubmit(false);
      return err.response;
    }
  };

  const handleToggleTaskCompleted = () => {
    setTaskCompleted((prev) => !prev);
  };

  // ================= RENDER =================
  return (
    <Transition appear show={modalState.isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={handleCloseModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-250"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-250"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-500 bg-opacity-40 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0">
          <div className="absolute inset-0">
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
                <Dialog.Panel className="pointer-events-auto w-screen max-w-2xl">
                  <div className="flex h-full flex-col bg-white shadow-xl dark:bg-slate-900">
                    {/* Header: status + close/delete */}
                    <div className="flex items-center justify-between border-b border-slate500_12 px-6 py-4 dark:border-slate500_20">
                      {/* status button (Done / In progress) */}
                      <button
                        type="button"
                        onClick={() => setCompleted((prev) => !prev)}
                        className={classNames(
                          "inline-flex items-center gap-2 rounded-[10px] border px-3 py-1 text-sm font-semibold",
                          completed
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "border-slate500_20 bg-[#F9FAFB] text-slate600 dark:border-slate500_20 dark:bg-[#020617] dark:text-slate500_80"
                        )}
                      >
                        {completed ? (
                          <>
                            <CheckIcon className="h-4 w-4" />
                            Done
                          </>
                        ) : (
                          <>In progress</>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={deleteCard}
                          type="button"
                          className="inline-flex items-center justify-center rounded-full p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20"
                        >
                          <TrashIcon className="h-5 w-5 text-red-600" />
                        </button>
                        <button
                          onClick={handleCloseModal}
                          type="button"
                          className="inline-flex items-center justify-center rounded-full p-2 hover:bg-slate500_12 dark:hover:bg-slate500_20"
                        >
                          <XMarkIcon className="h-5 w-5 text-slate500" />
                        </button>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-slate500_12 px-6 py-3 dark:border-slate500_20">
                      <div className="inline-flex rounded-full bg-[#F4F6F8] p-1 text-[13px] dark:bg-[#020617]">
                        <button
                          type="button"
                          onClick={() => setActiveTab("overview")}
                          className={classNames(
                            "rounded-full px-4 py-1 font-medium",
                            activeTab === "overview"
                              ? "bg-white shadow-sm text-ink dark:bg-slate-800 dark:text-white"
                              : "text-slate500 dark:text-slate500_80"
                          )}
                        >
                          Overview
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("subtasks")}
                          className={classNames(
                            "rounded-full px-4 py-1 font-medium",
                            activeTab === "subtasks"
                              ? "bg-white shadow-sm text-ink dark:bg-slate-800 dark:text-white"
                              : "text-slate500 dark:text-slate500_80"
                          )}
                        >
                          Subtasks
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-6">
                      {/* title (always visible) */}
                      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                        <input
                          className="flex-1 rounded-[12px] border border-slate500_20 px-4 py-3 text-lg font-semibold text-ink outline-none transition-all duration-150 hover:border-slate500 focus:border-slate600 dark:border-slate500_20 dark:bg-slate-900 dark:text-white"
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          minLength={3}
                        />
                      </div>

                      {/* ============= OVERVIEW TAB ============= */}
                      {activeTab === "overview" && (
                        <>
                          {/* Date */}
                          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <span className="w-28 text-sm text-slate500 dark:text-slate-400">
                              Due date
                            </span>
                            <Datepicker
                              value={date}
                              onChange={setDate}
                              inputClassName="border border-slate500_20 rounded-[10px] text-[14px] px-3 py-2 w-full dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Description */}
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <span className="w-28 text-sm text-slate500 dark:text-slate-400">
                              Description
                            </span>
                            <textarea
                              ref={descTextAreaRef}
                              className="max-h-40 w-full rounded-[12px] border border-slate500_20 bg-white px-3 py-3 text-[14px] text-ink placeholder:text-slate400 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate500_20 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500"
                              placeholder="Description..."
                              value={desc}
                              onChange={(e) => setDesc(e.target.value)}
                              minLength={3}
                            />
                          </div>

                          {/* Image */}
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <span
                              className="w-28 text-sm text-slate500 dark:text-slate-400"
                              style={{ width: "92px" }}
                            >
                              Image
                            </span>
                            <div className="flex flex-col gap-3">
                              <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed border-slate500_20 bg-[#F9FAFB] text-[12px] text-slate500 hover:border-slate500 dark:border-slate500_20 dark:bg-slate-900 dark:text-slate-400">
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
                                          {
                                            position:
                                              toast.POSITION.TOP_CENTER,
                                          }
                                        );
                                        return;
                                      }

                                      setFileSizeExceeded(false);
                                      setFile(selectedFile);

                                      // upload + preview
                                      handleImageUpload(selectedFile);
                                      const imageURL =
                                        URL.createObjectURL(selectedFile);
                                      setImageUrl(imageURL);
                                    } else {
                                      setFile(null);
                                      setImageUrl("");
                                      setFileSizeExceeded(false);
                                    }
                                  }}
                                />
                                <span className="mb-1 text-xl">☁️</span>
                                <span>Upload</span>
                              </label>

                              {uploadingImage && (
                                <span className="text-sm text-emerald-600">
                                  Uploading...
                                </span>
                              )}

                              {(displayImage || cloudinaryUrl) && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={cloudinaryUrl || displayImage}
                                  alt="Card image"
                                  className="mt-1 h-40 w-full max-w-sm rounded-[16px] border border-slate500_12 object-cover dark:border-slate500_20"
                                />
                              )}

                              {fileSizeExceeded && (
                                <p className="text-xs font-semibold text-red-600">
                                  File size exceeded the limit of 5MB
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3">
                            <span className="w-28 text-sm text-slate500 dark:text-slate-400">
                              Tag
                            </span>
                            <div className="flex w-full flex-wrap gap-2">
                              {kanbanTags.map((tag, index) => (
                                <div
                                  key={tag.kanbanTagId ?? index}
                                  className={`flex items-center gap-1 rounded-[999px] py-1 pl-3 pr-1 text-xs font-semibold hover:bg-opacity-80 ${
                                    tag.color
                                  } ${
                                    isDeletingTag === tag.kanbanTagId
                                      ? "opacity-50"
                                      : ""
                                  }`}
                                  role="button"
                                  aria-label="remove tag"
                                >
                                  <span>{tag.title}</span>

                                  {tag.addedBy === userInfo.username && (
                                    <button
                                      onClick={() =>
                                        handleDeleteTag(index, tag.kanbanTagId)
                                      }
                                      disabled={
                                        isDeletingTag === tag.kanbanTagId
                                      }
                                      className="rounded-full p-0.5 hover:bg-black/10"
                                    >
                                      {isDeletingTag === tag.kanbanTagId ? (
                                        <svg
                                          className="h-4 w-4 animate-spin"
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
                                        <XMarkIcon className="h-4 w-4" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              ))}

                              {isCreatingTag && (
                                <div className="animate-pulse rounded-[999px] bg-slate-300 px-3 py-1 text-xs dark:bg-slate-600" />
                              )}

                              {kanbanTags.length < 6 && (
                                <button
                                  role="button"
                                  aria-label="create tag"
                                  onClick={() => setOpenTagModal(true)}
                                  disabled={isCreatingTag}
                                >
                                  <PlusIcon className="h-6 w-6 rounded-full border border-dashed border-slate-500 p-1 dark:border-white dark:stroke-slate-300" />
                                </button>
                              )}

                              <CreateTagModal
                                show={openTagModal}
                                handleClose={setOpenTagModal}
                                handleSubmit={handleCreateTag}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {/* ============= SUBTASKS TAB ============= */}
                      {activeTab === "subtasks" && (
                        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:gap-3">
                          <span className="w-28 text-sm dark:text-slate-500">
                            Tasks
                          </span>

                          <div className="w-full">
                            {kanbanTasks.map((_t, index) => (
                              <Disclosure
                                key={_t.kanbanTaskId ?? index}
                              >
                                {({ open }) => (
                                  <>
                                    <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800 dark:text-white">
                                      <div>
                                        <span className="ml-2">{_t.title}</span>
                                      </div>
                                      <div>
                                        <Disclosure.Button>
                                          <button
                                            style={{ marginRight: "7px" }}
                                            role="button"
                                            aria-label="update task"
                                          >
                                            <span className="sr-only">
                                              Submit task
                                            </span>

                                            {_t.completed ? (
                                              <span className="h-5 w-1 text-green-600 hover:text-green-500">
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  strokeWidth={1.5}
                                                  stroke="currentColor"
                                                  className="h-6 w-6"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
                                                  />
                                                </svg>
                                              </span>
                                            ) : (
                                              <span className="h-5 w-1 text-yellow-600 hover:text-yellow-500">
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  strokeWidth={1.5}
                                                  stroke="currentColor"
                                                  className="h-6 w-6"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                                                  />
                                                </svg>
                                              </span>
                                            )}
                                          </button>
                                        </Disclosure.Button>
                                        {_t.addedBy === userInfo.username &&
                                          _t.completed === false && (
                                            <button
                                              role="button"
                                              aria-label="delete task"
                                              onClick={() =>
                                                handleDeleteTask(
                                                  index,
                                                  _t.kanbanTaskId
                                                )
                                              }
                                              disabled={
                                                isDeletingTask ===
                                                _t.kanbanTaskId
                                              }
                                            >
                                              <span className="sr-only">
                                                Delete task
                                              </span>
                                              {isDeletingTask ===
                                              _t.kanbanTaskId ? (
                                                <svg
                                                  className="h-5 w-5 animate-spin text-red-600"
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
                                                <TrashIcon className="h-5 w-5 text-red-600 hover:text-red-500" />
                                              )}
                                            </button>
                                          )}
                                      </div>
                                    </div>

                                    <Disclosure.Panel className="px-4 pb-2 pt-4 text-sm text-black dark:text-white">
                                      {/* (same detail panel as your old code – unchanged) */}
                                      {/* created at / added by / assign to / complete / upload file / submit */}
                                      {/* ... */}
                                      {_t.completed ? (
                                        <>
                                          <div>
                                            <div
                                              className="flex"
                                              style={{ marginRight: "1rem" }}
                                            >
                                              <label htmlFor="completed">
                                                Completed:
                                              </label>
                                              <div
                                                className="h-5 w-1 text-green-600 hover:text-green-500"
                                                style={{
                                                  marginLeft: "4px",
                                                  fontWeight: "bolder",
                                                }}
                                              >
                                                <svg
                                                  xmlns="http://www.w3.org/2000/svg"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                  strokeWidth={1.5}
                                                  stroke="currentColor"
                                                  className="h-6 w-6"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                  />
                                                </svg>
                                              </div>
                                            </div>
                                            <div
                                              className="flex"
                                              style={{ marginRight: "1rem" }}
                                            >
                                              <label htmlFor="imageUrl">
                                                Uploaded File:
                                              </label>
                                              <div
                                                style={{
                                                  marginLeft: "4px",
                                                  fontWeight: "bolder",
                                                }}
                                              >
                                                <a
                                                  href={`${_t.imageUrl}`}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="h-6 w-6"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                                    />
                                                  </svg>
                                                </a>
                                              </div>
                                            </div>
                                          </div>
                                          <div
                                            className="flex"
                                            style={{ marginRight: "1rem" }}
                                          >
                                            <label htmlFor="completed">
                                              Submit By:
                                            </label>
                                            <span
                                              style={{
                                                marginLeft: "4px",
                                                fontWeight: "bolder",
                                              }}
                                            >
                                              {_t.updatedBy}
                                            </span>
                                          </div>
                                        </>
                                      ) : (
                                        <form>
                                          <div style={{ paddingTop: "5px" }}>
                                            <label htmlFor="completed">
                                              Completed:
                                            </label>
                                            <span
                                              style={{
                                                marginLeft: "4px",
                                                fontWeight: "bolder",
                                              }}
                                            >
                                              <input
                                                type="checkbox"
                                                className="h-5 w-5 rounded-md"
                                                value={
                                                  taskCompleted ? "on" : "off"
                                                }
                                                checked={taskCompleted}
                                                onChange={() =>
                                                  handleToggleTaskCompleted()
                                                }
                                                required
                                              />
                                            </span>
                                          </div>
                                          <div
                                            className="flex items-center"
                                            style={{ paddingTop: "7px" }}
                                          >
                                            <label htmlFor="imageUrl">
                                              Upload File:
                                            </label>
                                            <span
                                              style={{
                                                marginLeft: "4px",
                                                fontWeight: "bolder",
                                              }}
                                            >
                                              <input
                                                onChange={(e) => {
                                                  const selectedFile =
                                                    e.target.files?.[0];

                                                  if (selectedFile) {
                                                    if (
                                                      selectedFile.size >
                                                      maxFileSize
                                                    ) {
                                                      setTaskFileSizeExceeded(
                                                        true
                                                      );
                                                      return;
                                                    }
                                                    setTaskFile(selectedFile);
                                                  } else {
                                                    setTaskFile(null);
                                                    setTaskFileSizeExceeded(
                                                      false
                                                    );
                                                  }
                                                }}
                                                className="focus:border-primary focus:shadow-te-primary dark:focus:border-primary relative m-0 block max-h-5 w-full min-w-0 flex-auto cursor-pointer rounded border border-solid border-neutral-300 bg-clip-padding px-3 py-[0.32rem] text-xs font-normal text-neutral-700 transition duration-300 ease-in-out file:-mx-3 file:-my-[0.32rem] file:cursor-pointer file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 file:px-3 file:py-[0.32rem] file:text-neutral-700 file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem] focus:text-neutral-700 focus:outline-none hover:file:bg-neutral-200 dark:border-neutral-600 dark:text-neutral-200 dark:file:bg-neutral-700 dark:file:text-neutral-100"
                                                type="file"
                                                accept=".xlsx,.xls,image/*,.doc, .docx,.ppt, .pptx,.txt,.pdf"
                                              />
                                              {taskFileSizeExceeded && (
                                                <div className="mt-4 flex flex-col gap-2 font-bold sm:flex-row sm:gap-3">
                                                  <span className="w-28 text-sm text-red-600">
                                                    ERROR:
                                                  </span>
                                                  <p className=" text-red-600 hover:text-red-500">
                                                    File size exceeded the limit
                                                    of 5MB
                                                  </p>
                                                </div>
                                              )}
                                            </span>
                                          </div>
                                          <div style={{ paddingTop: "18px" }}>
                                            <button
                                              onClick={() =>
                                                handleSubmitTask(
                                                  _t.kanbanTaskId,
                                                  index
                                                )
                                              }
                                              disabled={submitTask}
                                              type="submit"
                                              className="inline-flex items-center justify-center gap-1 rounded-md border border-transparent bg-emerald-700 px-3 py-1 text-base text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-emerald-600"
                                            >
                                              {submitTask ? (
                                                <>
                                                  <svg
                                                    className="h-5 w-5 animate-spin"
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
                                                  Submitting...
                                                </>
                                              ) : (
                                                <>
                                                  <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={1.5}
                                                    stroke="currentColor"
                                                    className="h-6 w-6"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                  </svg>
                                                  Submit
                                                </>
                                              )}
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
                              <div className="mb-2 animate-pulse rounded-lg bg-slate-100 px-4 py-3 dark:bg-slate-800">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="h-5 w-3/4 rounded bg-slate-300 dark:bg-slate-600"></div>
                                  </div>
                                  <div className="flex gap-2">
                                    <div className="h-5 w-5 rounded bg-slate-300 dark:bg-slate-600"></div>
                                  </div>
                                </div>
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
                      )}
                    </div>

                    {/* footer */}
                    <div className="flex justify-between border-t border-slate-200 px-6 py-4 backdrop-blur-sm dark:border-slate-700">
                      <div>
                        <button
                          onClick={deleteCard}
                          type="button"
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-transparent bg-red-700 px-3 py-1 text-base font-medium text-white transition-colors duration-150 hover:bg-red-600"
                        >
                          <TrashIcon className="h-5 w-5" />
                          Delete card
                        </button>
                      </div>
                      <div className="flex justify-end gap-2 sm:gap-3">
                        <button
                          disabled={submit}
                          onClick={handleSave}
                          type="button"
                          className="inline-flex items-center justify-center gap-1 rounded-md border border-transparent bg-emerald-700 px-3 py-1 text-base font-medium text-white transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-emerald-600"
                        >
                          {submit ? (
                            <>
                              <svg
                                className="h-5 w-5 animate-spin"
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
                              Saving...
                            </>
                          ) : (
                            <>
                              <DocumentCheckIcon className="h-5 w-5" />
                              Save
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleCloseModal}
                          type="button"
                          className="inline-flex justify-center rounded-md border bg-transparent px-3 py-1 text-base font-medium transition-colors duration-150 hover:border-indigo-600 hover:text-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 dark:text-white"
                        >
                          Cancel
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
  );
}
