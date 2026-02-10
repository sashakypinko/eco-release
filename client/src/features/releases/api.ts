import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/app/baseQuery";
import type { ReleasesListResponse, ReleaseDetailResponse } from "@/shared/types";

export const releasesApi = createApi({
  reducerPath: "releasesApi",
  baseQuery,
  tagTypes: ["Releases", "ReleaseDetail"],
  endpoints: (builder) => ({
    getReleases: builder.query<ReleasesListResponse, string>({
      query: (queryString) => `/releases?${queryString}`,
      providesTags: ["Releases"],
    }),
    getReleaseById: builder.query<ReleaseDetailResponse, string>({
      query: (id) => `/releases/${id}`,
      providesTags: (_result, _error, id) => [
        { type: "ReleaseDetail", id },
      ],
    }),
    createRelease: builder.mutation<any, any>({
      query: (body) => ({
        url: "/releases",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Releases"],
    }),
    updateRelease: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/releases/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Releases",
        { type: "ReleaseDetail", id },
      ],
    }),
    deleteRelease: builder.mutation<any, string>({
      query: (id) => ({
        url: `/releases/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Releases"],
    }),
    createHistory: builder.mutation<any, any>({
      query: (body) => ({
        url: "/release-histories",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        "Releases",
        { type: "ReleaseDetail", id: String(body.releaseId) },
      ],
    }),
    updateHistory: builder.mutation<any, { id: string; body: any }>({
      query: ({ id, body }) => ({
        url: `/release-histories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Releases", "ReleaseDetail"],
    }),
    updateChecklistItemState: builder.mutation<any, { id: number; done: boolean }>({
      query: (body) => ({
        url: "/releases/update-checklist-item-state",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["ReleaseDetail"],
    }),
  }),
});

export const {
  useGetReleasesQuery,
  useGetReleaseByIdQuery,
  useCreateReleaseMutation,
  useUpdateReleaseMutation,
  useDeleteReleaseMutation,
  useCreateHistoryMutation,
  useUpdateHistoryMutation,
  useUpdateChecklistItemStateMutation,
} = releasesApi;
