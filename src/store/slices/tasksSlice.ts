import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/services/settings/tasks";

// types
import type { Task } from "@/types/settings";

// utils
import { getApiErrorMessage } from "@/utils";

interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  isLoading: false,
  error: null,
};

type TaskPayload = {
  code: string;
  laborCost: number;
};

type TaskUpdatePayload = TaskPayload & { id: number; isActive: boolean };

// Async thunk for fetching tasks
export const fetchTasks = createAsyncThunk<
  Task[],
  void,
  { rejectValue: string }
>("tasks/fetchTasks", async (_, { rejectWithValue }) => {
  try {
    const data = await getTasks();
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to fetch tasks"));
  }
});

// Async thunk for creating task
export const addTask = createAsyncThunk<
  Task,
  TaskPayload,
  { rejectValue: string }
>("tasks/addTask", async (payload, { rejectWithValue }) => {
  try {
    const data = await createTask(payload.code, payload.laborCost);
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to create task"));
  }
});

// Async thunk for updating task
export const editTask = createAsyncThunk<
  Task,
  TaskUpdatePayload,
  { rejectValue: string }
>("tasks/updateTask", async (payload, { rejectWithValue }) => {
  try {
    const data = await updateTask(
      payload.id,
      payload.code,
      payload.laborCost,
      payload.isActive,
    );
    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to update task"));
  }
});

// Async thunk for deleting task
export const removeTask = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("tasks/removeTask", async (id, { rejectWithValue }) => {
  try {
    await deleteTask(id);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to delete task"));
  }
});

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch shops
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action: PayloadAction<Task[]>) => {
        state.isLoading = false;
        state.tasks = action.payload;
        state.error = null;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch tasks";
      });

    // Add shop
    builder
      .addCase(addTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.isLoading = false;
        state.tasks.push(action.payload);
        state.error = null;
      })
      .addCase(addTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to create task";
      });

    // Update shop
    builder
      .addCase(editTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editTask.fulfilled, (state, action: PayloadAction<Task>) => {
        state.isLoading = false;
        const index = state.tasks.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(editTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to update task";
      });

    // Delete shop
    builder
      .addCase(removeTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeTask.fulfilled, (state, action: PayloadAction<number>) => {
        state.isLoading = false;
        state.tasks = state.tasks.filter((t) => t.id !== action.payload);
        state.error = null;
      })
      .addCase(removeTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to delete task";
      });
  },
});

export const { clearError } = tasksSlice.actions;
export default tasksSlice.reducer;
