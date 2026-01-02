import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/apiClient";

export type BoardDto = {
  id: number;
  name: string;
  createdBy?: string;
  memberEmails?: string[];
};

// --- THUNKS ---

// 1. Fetch all boards (Dashboard)
export const fetchBoards = createAsyncThunk("boards/fetch", async () => {
  const resp = await api.get<BoardDto[]>("/api/boards");
  return resp.data;
});

// 2. Fetch Single Board (Board Detail View)
export const fetchBoardById = createAsyncThunk(
  "boards/fetchById",
  async (boardId: number) => {
    const resp = await api.get<BoardDto>(`/api/boards/${boardId}`);
    return resp.data;
  }
);

// 3. Create a board
export const createBoard = createAsyncThunk(
  "boards/create",
  async (name: string) => {
    const resp = await api.post<BoardDto>("/api/boards", {
      name,
      memberEmails: [],
    });
    return resp.data;
  }
);

// 4. Update Board (Rename)
export const updateBoard = createAsyncThunk(
  "boards/update",
  async ({ boardId, name }: { boardId: number; name: string }) => {
    const resp = await api.put<BoardDto>(`/api/boards/${boardId}`, { name });
    return resp.data;
  }
);

// 5. Delete Board
export const deleteBoard = createAsyncThunk(
  "boards/delete",
  async (boardId: number) => {
    await api.delete(`/api/boards/${boardId}`);
    return boardId; // Return ID so we can remove it from state
  }
);

// 6. Add Member
export const addBoardMember = createAsyncThunk(
  "boards/addMember",
  async ({ boardId, email }: { boardId: number; email: string }) => {
    await api.post(`/api/boards/${boardId}/members`, { memberEmail: email });
    return email; // Return email to update local state
  }
);

// 7. Remove Member
export const removeBoardMember = createAsyncThunk(
  "boards/removeMember",
  async ({ boardId, email }: { boardId: number; email: string }) => {
    // Axios DELETE with body requires the `data` property
    await api.delete(`/api/boards/${boardId}/members`, {
      data: { memberEmail: email },
    });
    return email;
  }
);

// --- SLICE ---

const slice = createSlice({
  name: "boards",
  initialState: {
    items: [] as BoardDto[], // List of all boards
    currentBoard: null as BoardDto | null, // The specific board currently open
    loading: false,
    error: null as string | null,
    createStatus: "idle" as "idle" | "loading" | "succeeded" | "failed",
  },
  reducers: {
    clearBoardErrors: (state) => {
      state.error = null;
      state.createStatus = "idle";
    },
    // Useful to clear the current board when leaving the detail page
    clearCurrentBoard: (state) => {
      state.currentBoard = null;
    },
  },
  extraReducers: (builder) => {
    // --- Fetch All ---
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

    // --- Fetch Single ---
    builder.addCase(fetchBoardById.fulfilled, (state, action) => {
      state.currentBoard = action.payload;
    });

    // --- Create ---
    builder.addCase(createBoard.pending, (state) => {
      state.createStatus = "loading";
    });
    builder.addCase(createBoard.fulfilled, (state, action) => {
      state.createStatus = "succeeded";
      state.items.push(action.payload);
    });
    builder.addCase(createBoard.rejected, (state, action) => {
      state.createStatus = "failed";
      state.error = action.error.message ?? "Failed to create board";
    });

    // --- Update (Rename) ---
    builder.addCase(updateBoard.fulfilled, (state, action) => {
      // Update in the single view
      state.currentBoard = action.payload;
      // Update in the list view
      const index = state.items.findIndex((b) => b.id === action.payload.id);
      if (index !== -1) state.items[index] = action.payload;
    });

    // --- Delete ---
    builder.addCase(deleteBoard.fulfilled, (state, action) => {
      // Remove from list
      state.items = state.items.filter((b) => b.id !== action.payload);
      // If we deleted the board we are looking at, clear it
      if (state.currentBoard?.id === action.payload) {
        state.currentBoard = null;
      }
    });

    // --- Add Member ---
    builder.addCase(addBoardMember.fulfilled, (state, action) => {
      if (state.currentBoard) {
        // Initialize array if undefined
        if (!state.currentBoard.memberEmails)
          state.currentBoard.memberEmails = [];
        state.currentBoard.memberEmails.push(action.payload);
      }
    });

    // --- Remove Member ---
    builder.addCase(removeBoardMember.fulfilled, (state, action) => {
      if (state.currentBoard && state.currentBoard.memberEmails) {
        state.currentBoard.memberEmails =
          state.currentBoard.memberEmails.filter(
            (email) => email !== action.payload
          );
      }
    });
  },
});

export const { clearBoardErrors, clearCurrentBoard } = slice.actions;
export default slice.reducer;
