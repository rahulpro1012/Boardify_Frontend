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

// 2. Create List
export const createList = createAsyncThunk(
  "lists/create",
  async ({ boardId, name }: { boardId: number; name: string }) => {
    const resp = await api.post<ListDto>(`/api/boards/${boardId}/lists`, {
      name,
    });
    return resp.data;
  }
);

// 3. [NEW] Update List (Rename)
export const updateList = createAsyncThunk(
  "lists/update",
  async ({
    boardId,
    listId,
    name,
  }: {
    boardId: number;
    listId: number;
    name: string;
  }) => {
    const resp = await api.put<ListDto>(
      `/api/boards/${boardId}/lists/${listId}`,
      { name }
    );
    return resp.data;
  }
);

// 4. [NEW] Delete List
export const deleteList = createAsyncThunk(
  "lists/delete",
  async ({ boardId, listId }: { boardId: number; listId: number }) => {
    await api.delete(`/api/boards/${boardId}/lists/${listId}`);
    return listId;
  }
);

// 5. [NEW] Reorder List
export const reorderList = createAsyncThunk(
  "lists/reorder",
  async ({
    boardId,
    listId,
    targetIndex,
  }: {
    boardId: number;
    listId: number;
    targetIndex: number;
  }) => {
    await api.patch(`/api/boards/${boardId}/lists/${listId}/reorder`, {
      targetIndex,
    });
    return { listId, targetIndex }; // Return data to update UI if needed
  }
);

const slice = createSlice({
  name: "lists",
  initialState: {
    items: [] as ListDto[],
    loading: false,
    error: null as string | null,
    createStatus: "idle",
  },
  reducers: {
    clearLists: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
      state.createStatus = "idle";
    },
    // [NEW] Optimistic Reorder (Move column instantly)
    moveListLocal: (
      state,
      action: PayloadAction<{ fromIndex: number; toIndex: number }>
    ) => {
      const { fromIndex, toIndex } = action.payload;
      const list = state.items[fromIndex];
      state.items.splice(fromIndex, 1);
      state.items.splice(toIndex, 0, list);
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder.addCase(fetchLists.fulfilled, (state, action) => {
      state.loading = false;
      state.items = action.payload.sort((a, b) => a.position - b.position);
    });

    // Create
    builder.addCase(createList.fulfilled, (state, action) => {
      state.items.push(action.payload);
    });

    // Update (Rename)
    builder.addCase(updateList.fulfilled, (state, action) => {
      const index = state.items.findIndex((l) => l.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    });

    // Delete
    builder.addCase(deleteList.fulfilled, (state, action) => {
      state.items = state.items.filter((l) => l.id !== action.payload);
    });
  },
});

export const { clearLists, moveListLocal } = slice.actions;
export default slice.reducer;
