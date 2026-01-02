import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/apiClient";

export type CommentDto = {
  id: number;
  taskId: number;
  content: string;
  authorEmail: string;
  createdAt: string;
};

// 1. Fetch Comments for a Task
export const fetchComments = createAsyncThunk(
  "comments/fetch",
  async (taskId: number) => {
    const resp = await api.get<CommentDto[]>(`/api/tasks/${taskId}/comments`);
    return { taskId, comments: resp.data };
  }
);

// 2. Add a Comment
export const createComment = createAsyncThunk(
  "comments/create",
  async ({ taskId, content }: { taskId: number; content: string }) => {
    const resp = await api.post<CommentDto>(`/api/tasks/${taskId}/comments`, {
      content,
    });
    return resp.data;
  }
);

const slice = createSlice({
  name: "comments",
  initialState: {
    byTask: {} as Record<number, CommentDto[]>, // Map taskId -> comments[]
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchComments.fulfilled, (state, action) => {
      state.byTask[action.payload.taskId] = action.payload.comments;
    });
    // Create
    builder.addCase(createComment.fulfilled, (state, action) => {
      const comment = action.payload;
      if (!state.byTask[comment.taskId]) {
        state.byTask[comment.taskId] = [];
      }
      state.byTask[comment.taskId].push(comment);
    });
  },
});

export default slice.reducer;
