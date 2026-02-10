import { Plus, ListChecks, Trash2, Edit, GripVertical, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  setCreateDialogOpen, setNewName, startEditing, stopEditing,
  setEditName, addEditItem, removeEditItem, updateEditItemText, resetCreateDialog,
} from "./slice";
import {
  useGetTemplatesQuery, useCreateTemplateMutation,
  useUpdateTemplateMutation, useDeleteTemplateMutation,
} from "./api";

export default function TemplatesPage() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { editingTemplateId, editName, editItems, createDialogOpen, newName } = useAppSelector((s) => s.templates);

  const { data: templates, isLoading } = useGetTemplatesQuery();
  const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();
  const [deleteTemplate] = useDeleteTemplateMutation();
  const [updateTemplate, { isLoading: isUpdatingItems }] = useUpdateTemplateMutation();

  const handleCreate = async () => {
    try {
      await createTemplate({ name: newName }).unwrap();
      toast({ title: "Template created" });
      dispatch(resetCreateDialog());
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to create", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTemplate(id).unwrap();
      toast({ title: "Template deleted" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  const handleUpdateName = async (id: number, name: string) => {
    try {
      await updateTemplate({ id, name }).unwrap();
      toast({ title: "Template name updated" });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to update", variant: "destructive" });
    }
  };

  const handleSaveItems = async () => {
    if (!editingTemplateId) return;
    const valid = editItems.filter((i) => i.text.trim());
    try {
      await updateTemplate({ id: editingTemplateId, items: valid }).unwrap();
      toast({ title: "Template items updated" });
      dispatch(stopEditing());
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to update", variant: "destructive" });
    }
  };

  const handleStartEditing = (template: any) => {
    dispatch(startEditing({
      id: template.id,
      name: template.name,
      items: template.items?.map((i: any) => ({ text: i.text, order: i.order })) || [],
    }));
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Checklist Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage reusable checklist templates for releases</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={(open) => dispatch(setCreateDialogOpen(open))}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Template name"
              value={newName}
              onChange={(e) => dispatch(setNewName(e.target.value))}
              data-testid="input-template-name"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => dispatch(setCreateDialogOpen(false))}>Cancel</Button>
              <Button
                onClick={handleCreate}
                disabled={!newName.trim() || isCreating}
                data-testid="button-save-template"
              >
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : templates && templates.length > 0 ? (
        <div className="space-y-4">
          {templates.map((template) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <ListChecks className="w-5 h-5 text-primary" />
                  {editingTemplateId === template.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => dispatch(setEditName(e.target.value))}
                      className="w-64"
                      onBlur={() => {
                        if (editName !== template.name && editName.trim()) {
                          handleUpdateName(template.id, editName);
                        }
                      }}
                      data-testid="input-edit-template-name"
                    />
                  ) : (
                    <h3 className="font-semibold">{template.name}</h3>
                  )}
                  <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate">
                    {template.items?.length || 0} items
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {editingTemplateId === template.id ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => dispatch(stopEditing())} data-testid="button-cancel-edit">
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveItems} disabled={isUpdatingItems} data-testid="button-save-items">
                        {isUpdatingItems ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleStartEditing(template)} data-testid={`button-edit-template-${template.id}`}>
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" data-testid={`button-delete-template-${template.id}`}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Template</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{template.name}" and all its items. This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(template.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingTemplateId === template.id ? (
                  <div className="space-y-2">
                    {editItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                        <Input
                          value={item.text}
                          onChange={(e) => dispatch(updateEditItemText({ index, text: e.target.value }))}
                          placeholder="Checklist item text"
                          className="flex-1"
                          data-testid={`input-item-${index}`}
                        />
                        <Button size="icon" variant="ghost" onClick={() => dispatch(removeEditItem(index))} data-testid={`button-remove-item-${index}`}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={() => dispatch(addEditItem())} className="mt-2" data-testid="button-add-item">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                ) : template.items && template.items.length > 0 ? (
                  <div className="space-y-1.5">
                    {template.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground w-6 text-right">{item.order}.</span>
                        <span>{item.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No items defined. Click Edit to add checklist items.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <ListChecks className="w-12 h-12 text-muted-foreground/40" />
            <p className="text-muted-foreground">No checklist templates yet</p>
            <p className="text-sm text-muted-foreground">Create templates to automatically generate checklists for releases</p>
          </div>
        </Card>
      )}
    </div>
  );
}
