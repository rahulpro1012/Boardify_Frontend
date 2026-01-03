import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../../api/apiClient";

export type TaskDto = {
  id: number;
  listId: number;
  title: string;
  description?: string;
  position: number;
  assignedTo?: string;
};

export type UpdateTaskRequest = Partial<TaskDto> & {
  assignedTo?: string; // FIX: Backend Request expects this key
};

// Define the payload type for moving tasks
interface MoveTaskPayload {
  taskId: number;
  fromList: number;
  toList: number;
  targetIndex: number;
}

// 1. Fetch Tasks Thunk
export const fetchTasksForList = createAsyncThunk(
  "tasks/fetchForList",
  async (listId: number) => {
    const resp = await api.get<TaskDto[]>(`/api/lists/${listId}/tasks`);
    return { listId, tasks: resp.data };
  }
);

// 2. Create Task Thunk
export const createTask = createAsyncThunk(
  "tasks/create",
  async ({ listId, title }: { listId: number; title: string }) => {
    // The backend handles position calculation.
    // We send an empty description to satisfy any @NotNull checks if they exist,
    // though your backend logic seems to handle nulls fine too.
    const resp = await api.post<TaskDto>(`/api/lists/${listId}/tasks`, {
      title,
      description: "",
    });
    return resp.data;
  }
);

// 3. Update Task (Description, Title, etc.)
export const updateTask = createAsyncThunk(
  "tasks/update",
  async ({ taskId, data }: { taskId: number; data: Partial<TaskDto> }) => {
    const resp = await api.put<TaskDto>(`/api/tasks/${taskId}`, data);
    return resp.data;
  }
);

// [NEW] Delete Task
export const deleteTask = createAsyncThunk(
  "tasks/delete",
  async ({ taskId, listId }: { taskId: number; listId: number }) => {
    await api.delete(`/api/tasks/${taskId}`); //
    return { taskId, listId };
  }
);

const slice = createSlice({
  name: "tasks",
  initialState: {
    byList: {} as Record<number, TaskDto[]>,
    loading: false,
    error: null as string | null,
  },
  reducers: {
    moveLocal(state, action: PayloadAction<MoveTaskPayload>) {
      const { taskId, fromList, toList, targetIndex } = action.payload;

      // 1. Get the source list
      const sourceList = state.byList[fromList];
      if (!sourceList) return;

      // 2. Find and remove the task
      const taskIndex = sourceList.findIndex((t) => t.id === taskId);
      if (taskIndex === -1) return;

      const [task] = sourceList.splice(taskIndex, 1);

      // 3. Update task's internal listId
      task.listId = toList;

      // 4. Handle Destination
      if (fromList === toList) {
        // SAME LIST
        sourceList.splice(targetIndex, 0, task);
        // Recalculate positions (visual only)
        sourceList.forEach((t, i) => (t.position = i));
      } else {
        // DIFFERENT LIST
        const targetList = state.byList[toList];
        if (targetList) {
          targetList.splice(targetIndex, 0, task);
          // Recalculate positions
          sourceList.forEach((t, i) => (t.position = i));
          targetList.forEach((t, i) => (t.position = i));
        }
      }
    },
  },
  extraReducers: (builder) => {
    // --- 1. FETCH TASKS (Restored) ---
    // This was missing! It's why tasks might not have been appearing correctly.
    builder.addCase(fetchTasksForList.fulfilled, (state, action) => {
      const sortedTasks = action.payload.tasks.sort(
        (a, b) => a.position - b.position
      );
      state.byList[action.payload.listId] = sortedTasks;
    });

    // --- 2. CREATE TASK ---
    builder.addCase(createTask.fulfilled, (state, action) => {
      const newTask = action.payload;
      if (!state.byList[newTask.listId]) {
        state.byList[newTask.listId] = [];
      }
      state.byList[newTask.listId].push(newTask);
    });

    // --- 3. UPDATE TASK ---
    builder.addCase(updateTask.fulfilled, (state, action) => {
      const updatedTask = action.payload;
      const list = state.byList[updatedTask.listId];
      if (list) {
        const index = list.findIndex((t) => t.id === updatedTask.id);
        if (index !== -1) {
          list[index] = updatedTask;
        }
      }
    });

    // Delete
    builder.addCase(deleteTask.fulfilled, (state, action) => {
      const { taskId, listId } = action.payload;
      if (state.byList[listId]) {
        state.byList[listId] = state.byList[listId].filter(
          (t) => t.id !== taskId
        );
      }
    });
  },
});

export const { moveLocal } = slice.actions;
export default slice.reducer;
