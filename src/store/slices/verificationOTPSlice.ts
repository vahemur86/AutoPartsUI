import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { getApiErrorMessage } from "@/utils";
import {
  getOtpPages,
  saveOtpPages,
  sendVerificationOTP,
  verifyOTP,
} from "@/services/verificationOTP";

interface OtpState {
  isLoading: boolean;
  isVerified: boolean;
  isOtpRequired: boolean;
  error: string | null;
  currentStep: "idle" | "code_sent" | "verified";
  pages: Array<{
    pageId: number;
    name?: string;
    url?: string;
    requiresOtp: boolean;
  }>;
}

const initialState: OtpState = {
  isLoading: false,
  isVerified: false,
  isOtpRequired: false,
  error: null,
  currentStep: "idle",
  pages: [],
};

export const requestOtp = createAsyncThunk<
  void,
  { pageUrl: string; cashRegisterId?: number; pageKey?: string },
  { rejectValue: string }
>(
  "otp/requestOtp",
  async ({ pageUrl, cashRegisterId, pageKey }, { rejectWithValue }) => {
    try {
      await sendVerificationOTP(pageUrl, cashRegisterId, pageKey);
    } catch (error: unknown) {
      return rejectWithValue(
        getApiErrorMessage(error, "Failed to send OTP code"),
      );
    }
  },
);

export const confirmOtp = createAsyncThunk<
  any,
  { otp: string; pageUrl: string; cashRegisterId?: number },
  { rejectValue: string }
>("otp/confirmOtp", async (payload, { rejectWithValue }) => {
  try {
    const data = await verifyOTP(
      payload.otp,
      payload.pageUrl,
      payload.cashRegisterId,
    );
    return data;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Invalid OTP code. Please try again."),
    );
  }
});

export const fetchOtpPages = createAsyncThunk<
  OtpState["pages"],
  { cashRegisterId?: number },
  { rejectValue: string }
>("otp/fetchPages", async ({ cashRegisterId }, { rejectWithValue }) => {
  try {
    const pages = await getOtpPages(cashRegisterId);
    return pages;
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch OTP pages"),
    );
  }
});

export const saveOtpPagesAction = createAsyncThunk<
  void,
  {
    pages: { pageId: number; requiresOtp: boolean }[];
    cashRegisterId?: number;
  },
  { rejectValue: string }
>("otp/savePages", async ({ pages, cashRegisterId }, { rejectWithValue }) => {
  try {
    await saveOtpPages(pages, cashRegisterId);
  } catch (error: unknown) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to save OTP pages"),
    );
  }
});

const otpSlice = createSlice({
  name: "otp",
  initialState,
  reducers: {
    resetOtpState: () => initialState,
    clearOtpError: (state) => {
      state.error = null;
    },

    setOtpRequired: (state, action: PayloadAction<boolean>) => {
      state.isOtpRequired = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.currentStep = "code_sent";
        state.error = null;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to send OTP";
      });

    builder
      .addCase(fetchOtpPages.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(
        fetchOtpPages.fulfilled,
        (state, action: PayloadAction<OtpState["pages"]>) => {
          state.isLoading = false;
          state.pages = action.payload;
          state.error = null;
        },
      )
      .addCase(fetchOtpPages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to load pages";
      });

    builder
      .addCase(saveOtpPagesAction.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(saveOtpPagesAction.fulfilled, (state) => {
        state.isLoading = false;
        state.isVerified = true;
        state.currentStep = "verified";
        state.error = null;
      })
      .addCase(saveOtpPagesAction.rejected, (state, action) => {
        state.isLoading = false;
        state.isVerified = false;
        state.error = action.payload ?? "Failed to save OTP pages";
      });

    builder
      .addCase(confirmOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.isVerified = true;
        state.currentStep = "verified";
        state.isOtpRequired = false;
        state.error = null;
      })
      .addCase(confirmOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.isVerified = false;
        state.error = action.payload ?? "Verification failed";
      });
  },
});

export const { resetOtpState, clearOtpError, setOtpRequired } =
  otpSlice.actions;
export default otpSlice.reducer;
