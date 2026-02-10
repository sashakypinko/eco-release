import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Edit, Trash2, Plus, ExternalLink, Calendar, User, Server,
  CheckCircle2, Circle, Clock, Video, FileText, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge, EnvironmentBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function ReleaseDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);

  const { data: releaseData, isLoading } = useQuery<{ release: any }>({
    queryKey: ["/api/releases", params.id],
  });

  const release = releaseData?.release;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/releases/${params.id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Release deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      navigate("/");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: async (data: { id: number; done: boolean }) => {
      const res = await apiRequest("PUT", "/api/releases/update-checklist-item-state", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/releases", params.id] });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!release) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Release not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Back to releases</Button>
      </div>
    );
  }

  const checkedCount = release.checklistItems?.filter((i: any) => i.done).length || 0;
  const totalCount = release.checklistItems?.length || 0;

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-semibold" data-testid="text-release-version">v{release.version}</h1>
              <EnvironmentBadge env={release.environment} />
              <StatusBadge status={release.latestHistory?.status || release.status} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {release.product?.name || "No product"} &middot; Release #{release.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/releases/${release.id}/edit`)} data-testid="button-edit-release">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="button-delete-release">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Release</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete release v{release.version} and all its history records. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutation.mutate()} data-testid="button-confirm-delete">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <h3 className="font-semibold">Details</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField label="Version" value={release.version} icon={<FileText className="w-4 h-4" />} />
                <DetailField label="Description" value={release.description || "—"} />
                <DetailField label="Product" value={release.product?.name || "—"} />
                <DetailField label="Work Order" value={release.workOrder?.title || "—"} />
                <DetailField label="Customer Contact" value={release.customerContact || "—"} icon={<User className="w-4 h-4" />} />
                <DetailField
                  label="Planned Release Date"
                  value={release.plannedReleaseDate ? format(new Date(release.plannedReleaseDate), "MMM d, yyyy") : "—"}
                  icon={<Calendar className="w-4 h-4" />}
                />
                {release.projectJiraIssue && (
                  <div>
                    <span className="text-xs text-muted-foreground">Jira Issue</span>
                    <a
                      href={release.projectJiraIssue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary hover:underline flex items-center gap-1 mt-0.5"
                      data-testid="link-jira-detail"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View in Jira
                    </a>
                  </div>
                )}
                <DetailField
                  label="Created By"
                  value={release.user?.name || "—"}
                  icon={<User className="w-4 h-4" />}
                />
              </div>
            </CardContent>
          </Card>

          {totalCount > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Release Checklist</h3>
                  <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate">
                    {checkedCount}/{totalCount}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {release.checklistItems?.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-md hover-elevate"
                      data-testid={`checklist-item-${item.id}`}
                    >
                      <Checkbox
                        checked={item.done}
                        onCheckedChange={(checked) => {
                          toggleChecklistMutation.mutate({ id: item.id, done: !!checked });
                        }}
                        data-testid={`checkbox-item-${item.id}`}
                      />
                      <span className={`text-sm flex-1 ${item.done ? "line-through text-muted-foreground" : ""}`}>
                        {item.text}
                      </span>
                      {item.done ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <h3 className="font-semibold">Release History</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/releases/${release.id}/history/new`)}
                data-testid="button-add-history"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Entry
              </Button>
            </CardHeader>
            <CardContent>
              {release.histories?.length > 0 ? (
                <div className="space-y-3">
                  {release.histories.map((history: any) => (
                    <HistoryCard
                      key={history.id}
                      history={history}
                      releaseId={release.id}
                      expanded={expandedHistory === history.id}
                      onToggle={() => setExpandedHistory(expandedHistory === history.id ? null : history.id)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No history records</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-sm">Quick Info</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Status</span>
                <div className="mt-1"><StatusBadge status={release.latestHistory?.status || release.status} /></div>
              </div>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground">Environment</span>
                <div className="mt-1"><EnvironmentBadge env={release.environment} /></div>
              </div>
              <Separator />
              <div>
                <span className="text-xs text-muted-foreground">History Entries</span>
                <p className="text-sm font-medium mt-0.5">{release.histories?.length || 0}</p>
              </div>
              {totalCount > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="text-xs text-muted-foreground">Checklist Progress</span>
                    <div className="mt-1.5">
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(checkedCount / totalCount) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{checkedCount} of {totalCount} completed</p>
                    </div>
                  </div>
                </>
              )}
              {release.createdAt && (
                <>
                  <Separator />
                  <div>
                    <span className="text-xs text-muted-foreground">Created</span>
                    <p className="text-sm mt-0.5">{format(new Date(release.createdAt), "MMM d, yyyy h:mm a")}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {release.latestHistory?.releaseVideo && (
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Release Video
                </h3>
              </CardHeader>
              <CardContent>
                <a
                  href={release.latestHistory.releaseVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  data-testid="link-release-video"
                >
                  <ExternalLink className="w-3 h-3" />
                  Watch video
                </a>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value, icon }: { label: string; value: string; icon?: any }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm mt-0.5 flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {value}
      </p>
    </div>
  );
}

function HistoryCard({ history, releaseId, expanded, onToggle }: { history: any; releaseId: number; expanded: boolean; onToggle: () => void }) {
  const [, navigate] = useLocation();
  const checkedCount = history.checklistItems?.filter((i: any) => i.done).length || 0;
  const totalCount = history.checklistItems?.length || 0;

  return (
    <div className="border rounded-md" data-testid={`history-card-${history.id}`}>
      <button className="w-full text-left px-4 py-3 flex items-center justify-between gap-3" onClick={onToggle}>
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
          <StatusBadge status={history.status} />
          <EnvironmentBadge env={history.environment} />
          <span className="text-xs text-muted-foreground">
            {history.createdAt ? format(new Date(history.createdAt), "MMM d, yyyy h:mm a") : ""}
          </span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate text-xs">
              {checkedCount}/{totalCount} items
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); navigate(`/releases/${releaseId}/history/${history.id}/edit`); }}
            data-testid={`button-edit-history-${history.id}`}
          >
            <Edit className="w-3 h-3" />
          </Button>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <DetailField label="Release Manager" value={history.releaseManager?.name || "—"} icon={<User className="w-3 h-3" />} />
            <DetailField label="Approved By" value={history.approvedByUser?.name || "—"} />
            {history.dateOfApproval && <DetailField label="Approval Date" value={format(new Date(history.dateOfApproval), "MMM d, yyyy")} />}
            {history.server && <DetailField label="Server" value={history.server} icon={<Server className="w-3 h-3" />} />}
            {history.port && <DetailField label="Port" value={String(history.port)} />}
            {history.releaseDate && <DetailField label="Release Date" value={format(new Date(history.releaseDate), "MMM d, yyyy h:mm a")} />}
            {history.smokeTestResult && (
              <div>
                <span className="text-xs text-muted-foreground">Smoke Test</span>
                <div className="mt-0.5">
                  <Badge className={`no-default-hover-elevate no-default-active-elevate ${history.smokeTestResult === "pass" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"}`}>
                    {history.smokeTestResult}
                  </Badge>
                </div>
              </div>
            )}
            {history.comment && (
              <div className="col-span-full">
                <span className="text-xs text-muted-foreground">Comment</span>
                <p className="text-sm mt-0.5 text-muted-foreground">{history.comment}</p>
              </div>
            )}
            {history.releaseNotes && (
              <div>
                <span className="text-xs text-muted-foreground">Release Notes</span>
                <a href={history.releaseNotes} target="_blank" rel="noopener noreferrer" className="block text-sm text-primary hover:underline flex items-center gap-1 mt-0.5">
                  <ExternalLink className="w-3 h-3" /> View notes
                </a>
              </div>
            )}
          </div>
          {totalCount > 0 && (
            <div className="mt-4">
              <span className="text-xs text-muted-foreground">Checklist Items</span>
              <div className="mt-1 space-y-1">
                {history.checklistItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm">
                    {item.done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={item.done ? "line-through text-muted-foreground" : ""}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
