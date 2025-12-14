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
};

// Define the payload type for moving tasks
interface MoveTaskPayload {
  taskId: number;
  fromList: number;
  toList: number;
  targetIndex: number;
}

export const fetchTasksForList = createAsyncThunk(
  "tasks/fetchForList",
  async (listId: number) => {
    const resp = await api.get<TaskDto[]>(`/api/lists/${listId}/tasks`);
    return { listId, tasks: resp.data };
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
        // SAME LIST: We insert back into the SAME array we just spliced from
        sourceList.splice(targetIndex, 0, task);

        // Recalculate positions for this list only
        sourceList.forEach((t, i) => (t.position = i));
      } else {
        // DIFFERENT LIST: Get target list
        const targetList = state.byList[toList];
        if (targetList) {
          targetList.splice(targetIndex, 0, task);

          // Recalculate positions for both lists
          sourceList.forEach((t, i) => (t.position = i));
          targetList.forEach((t, i) => (t.position = i));
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchTasksForList.fulfilled, (state, action) => {
      // 5. CRITICAL: Always sort by position when fetching
      // This ensures the initial render matches the visual order
      const sortedTasks = action.payload.tasks.sort(
        (a, b) => a.position - b.position
      );
      state.byList[action.payload.listId] = sortedTasks;
    });
  },
});

export const { moveLocal } = slice.actions;
export default slice.reducer;
