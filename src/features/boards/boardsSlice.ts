import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/apiClient";

export type BoardDto = {
  id: number;
  name: string;
  createdBy?: string;
};

// 1. Fetch all boards
export const fetchBoards = createAsyncThunk("boards/fetch", async () => {
  const resp = await api.get<BoardDto[]>("/api/boards");
  return resp.data;
});

// 2. NEW: Create a board
export const createBoard = createAsyncThunk(
  "boards/create",
  async (name: string) => {
    // Assuming your API expects { name: "..." } and returns the created Board object
    const resp = await api.post<BoardDto>("/api/boards", { name });
    return resp.data;
  }
);

const slice = createSlice({
  name: "boards",
  initialState: {
    items: [] as BoardDto[],
    loading: false,
    error: null as string | null,
    createStatus: "idle" as "idle" | "loading" | "succeeded" | "failed", // track creation separately
  },
  reducers: {
    // Optional: Helper to clear errors manually
    clearBoardErrors: (state) => {
      state.error = null;
      state.createStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    // --- Fetch Cases ---
    builder.addCase(fetchBoards.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchBoards.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload;
    });
    builder.addCase(fetchBoards.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? "Failed to load boards";
    });

    // --- Create Cases ---
    builder.addCase(createBoard.pending, (state) => {
      state.createStatus = "loading";
    });
    builder.addCase(createBoard.fulfilled, (state, action) => {
      state.createStatus = "succeeded";
      // Optimization: Add the new board directly to the list
      // This saves you from having to call fetchBoards() again!
      state.items.push(action.payload);
    });
    builder.addCase(createBoard.rejected, (state, action) => {
      state.createStatus = "failed";
      state.error = action.error.message ?? "Failed to create board";
    });
  },
});

export const { clearBoardErrors } = slice.actions;
export default slice.reducer;
