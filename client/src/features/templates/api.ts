import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/app/baseQuery";
import type { ChecklistTemplate } from "@/shared/types";

export const templatesApi = createApi({
  reducerPath: "templatesApi",
  baseQuery,
  tagTypes: ["Templates"],
  endpoints: (builder) => ({
    getTemplates: builder.query<ChecklistTemplate[], void>({
      query: () => "/checklist-templates",
      providesTags: ["Templates"],
    }),
    createTemplate: builder.mutation<ChecklistTemplate, { name: string }>({
      query: (body) => ({
        url: "/checklist-templates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Templates"],
    }),
    updateTemplate: builder.mutation<
      ChecklistTemplate,
      { id: number; name?: string; items?: { text: string; order: number }[] }
    >({
      query: ({ id, ...body }) => ({
        url: `/checklist-templates/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Templates"],
    }),
    deleteTemplate: builder.mutation<void, number>({
      query: (id) => ({
        url: `/checklist-templates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Templates"],
    }),
  }),
});

export const {
  useGetTemplatesQuery,
  useCreateTemplateMutation,
  useUpdateTemplateMutation,
  useDeleteTemplateMutation,
} = templatesApi;
