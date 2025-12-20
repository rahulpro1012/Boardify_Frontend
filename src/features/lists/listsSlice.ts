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

// 1. Fetch Lists
export const fetchLists = createAsyncThunk(
  "lists/fetch",
  async (boardId: number) => {
    const resp = await api.get<ListDto[]>(`/api/boards/${boardId}/lists`);
    return resp.data;
  }
);

// 2. NEW: Create List Thunk
export const createList = createAsyncThunk(
  "lists/create",
  async ({ boardId, name }: { boardId: number; name: string }) => {
    const resp = await api.post<ListDto>(`/api/boards/${boardId}/lists`, {
      name,
    });
    return resp.data;
  }
);

const slice = createSlice({
  name: "lists",
  initialState: {
    items: [] as ListDto[],
    loading: false,
    error: null as string | null,
    createStatus: "idle" as "idle" | "loading" | "failed", // Track creation
  },
  reducers: {
    clearLists: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.createStatus = "idle";
    },
    moveTaskLocal: (state) => {
      // Placeholder if you need list-specific moves
    },
  },
  extraReducers: (builder) => {
    // --- Fetch Lists ---
    builder.addCase(fetchLists.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchLists.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.sort((a, b) => a.position - b.position);
    });
    builder.addCase(fetchLists.rejected, (state, action) => {
      state.loading = false;
      state.error = action.error.message ?? "Failed to load lists";
    });

    // --- Create List ---
    builder.addCase(createList.pending, (state) => {
      state.createStatus = "loading";
    });
    builder.addCase(createList.fulfilled, (state, action) => {
      state.createStatus = "idle";
      state.items.push(action.payload); // Add new list to UI immediately
    });
    builder.addCase(createList.rejected, (state) => {
      state.createStatus = "failed";
    });
  },
});

export const { clearLists } = slice.actions;
export default slice.reducer;
