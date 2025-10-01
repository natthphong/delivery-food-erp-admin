import Axios from "axios";
import Router from "next/router";
import { store } from "@/store";
import { logout, setTokens } from "@/store/authSlice";
import { saveTokens } from "@/utils/tokenStorage";

export type ApiResponse<T> = { code: string; message: string; body: T };

const axios = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "",
  withCredentials: false,
});

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

const flushQueue = (token: string | null) => {
  queue.forEach((fn) => fn(token));
  queue = [];
};

axios.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error ?? {};
    const status: number | undefined = response?.status;
    const originalRequest = config ?? {};

    if ((status === 400 || status === 401) && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshToken = store.getState().auth.refreshToken;
          if (!refreshToken) {
            throw new Error("missing_refresh_token");
          }
          const refreshResponse = await Axios.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
            "/api/refresh-token",
            { refreshToken }
          );
          const tokens = refreshResponse.data?.body;
          if (!tokens?.accessToken || !tokens?.refreshToken) {
            throw new Error("invalid_refresh_response");
          }
          store.dispatch(setTokens(tokens));
          saveTokens(tokens);
          isRefreshing = false;
          flushQueue(tokens.accessToken);
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${tokens.accessToken}`,
          };
          return axios(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          flushQueue(null);
          store.dispatch(logout());
          Router.replace("/login");
          return Promise.reject(refreshError);
        }
      }

      return new Promise((resolve, reject) => {
        queue.push((token) => {
          if (!token) {
            store.dispatch(logout());
            Router.replace("/login");
            reject(error);
            return;
          }
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${token}`,
          };
          resolve(axios(originalRequest));
        });
      });
    }

    return Promise.reject(error);
  }
);

export default axios;
