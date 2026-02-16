import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Edit, Trash2, Plus, ExternalLink, Calendar, User, Server,
  CheckCircle2, Circle, Clock, Video, FileText, ChevronDown, ChevronUp,
  GitCommitVertical, Package, Briefcase, Contact, Tag, Globe, Loader2,
  FlaskConical, CheckCheck, XCircle,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { StatusBadge, EnvironmentBadge } from "@/shared/StatusBadge";
import { STATUS_OPTIONS } from "@/shared/constants";
import { useToast } from "@/hooks/use-toast";
import { formatDate, formatDateTime } from "@/shared/utils";
import { useGetReleaseByIdQuery, useDeleteReleaseMutation, useUpdateChecklistItemStateMutation, useCreateHistoryMutation } from "./api";
import type { ReleaseHistory } from "@/shared/types";
import ReleaseFormModal from "./ReleaseFormModal";
import HistoryFormModal from "./HistoryFormModal";

export default function ReleaseDetailPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState<number | undefined>(undefined);

  const { data: releaseData, isLoading } = useGetReleaseByIdQuery(params.id ?? "");
  const release = releaseData?.release;

  const [deleteRelease] = useDeleteReleaseMutation();
  const [toggleChecklistItem] = useUpdateChecklistItemStateMutation();
  const [createStatusHistory, { isLoading: isChangingStatus }] = useCreateHistoryMutation();

  const handleDelete = async () => {
    try {
      await deleteRelease(params.id!).unwrap();
      toast({ title: "Release deleted" });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to delete", variant: "destructive" });
    }
  };

  const handleToggleChecklist = async (id: number, done: boolean) => {
    try {
      await toggleChecklistItem({ id, done }).unwrap();
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to update", variant: "destructive" });
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!release) return;
    const latestHistory = release.latestHistory;
    try {
      await createStatusHistory({
        releaseId: release.id,
        status: newStatus,
        environment: release.environment,
        releaseManagerUserId: latestHistory?.releaseManagerUserId || release.userId || 1,
      }).unwrap();
      toast({ title: "Status updated to " + newStatus });
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to change status", variant: "destructive" });
    }
  };

  const openHistoryModal = (historyId?: number) => {
    setEditingHistoryId(historyId);
    setHistoryModalOpen(true);
  };

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

  const checkedCount = release.checklistItems?.filter((i) => i.done).length || 0;
  const totalCount = release.checklistItems?.length || 0;
  const currentStatus = release.latestHistory?.status || release.status;

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
              <StatusBadge status={currentStatus} />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {release.product?.name || "No product"} &middot; Release #{release.id}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasPermission("release:edit") && (
            <Button variant="outline" onClick={() => setReleaseModalOpen(true)} data-testid="button-edit-release">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {hasPermission("release:delete") && (
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
                  <AlertDialogAction onClick={handleDelete} data-testid="button-confirm-delete">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
              <h3 className="font-semibold">Details</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField label="Version" value={release.version} icon={<GitCommitVertical className="w-4 h-4" />} iconColor="text-violet-500" />
                <DetailField label="Description" value={release.description || "\u2014"} icon={<FileText className="w-4 h-4" />} iconColor="text-sky-500" />
                <DetailField label="Product" value={release.product?.name || "\u2014"} icon={<Package className="w-4 h-4" />} iconColor="text-amber-500" />
                <DetailField label="Work Order" value={release.workOrder?.title || "\u2014"} icon={<Briefcase className="w-4 h-4" />} iconColor="text-emerald-500" />
                <DetailField label="Customer Contact" value={release.customerContact || "\u2014"} icon={<Contact className="w-4 h-4" />} iconColor="text-pink-500" />
                <DetailField
                  label="Planned Release Date"
                  value={formatDate(release.plannedReleaseDate) || "\u2014"}
                  icon={<Calendar className="w-4 h-4" />}
                  iconColor="text-orange-500"
                />
                {release.projectJiraIssue && (
                  <div>
                    <span className="text-xs text-muted-foreground">Jira Issue</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ExternalLink className="w-4 h-4 text-blue-500" />
                      <a
                        href={release.projectJiraIssue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                        data-testid="link-jira-detail"
                      >
                        View in Jira
                      </a>
                    </div>
                  </div>
                )}
                <DetailField
                  label="Created By"
                  value={release.user?.name || "\u2014"}
                  icon={<User className="w-4 h-4" />}
                  iconColor="text-teal-500"
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
                  {release.checklistItems?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 py-2 px-3 rounded-md hover-elevate"
                      data-testid={`checklist-item-${item.id}`}
                    >
                      <Checkbox
                        checked={item.done}
                        onCheckedChange={(checked) => handleToggleChecklist(item.id, !!checked)}
                        disabled={!hasPermission("release:edit")}
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
        </div>

        <div className="lg:sticky lg:top-6">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <h3 className="font-semibold text-sm">Quick Info</h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Status</span>
                {hasPermission("release:edit") ? (
                  <div className="mt-1">
                    <Select
                      value={currentStatus}
                      onValueChange={handleStatusChange}
                      disabled={isChangingStatus}
                    >
                      <SelectTrigger className="w-full" data-testid="select-quick-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isChangingStatus && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Updating...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-1"><StatusBadge status={currentStatus} /></div>
                )}
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
                    <p className="text-sm mt-0.5">{formatDateTime(release.createdAt)}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {release.latestHistory?.releaseVideo && (
        <ReleaseVideoCard videoUrl={release.latestHistory.releaseVideo} />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-3">
          <h3 className="font-semibold">Release History</h3>
          {hasPermission("history:create") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => openHistoryModal()}
              data-testid="button-add-history"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Entry
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {release.histories && release.histories.length > 0 ? (
            <div className="space-y-3">
              {release.histories.map((history) => (
                <HistoryCard
                  key={history.id}
                  history={history}
                  expanded={expandedHistory === history.id}
                  onToggle={() => setExpandedHistory(expandedHistory === history.id ? null : history.id)}
                  canEdit={hasPermission("history:edit")}
                  onEdit={() => openHistoryModal(history.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">No history records</p>
          )}
        </CardContent>
      </Card>

      <ReleaseFormModal
        open={releaseModalOpen}
        onClose={() => setReleaseModalOpen(false)}
        releaseId={params.id}
      />

      <HistoryFormModal
        open={historyModalOpen}
        onClose={() => { setHistoryModalOpen(false); setEditingHistoryId(undefined); }}
        release={release}
        historyId={editingHistoryId}
      />
    </div>
  );
}

function ReleaseVideoCard({ videoUrl }: { videoUrl: string }) {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const videoIdMatch = videoUrl.match(/(\d+)\s*$/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Video className="w-4 h-4" />
          Release Video
        </h3>
      </CardHeader>
      <CardContent>
        {videoId ? (
          <div className="w-full" data-testid="release-video-embed">
            <iframe
              src={`https://video-widgets.tetheree.com/#/video?widgetId=NjIy&videoId=${videoId}&theme=${theme}`}
              className="w-full rounded-md border"
              style={{ aspectRatio: "16/9", minHeight: "280px" }}
              allow="autoplay; fullscreen"
              allowFullScreen
              title="Release Video"
            />
          </div>
        ) : (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            data-testid="link-release-video"
          >
            <ExternalLink className="w-3 h-3" />
            Watch video
          </a>
        )}
      </CardContent>
    </Card>
  );
}

function DetailField({ label, value, icon, iconColor }: { label: string; value: string; icon?: any; iconColor?: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm mt-0.5 flex items-center gap-1.5">
        {icon && <span className={iconColor || "text-muted-foreground"}>{icon}</span>}
        {value}
      </p>
    </div>
  );
}

function SmokeTestBadge({ result }: { result: string }) {
  if (result === "pass") {
    return (
      <Badge className="no-default-hover-elevate no-default-active-elevate bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 gap-1">
        <CheckCheck className="w-3 h-3" />
        Pass
      </Badge>
    );
  }
  return (
    <Badge className="no-default-hover-elevate no-default-active-elevate bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 gap-1">
      <XCircle className="w-3 h-3" />
      Fail
    </Badge>
  );
}

function HistoryCard({ history, expanded, onToggle, canEdit, onEdit }: { history: ReleaseHistory; expanded: boolean; onToggle: () => void; canEdit: boolean; onEdit: () => void }) {
  const checkedCount = history.checklistItems?.filter((i) => i.done).length || 0;
  const totalCount = history.checklistItems?.length || 0;

  return (
    <div className="border rounded-md" data-testid={`history-card-${history.id}`}>
      <div
        role="button"
        tabIndex={0}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 cursor-pointer"
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
      >
        <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
          <StatusBadge status={history.status} />
          <EnvironmentBadge env={history.environment} />
          {history.smokeTestResult && (
            <SmokeTestBadge result={history.smokeTestResult} />
          )}
          <span className="text-xs text-muted-foreground">
            {formatDateTime(history.createdAt)}
          </span>
          {totalCount > 0 && (
            <Badge variant="secondary" className="no-default-hover-elevate no-default-active-elevate text-xs">
              {checkedCount}/{totalCount} items
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              data-testid={`button-edit-history-${history.id}`}
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <DetailField label="Release Manager" value={history.releaseManager?.name || "\u2014"} icon={<User className="w-3 h-3" />} iconColor="text-teal-500" />
            <DetailField label="Approved By" value={history.approvedByUser?.name || "\u2014"} icon={<User className="w-3 h-3" />} iconColor="text-indigo-500" />
            {history.dateOfApproval && <DetailField label="Approval Date" value={formatDate(history.dateOfApproval)} icon={<Calendar className="w-3 h-3" />} iconColor="text-orange-500" />}
            {history.server && <DetailField label="Server" value={history.server} icon={<Server className="w-3 h-3" />} iconColor="text-cyan-500" />}
            {history.port && <DetailField label="Port" value={String(history.port)} icon={<Globe className="w-3 h-3" />} iconColor="text-blue-500" />}
            {history.releaseDate && <DetailField label="Release Date" value={formatDateTime(history.releaseDate)} icon={<Calendar className="w-3 h-3" />} iconColor="text-orange-500" />}
            {history.smokeTestResult && (
              <div>
                <span className="text-xs text-muted-foreground">Smoke Test</span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <FlaskConical className={`w-3 h-3 ${history.smokeTestResult === "pass" ? "text-green-500" : "text-red-500"}`} />
                  <SmokeTestBadge result={history.smokeTestResult} />
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
                <div className="flex items-center gap-1.5 mt-0.5">
                  <ExternalLink className="w-3 h-3 text-blue-500" />
                  <a href={history.releaseNotes} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    View notes
                  </a>
                </div>
              </div>
            )}
          </div>
          {totalCount > 0 && (
            <div className="mt-4">
              <span className="text-xs text-muted-foreground">Checklist Items</span>
              <div className="mt-1 space-y-1">
                {history.checklistItems!.map((item) => (
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
