import { getApiErrorMessage, getHeaders } from "@/utils";
import api from ".";

export const sendVerificationOTP = async (
  pageUrl: string,
  cashRegisterId?: number,
  pageKey?: string,
) => {
  const response = await api.post(
    `/Otp/send`,
    { pageUrl: pageKey ?? pageUrl }, 
    { headers: { ...getHeaders(cashRegisterId, pageKey) } },
  );
  return response.data;
};

export const verifyOTP = async (
  otp: string,
  pageUrl: string,
  cashRegisterId?: number,
  pageKey?: string,
) => {
  const response = await api.post(
    `/Otp/verify`,
    { pageUrl: pageKey ?? pageUrl },
    {
      headers: {
        ...getHeaders(cashRegisterId, pageKey),
        "X-OTP": otp,
        "x-page-key": pageKey ?? pageUrl, 
      },
    },
  );
  return response.data;
};


export const getOtpPages = async (cashRegisterId?: number) => {
  try {
    const response = await api.get(`/Otp/Get Pages`, {
      headers: {
        ...getHeaders(cashRegisterId),
        "X-CashRegister-Id": cashRegisterId,
        Accept: "text/plain",
      },
    });
    return response.data as Array<{
      pageId: number;
      name: string;
      url: string;
      requiresOtp: boolean;
    }>;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to fetch OTP pages."));
  }
};

export const saveOtpPages = async (
  pages: { pageId: number; requiresOtp: boolean }[],
  cashRegisterId?: number,
) => {
  try {
    const response = await api.post(
      `/Otp/save`,
      { pages },
      {
        headers: {
          ...getHeaders(cashRegisterId),
          "X-CashRegister-Id": cashRegisterId,
        },
      },
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(getApiErrorMessage(error, "Failed to save OTP pages."));
  }
};
