import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";

// services
import { login as loginRequest } from "@/services/auth";

// types
import type { Credentials, LoginResponse } from "@/types/auth";

// utils
import { getApiErrorMessage } from "@/utils";
import { setPasswordRequest } from "@/services/users";

interface AuthState {
  token: string | null;
  user: LoginResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const savedToken = localStorage.getItem("access_token");
const savedUser = localStorage.getItem("user_data");

const initialState: AuthState = {
  token: savedToken,
  user: savedUser ? JSON.parse(savedUser) : null,
  isAuthenticated: !!savedToken,
  isLoading: false,
  error: null,
};

export const login = createAsyncThunk<
  LoginResponse,
  Credentials,
  { rejectValue: string }
>("auth/login", async (credentials, { rejectWithValue }) => {
  try {
    const data = await loginRequest(credentials);

    localStorage.setItem("access_token", data.token);
    localStorage.setItem("user_data", JSON.stringify(data));

    return data;
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Login failed"));
  }
});

export const setPassword = createAsyncThunk<
  void,
  { token: string; password: string; cashRegisterId?: number },
  { rejectValue: string }
>("auth/setPassword", async (payload, { rejectWithValue }) => {
  try {
    await setPasswordRequest(
      payload.token,
      payload.password,
      payload.cashRegisterId,
    );
  } catch (error: unknown) {
    return rejectWithValue(getApiErrorMessage(error, "Failed to set password"));
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_data");
    },
    clearAuthError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        login.fulfilled,
        (state, action: PayloadAction<LoginResponse>) => {
          state.isLoading = false;
          state.token = action.payload.token;
          state.user = action.payload;
          state.isAuthenticated = true;
          state.error = null;
        },
      )
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "An error occurred during login";
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      .addCase(setPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setPassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(setPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to set password";
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
