import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";

interface ApiConfig {
  baseUrl: string;
  token?: string;
  permissions?: string[];
}

let apiConfig: ApiConfig = {
  baseUrl: "/api",
};

export function setApiConfig(config: ApiConfig) {
  apiConfig = config;
}

export function getApiConfig(): ApiConfig {
  return apiConfig;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: "",
  credentials: "include",
  prepareHeaders: (headers) => {
    headers.set("Content-Type", "application/json");

    if (apiConfig.token) {
      headers.set("Authorization", `Bearer ${apiConfig.token}`);
    }

    if (apiConfig.permissions && apiConfig.permissions.length > 0) {
      headers.set("X-Permissions", apiConfig.permissions.join(","));
    }

    return headers;
  },
});

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = (
  args,
  api,
  extraOptions
) => {
  const adjustedArgs = typeof args === "string"
    ? `${apiConfig.baseUrl}${args}`
    : { ...args, url: `${apiConfig.baseUrl}${args.url}` };

  return rawBaseQuery(adjustedArgs, api, extraOptions);
};
