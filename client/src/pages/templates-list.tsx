import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, ListChecks, Trash2, Edit, GripVertical, X, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function TemplatesListPage() {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editItems, setEditItems] = useState<{ text: string; order: number }[]>([]);
  const [editName, setEditName] = useState("");

  const { data: templates, isLoading } = useQuery<any[]>({ queryKey: ["/api/checklist-templates"] });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/checklist-templates", { name: newName }),
    onSuccess: () => {
      toast({ title: "Template created" });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      setCreateOpen(false);
      setNewName("");
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/checklist-templates/${id}`),
    onSuccess: () => {
      toast({ title: "Template deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateNameMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      apiRequest("PUT", `/api/checklist-templates/${id}`, { name }),
    onSuccess: () => {
      toast({ title: "Template name updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateItemsMutation = useMutation({
    mutationFn: ({ id, items }: { id: number; items: { text: string; order: number }[] }) =>
      apiRequest("PUT", `/api/checklist-templates/${id}`, { items }),
    onSuccess: () => {
      toast({ title: "Template items updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/checklist-templates"] });
      setEditingTemplate(null);
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const startEditing = (template: any) => {
    setEditingTemplate(template);
    setEditName(template.name);
    setEditItems(template.items?.map((i: any) => ({ text: i.text, order: i.order })) || []);
  };

  const addItem = () => {
    setEditItems([...editItems, { text: "", order: editItems.length + 1 }]);
  };

  const removeItem = (index: number) => {
    const next = editItems.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i + 1 }));
    setEditItems(next);
  };

  const updateItemText = (index: number, text: string) => {
    setEditItems(editItems.map((item, i) => i === index ? { ...item, text } : item));
  };

  const saveItems = () => {
    if (!editingTemplate) return;
    const valid = editItems.filter((i) => i.text.trim());
    updateItemsMutation.mutate({ id: editingTemplate.id, items: valid });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Checklist Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage reusable checklist templates for releases</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
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
              onChange={(e) => setNewName(e.target.value)}
              data-testid="input-template-name"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!newName.trim() || createMutation.isPending}
                data-testid="button-save-template"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
          {templates.map((template: any) => (
            <Card key={template.id} data-testid={`card-template-${template.id}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <ListChecks className="w-5 h-5 text-primary" />
                  {editingTemplate?.id === template.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-64"
                      onBlur={() => {
                        if (editName !== template.name && editName.trim()) {
                          updateNameMutation.mutate({ id: template.id, name: editName });
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
                  {editingTemplate?.id === template.id ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setEditingTemplate(null)} data-testid="button-cancel-edit">
                        <X className="w-3 h-3 mr-1" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={saveItems} disabled={updateItemsMutation.isPending} data-testid="button-save-items">
                        {updateItemsMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                        Save
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => startEditing(template)} data-testid={`button-edit-template-${template.id}`}>
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
                            <AlertDialogAction onClick={() => deleteMutation.mutate(template.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingTemplate?.id === template.id ? (
                  <div className="space-y-2">
                    {editItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-muted-foreground w-6">{index + 1}.</span>
                        <Input
                          value={item.text}
                          onChange={(e) => updateItemText(index, e.target.value)}
                          placeholder="Checklist item text"
                          className="flex-1"
                          data-testid={`input-item-${index}`}
                        />
                        <Button size="icon" variant="ghost" onClick={() => removeItem(index)} data-testid={`button-remove-item-${index}`}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" onClick={addItem} className="mt-2" data-testid="button-add-item">
                      <Plus className="w-3 h-3 mr-1" />
                      Add Item
                    </Button>
                  </div>
                ) : template.items && template.items.length > 0 ? (
                  <div className="space-y-1.5">
                    {template.items.map((item: any) => (
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
