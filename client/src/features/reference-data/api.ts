import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/app/baseQuery";
import type { Product, User, WorkOrder } from "@/shared/types";

export const referenceDataApi = createApi({
  reducerPath: "referenceDataApi",
  baseQuery,
  tagTypes: ["Products", "Users", "WorkOrders"],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => "/products",
      providesTags: ["Products"],
    }),
    getUsers: builder.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),
    getWorkOrders: builder.query<WorkOrder[], string>({
      query: (productId) => `/work-orders?product_id=${productId}`,
      providesTags: (_result, _error, productId) => [
        { type: "WorkOrders", id: productId },
      ],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetUsersQuery,
  useGetWorkOrdersQuery,
} = referenceDataApi;
