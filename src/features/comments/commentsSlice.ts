import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/apiClient";

export type CommentDto = {
  id: number;
  taskId: number;
  text: string;
  author: string;
  createdAt: string;
};

// 1. Fetch Comments
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
  async ({ taskId, text }: { taskId: number; text: string }) => {
    // FIX: Backend expects "text", not "content"
    const resp = await api.post<CommentDto>(`/api/tasks/${taskId}/comments`, {
      text,
    });
    return resp.data;
  }
);

const slice = createSlice({
  name: "comments",
  initialState: {
    byTask: {} as Record<number, CommentDto[]>,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchComments.fulfilled, (state, action) => {
      state.byTask[action.payload.taskId] = action.payload.comments;
    });
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
