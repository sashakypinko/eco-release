import { configureStore } from "@reduxjs/toolkit";
import { referenceDataApi } from "@/features/reference-data/api";
import { releasesApi } from "@/features/releases/api";
import { templatesApi } from "@/features/templates/api";
import releasesReducer from "@/features/releases/slice";
import templatesReducer from "@/features/templates/slice";

export const store = configureStore({
  reducer: {
    [referenceDataApi.reducerPath]: referenceDataApi.reducer,
    [releasesApi.reducerPath]: releasesApi.reducer,
    [templatesApi.reducerPath]: templatesApi.reducer,
    releases: releasesReducer,
    templates: templatesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(referenceDataApi.middleware)
      .concat(releasesApi.middleware)
      .concat(templatesApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
