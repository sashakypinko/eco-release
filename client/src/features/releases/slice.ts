import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ReleasesState {
  search: string;
  statusFilter: string;
  productFilter: string;
  userFilter: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  pageSize: number;
}

const initialState: ReleasesState = {
  search: "",
  statusFilter: "all",
  productFilter: "all",
  userFilter: "all",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 25,
};

const releasesSlice = createSlice({
  name: "releases",
  initialState,
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
      state.page = 1;
    },
    setStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
      state.page = 1;
    },
    setProductFilter(state, action: PayloadAction<string>) {
      state.productFilter = action.payload;
      state.page = 1;
    },
    setUserFilter(state, action: PayloadAction<string>) {
      state.userFilter = action.payload;
      state.page = 1;
    },
    setDateFrom(state, action: PayloadAction<string>) {
      state.dateFrom = action.payload;
      state.page = 1;
    },
    setDateTo(state, action: PayloadAction<string>) {
      state.dateTo = action.payload;
      state.page = 1;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    clearFilters(state) {
      state.search = "";
      state.statusFilter = "all";
      state.productFilter = "all";
      state.userFilter = "all";
      state.dateFrom = "";
      state.dateTo = "";
      state.page = 1;
    },
  },
});

export const { setSearch, setStatusFilter, setProductFilter, setUserFilter, setDateFrom, setDateTo, setPage, clearFilters } = releasesSlice.actions;

export default releasesSlice.reducer;
