import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/app/baseQuery";
import type { ReleasesListResponse, ReleaseDetailResponse, Release } from "@/shared/types";

export const releasesApi = createApi({
  reducerPath: "releasesApi",
  baseQuery,
  tagTypes: ["Releases", "ReleaseDetail", "ReleasesBoard"],
  endpoints: (builder) => ({
    getReleases: builder.query<ReleasesListResponse, string>({
      query: (queryString) => `/releases?${queryString}`,
      providesTags: ["Releases"],
    }),
    getReleasesBoard: builder.query<Release[], string>({
      query: (queryString) => `/releases/board?${queryString}`,
      providesTags: ["ReleasesBoard"],
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
    reorderReleases: builder.mutation<any, { items: Array<{ id: number; sort_order: number; status?: string }>; userId?: number }>({
      query: (body) => ({
        url: "/releases/reorder",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Releases", "ReleasesBoard", "ReleaseDetail"],
    }),
  }),
});

export const {
  useGetReleasesQuery,
  useGetReleasesBoardQuery,
  useGetReleaseByIdQuery,
  useCreateReleaseMutation,
  useUpdateReleaseMutation,
  useDeleteReleaseMutation,
  useCreateHistoryMutation,
  useUpdateHistoryMutation,
  useUpdateChecklistItemStateMutation,
  useReorderReleasesMutation,
} = releasesApi;
