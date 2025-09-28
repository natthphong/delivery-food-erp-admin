import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Router from "next/router";
import { store } from "@/store";
import { logout, setTokens } from "@/store/authSlice";
import { clearAuth, saveAuth } from "@/utils/authStorage";
import { logger } from "@/utils/logger";

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

type FailedQueueItem = {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
};

interface RetriableAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error);
      return;
    }

    prom.resolve(token);
  });

  failedQueue = [];
};

const apiClient = axios.create({
  baseURL: "",
  withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const state = store.getState();
  const accessToken = state.auth.accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableAxiosRequestConfig | undefined;
    const status = error.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    const state = store.getState();
    const refreshToken = state.auth.refreshToken;

    if (!refreshToken) {
      logger.warn("401 received without a refresh token. Forcing logout.");
      store.dispatch(logout());
      clearAuth();
      void Router.replace("/login");
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            if (!token) {
              reject(error);
              return;
            }
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            originalRequest._retry = true;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post<RefreshResponse>("/api/admin/refresh-token", { refreshToken });
      store.dispatch(setTokens(data));
      const { admin } = store.getState().auth;
      saveAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, admin });
      processQueue(null, data.accessToken);
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError as AxiosError, null);
      store.dispatch(logout());
      clearAuth();
      void Router.replace("/login");
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
