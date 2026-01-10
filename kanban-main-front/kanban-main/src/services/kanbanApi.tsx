import axios from "axios";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";

const Base_URL: string = "https://kanban-backend-final.onrender.com/api";

// Configure axios with better defaults for performance
const apiClient = axios.create({
  baseURL: Base_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect on auth failure
      localStorage.removeItem("token");
      if (typeof window !== "undefined") {
        window.location.replace("/unauthorized");
      }
    }
    return Promise.reject(error);
  }
);

export { apiClient };
function authHeaders(isFormData = false) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const h: Record<string, string> = { Accept: "application/json" };
  if (!isFormData) h["Content-Type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// ==================== PROJECT APIs ====================

// Get all projects for the authenticated user
export async function fetchUserProjects(): Promise<GetListCustomResponse<any> | null> {
  try {
    const response = await apiClient.get("/projects");

    const customResponse: GetListCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return null;
  }
}

// Get a single project by ID
export async function fetchProjectById(
  projectId: number
): Promise<GetListCustomResponse<any> | null> {
  try {
    const response = await apiClient.get(`/projects/${projectId}`);

    const customResponse: GetListCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return null;
  }
}

// Create a new project
export async function createProject(
  title: string,
  description?: string
): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.post("/projects", {
      title,
      description: description || "",
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error creating project:", error);
    return null;
  }
}

// Update project
export async function updateProject(
  projectId: number,
  title: string,
  description?: string
): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.put(`/projects/${projectId}`, {
      title,
      description: description || "",
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error updating project:", error);
    return null;
  }
}

// Delete project
export async function deleteProject(
  projectId: number
): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.delete(`/projects/${projectId}`, {
      timeout: 30000, // ✅ 30s just for delete
    });

    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return null;
  }
}

// ✅ Delete List (admin)
export async function deleteList(listId: number): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.delete(`/lists/${listId}`);

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error: any) {
    console.error("Error deleting list:", error?.response?.data ?? error?.message);
    return null;
  }
}

// Add member to project
export async function addProjectMember(
  projectId: number,
  userId: number,
  role: "admin" | "member" = "member"
): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.post(`/projects/${projectId}/members`, {
      userId,
      role,
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error adding project member:", error);
    return null;
  }
}
// Delete Board (admin)
export async function DeleteBoard(
  boardid: number
): Promise<AddCustomResponse<any> | null> {
  try {
    // according to Postman: DELETE {{baseUrl}}/boards/{{boardid}}
    const response = await apiClient.delete(`/boards/${boardid}`);

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    console.log("✅ DeleteBoard OK:", customResponse);
    return customResponse;
  } catch (error: any) {
    console.error(
      "Error deleting board:",
      error?.response?.data ?? error?.message ?? error
    );
    return null;
  }
}



// Define a custom response type
interface GetListCustomResponse<T> {
  status: number;
  data: T;
}

// Define a custom response type for adding
interface AddCustomResponse<T> {
  status: number;
  data: T;
}

// Upload image to Cloudinary
export async function uploadImageToCloudinary(
  file: File
): Promise<AddCustomResponse<any> | null> {
  try {
    // File validation
    if (!file) {
      throw new Error("No file selected");
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error("File size must be less than 5MB");
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      throw new Error("Please select an image file");
    }

    const formData = new FormData();
    formData.append("image", file);

    console.log("Uploading image to Cloudinary:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    const response = await axios.post(`${Base_URL}/upload/image`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000, // 30 second timeout for uploads
    });

    console.log("Image upload response:", response.data);

    if (response.data.status === "success") {
      return {
        status: response.status,
        data: response.data.data, // Contains url, publicId, width, height
      };
    } else {
      throw new Error(response.data.message || "Upload failed");
    }
  } catch (error: any) {
    console.error("Error uploading image:", error);

    // More specific error messages
    let errorMessage = "Failed to upload image. Please try again.";

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.code === "ERR_NETWORK") {
      errorMessage = "Network error. Please check your connection.";
    } else if (error.code === "ECONNABORTED") {
      errorMessage = "Upload timeout. Please try again.";
    }

    throw new Error(errorMessage);
  }
}
// authentication and authorization by passing the userId
export async function authTheUserId(
  fkpoid: number | null,
  userid: number | null
): Promise<GetListCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/authuser?fkpoid=${fkpoid}&userid=${userid}`;

    const response = await axios.get(fetchUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        // NOTE: interceptor skips Authorization automatically for this URL
      },
    });

    // 🔑 Save token if backend returns it (try common shapes)
    const token =
      (response?.data && (response.data.token || response.data?.data?.token)) ||
      null;
    if (token) {
      localStorage.setItem("token", token); // boss’s #1 option (raw token)
      // If you prefer the other style boss mentioned:
      // localStorage.setItem("authToken", `Bearer ${token}`);
    }

    const customResponse: GetListCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error fetching data:", error);
    return error;
  }
}

// useOnDragEnd
export async function updateBoards(boards: any): Promise<Response> {
  const response = await fetch(Base_URL, {
    method: "PUT",
    headers: authHeaders(false),
    body: JSON.stringify(boards),
  });
  return response;
}

// useOnDragEnd
export async function useOnDragEndColumns(
  mid: any,
  did: any
): Promise<Response> {
  const response = await fetch(`${Base_URL}/ProjBoards/useondragcolumns`, {
    method: "PUT",
    headers: authHeaders(false),
    body: JSON.stringify({ mid, did }),
  });
  return response;
}

// useOnDragEnd
export async function useOnDragEndTaskSameColumn(
  mid: any,
  did: any
): Promise<Response> {
  const response = await fetch(
    `${Base_URL}/ProjBoards/useondragtasksamecolumn`,
    {
      method: "PUT",
      headers: authHeaders(false),

      body: JSON.stringify({ mid, did }),
    }
  );
  return response;
}

// useOnDragEnd
export async function useOnDragEndTask(
  cmid: any,
  cdid: any,
  mid: any,
  did: any
): Promise<Response> {
  const response = await fetch(`${Base_URL}/ProjBoards/useondragtask`, {
    method: "PUT",
    headers: authHeaders(false),
    body: JSON.stringify({ cmid, cdid, mid, did }),
  });
  return response;
}

// on loading the page first check and fetch Board List
export async function fetchInitialBoards(
  id: any
): Promise<GetListCustomResponse<any> | null> {
  try {
    const response = await apiClient.get(
      `/ProjKanbanBoards/getBoardlist?fkpoid=${id}`
    );

    const customResponse: GetListCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error fetching boards:", error);
    return null;
  }
}

// Add Board
export async function AddBoard(
  title: string,
  fkpoid: number | null,
  addedbyid: number | null,
  addedby: string
): Promise<AddCustomResponse<any> | null> {
  try {
    const newBoard = {
      title: title,
      fkpoid: fkpoid,
      addedby: addedby,
      addedbyid: addedbyid,
    };
    console.log("📤 AddBoard payload:", newBoard);

    // Use apiClient instead of axios to automatically include auth token
    const response = await apiClient.post(
      "/ProjKanbanBoards/addboard",
      newBoard
    );

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };
    return customResponse;
  } catch (error: any) {
    console.error("AddBoard failed:", error?.response?.data ?? error?.message);
    return null;
  }
}

// Edit Board
export async function EditBoard(
  title: string,
  boardid: number | null,
  updatedby: string
): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.post("/ProjKanbanBoards/editboard", {
      title: title,
      boardid: boardid,
      updatedby: updatedby,
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };
    return customResponse;
  } catch (error: any) {
    console.error("Error editing board:", error);
    return null;
  }
}

// on loading the page first check and fetch Board List
export async function fetchKanbanList(id: any): Promise<any> {
  try {
    const response = await apiClient.get(
      `/ProjKanbanBoards/getkanbanlist?fkboardid=${id}`
    );

    if (!response) {
      throw new Error("Network response was not ok");
    }

    return response.data;
  } catch (error) {
    console.error("Error fetching kanban list:", error);
    return null;
  }
}

//add Kanban list by passing the fkboardid
export async function AddKanbanList(
  title: string,
  fkboardid: number | null,
  addedby: string,
  addedbyid: number | null,
  fkpoid: number | null
): Promise<AddCustomResponse<any> | null> {
  try {
    const newList = {
      title: title,
      fkboardid: fkboardid,
      addedby: addedby,
      addedbyid: addedbyid,
      fkpoid: fkpoid,
    };

    const response = await apiClient.post(
      "/ProjKanbanBoards/addkanbanlist",
      newList
    );

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error adding kanban list:", error);
    return null;
  }
}

//add card list by passing the fkboardid
export async function EditListName(
  title: string,
  listid: number | null,
  updatedby: string,
  fkboardid: number | null,
  fkpoid: number | null
): Promise<AddCustomResponse<any> | null> {
  try {
    const newList = {
      title: title,
      listid: listid,
      updatedby: updatedby,
      fkboardid: fkboardid,
      fkpoid: fkpoid,
    };

    const response = await apiClient.post(
      "/ProjKanbanBoards/editlistname",
      newList
    );

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error editing list name:", error);
    return null;
  }
}

//add card
export async function AddCard(
  title: string,
  fkKanbanListId: number | null,
  addedby: string,
  addedbyid: number | null,
  fkboardid: number | null,
  fkpoid: number | null
): Promise<AddCustomResponse<any> | null> {
  try {
    const newList = {
      title: title,
      fkKanbanListId: fkKanbanListId,
      addedby: addedby,
      addedbyid: addedbyid,
      fkboardid: fkboardid,
      fkpoid: fkpoid,
    };

    const response = await apiClient.post("/ProjKanbanBoards/addcard", newList);

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error adding card:", error);
    return null;
  }
}

//EDIT card

// title: string,
// kanbanCardId: number | null,
// updatedby: string,
// desc: string | null,
// uploadImage: File | null,
// completed: boolean | null,
// startEndDate: DateValueType | null,
export async function EditCard(cardData: {
  title: string;
  kanbanCardId: number;
  updatedby: string;
  desc: string;
  imageUrl?: string;
  imagePublicId?: string;
  completed: boolean;
  startDate?: Date | string;
  endDate?: Date | string;
  fkboardid: string;
  fkpoid: string;
}): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.post(
      "/ProjKanbanBoards/editcard",
      cardData
    );

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error editing card:", error);
    return null;
  }
}

//add Tag
export async function AddTag(
  title: string,
  color: string,
  fkKanbanCardId: number | null,
  addedby: string,
  addedbyid: number | null
): Promise<AddCustomResponse<any> | null> {
  try {
    const newList = {
      title: title,
      color: color,
      fkKanbanCardId: fkKanbanCardId,
      addedby: addedby,
      addedbyid: addedbyid,
    };

    const response = await apiClient.post("/ProjKanbanBoards/addTag", newList);

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error adding tag:", error);
    return null;
  }
}

//delete Tag
export async function DeleteTag(
  tagid: number
): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.get(
      `/ProjKanbanBoards/deletetag?tagid=${tagid}`
    );

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error deleting tag:", error);
    return null;
  }
}

// on loading the page first check and fetch Board List
export async function fetchAllMembers(): Promise<GetListCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/getmembers`;
    const response = await axios.get(fetchUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: GetListCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error fetching data:", error);
    return error; // Or any appropriate error handling
  }
}

//Add Task
export async function AddTask(
  title: string,
  fkKanbanCardId: number | null,
  addedby: string,
  addedbyid: number | null,
  selectedOptions: string,
  fkboardid: number | null,
  fkpoid: number | null
): Promise<AddCustomResponse<any> | null> {
  try {
    const newList = {
      title: title,
      fkKanbanCardId: fkKanbanCardId,
      addedby: addedby,
      addedbyid: addedbyid,
      selectedOptions: selectedOptions,
      fkboardid: fkboardid,
      fkpoid: fkpoid,
    };

    const response = await apiClient.post("/ProjKanbanBoards/addtask", newList);

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error adding task:", error);
    return null;
  }
}

//delete Task
export async function DeleteTask(
  taskid: number
): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.get(
      `/ProjKanbanBoards/deletetask?taskid=${taskid}`
    );

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error deleting task:", error);
    return null;
  }
}

//submit Task (with Cloudinary URL for file)
export async function SubmitTask(
  kanbanTaskId: number,
  updatedby: string,
  completed: boolean,
  fileUrl: string | null,
  fkboardid: number,
  fkpoid: number
): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.post("/ProjKanbanBoards/submittask", {
      KanbanTaskId: kanbanTaskId,
      updatedby: updatedby,
      completed: completed,
      fileUrl: fileUrl, // Cloudinary URL
      fkboardid: fkboardid,
      fkpoid: fkpoid,
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error submitting task:", error);
    return null;
  }
}

// useOnDragEnd List
export async function useOnDragEndList(
  draggedId: number,
  draggedSeqNo: number,
  destId: number,
  destSeqNo: number,
  updatedBy: string,
  action: string,
  fkBoardId: number,
  fkpoid: number
): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.post("/ProjKanbanBoards/useondraglist", {
      draggedId,
      draggedSeqNo,
      destId,
      destSeqNo,
      updatedBy,
      action,
      fkBoardId,
      fkpoid,
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error dragging list:", error);
    return null;
  }
}

// useOnDragEnd Card
export async function useOnDragEndCard(
  sourceListId: number,
  destinationListId: number,
  kanbanCardId: number,
  cardTiltle: string,
  updatedBy: string,
  oldSeqNo: number,
  newSeqNo: number,
  fkBoardId: number,
  fkpoid: number
): Promise<AddCustomResponse<any> | null> {
  try {
    const response = await apiClient.post("/ProjKanbanBoards/useondragcard", {
      sourceListId,
      destinationListId,
      kanbanCardId,
      cardTiltle,
      updatedBy,
      oldSeqNo,
      newSeqNo,
      fkBoardId,
      fkpoid,
    });

    const customResponse: AddCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error) {
    console.error("Error dragging card:", error);
    return null;
  }
}

// on loading the page first check and fetch Board List then fetch online users
export async function fetchOnlineUsers(
  id: any
): Promise<GetListCustomResponse<any> | null> {
  try {
    const fetchUrl = `${Base_URL}/ProjKanbanBoards/getonlineusers?fkpoid=${id}`;
    const response = await axios.get(fetchUrl, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const customResponse: GetListCustomResponse<any> = {
      status: response.status,
      data: response.data,
    };

    return customResponse;
  } catch (error: any) {
    console.error("Error fetching data:", error);
    return error; // Or any appropriate error handling
  }
}
