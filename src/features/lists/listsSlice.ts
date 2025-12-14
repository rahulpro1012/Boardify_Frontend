import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import api from "../../api/apiClient";

export type ListDto = {
  id: number;
  boardId: number;
  name: string;
  position: number;
};

export const fetchLists = createAsyncThunk(
  "lists/fetch",
  async (boardId: number) => {
    const resp = await api.get<ListDto[]>(`/api/boards/${boardId}/lists`);
    return resp.data;
  }
);

const slice = createSlice({
  name: "lists",
  initialState: {
    items: [] as ListDto[],
    loading: false,
    error: null as string | null,
  },
  reducers: {
    // 1. Clears data when leaving the board view (prevents old data flashing)
    clearLists: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
    // 2. Optimistic: Add list immediately to UI
    addListLocal: (state, action: PayloadAction<ListDto>) => {
      state.items.push(action.payload);
    },
    // 3. Optimistic: Remove list immediately
    removeListLocal: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((l) => l.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchLists.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLists.fulfilled, (state, action) => {
      state.loading = false;
      // 4. CRITICAL: Always sort lists by position to ensure columns stay in order
      state.items = action.payload.sort((a, b) => a.position - b.position);
    });
    builder.addCase(fetchLists.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? "Failed to load lists";
    });
  },
});

export const { clearLists, addListLocal, removeListLocal } = slice.actions;
export default slice.reducer;
