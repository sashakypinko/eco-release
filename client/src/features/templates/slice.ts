import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface TemplatesState {
  editingTemplateId: number | null;
  editName: string;
  editItems: { text: string; order: number }[];
  createDialogOpen: boolean;
  newName: string;
}

const initialState: TemplatesState = {
  editingTemplateId: null,
  editName: "",
  editItems: [],
  createDialogOpen: false,
  newName: "",
};

const templatesSlice = createSlice({
  name: "templates",
  initialState,
  reducers: {
    setCreateDialogOpen(state, action: PayloadAction<boolean>) {
      state.createDialogOpen = action.payload;
    },
    setNewName(state, action: PayloadAction<string>) {
      state.newName = action.payload;
    },
    startEditing(state, action: PayloadAction<{ id: number; name: string; items: { text: string; order: number }[] }>) {
      state.editingTemplateId = action.payload.id;
      state.editName = action.payload.name;
      state.editItems = action.payload.items;
    },
    stopEditing(state) {
      state.editingTemplateId = null;
      state.editName = "";
      state.editItems = [];
    },
    setEditName(state, action: PayloadAction<string>) {
      state.editName = action.payload;
    },
    addEditItem(state) {
      state.editItems.push({ text: "", order: state.editItems.length + 1 });
    },
    removeEditItem(state, action: PayloadAction<number>) {
      state.editItems = state.editItems
        .filter((_, i) => i !== action.payload)
        .map((item, i) => ({ ...item, order: i + 1 }));
    },
    updateEditItemText(state, action: PayloadAction<{ index: number; text: string }>) {
      state.editItems[action.payload.index].text = action.payload.text;
    },
    resetCreateDialog(state) {
      state.createDialogOpen = false;
      state.newName = "";
    },
  },
});

export const {
  setCreateDialogOpen,
  setNewName,
  startEditing,
  stopEditing,
  setEditName,
  addEditItem,
  removeEditItem,
  updateEditItemText,
  resetCreateDialog,
} = templatesSlice.actions;

export default templatesSlice.reducer;
