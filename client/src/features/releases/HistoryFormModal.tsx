import { useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ENVIRONMENT_OPTIONS, STATUS_OPTIONS, SMOKE_TEST_OPTIONS } from "@/shared/constants";
import { toDateTimeInputValue } from "@/shared/utils";
import { useCreateHistoryMutation, useUpdateHistoryMutation } from "./api";
import { useGetUsersQuery } from "@/features/reference-data/api";
import type { Release, ReleaseHistory } from "@/shared/types";

const historyFormSchema = z.object({
  status: z.string().min(1, "Status is required"),
  environment: z.string().min(1, "Environment is required"),
  releaseManagerUserId: z.string().min(1, "Release manager is required"),
  approvedByUserId: z.string().optional(),
  dateOfApproval: z.string().optional(),
  comment: z.string().optional(),
  server: z.string().optional(),
  port: z.string().optional(),
  releaseDate: z.string().optional(),
  releaseNotes: z.string().optional(),
  releaseVideo: z.string().optional(),
  smokeTestDate: z.string().optional(),
  smokeTestResult: z.string().optional(),
});

type HistoryFormValues = z.infer<typeof historyFormSchema>;

interface HistoryFormModalProps {
  open: boolean;
  onClose: () => void;
  release: Release;
  historyId?: number;
}

export default function HistoryFormModal({ open, onClose, release, historyId }: HistoryFormModalProps) {
  const { toast } = useToast();
  const isEdit = !!historyId;
  const { data: usersData } = useGetUsersQuery();

  const existingHistory = isEdit
    ? release.histories?.find((h) => h.id === historyId)
    : null;

  const form = useForm<HistoryFormValues>({
    resolver: zodResolver(historyFormSchema),
    defaultValues: {
      status: "Created",
      environment: "prod",
      releaseManagerUserId: "",
      approvedByUserId: "",
      dateOfApproval: "",
      comment: "",
      server: "",
      port: "",
      releaseDate: "",
      releaseNotes: "",
      releaseVideo: "",
      smokeTestDate: "",
      smokeTestResult: "",
    },
  });

  useEffect(() => {
    if (existingHistory && isEdit) {
      form.reset({
        status: existingHistory.status || "Created",
        environment: existingHistory.environment || "prod",
        releaseManagerUserId: existingHistory.releaseManagerUserId ? String(existingHistory.releaseManagerUserId) : "",
        approvedByUserId: existingHistory.approvedByUserId ? String(existingHistory.approvedByUserId) : "",
        dateOfApproval: toDateTimeInputValue(existingHistory.dateOfApproval),
        comment: existingHistory.comment || "",
        server: existingHistory.server || "",
        port: existingHistory.port ? String(existingHistory.port) : "",
        releaseDate: toDateTimeInputValue(existingHistory.releaseDate),
        releaseNotes: existingHistory.releaseNotes || "",
        releaseVideo: existingHistory.releaseVideo || "",
        smokeTestDate: toDateTimeInputValue(existingHistory.smokeTestDate),
        smokeTestResult: existingHistory.smokeTestResult || "",
      });
    } else if (open && !isEdit) {
      form.reset({
        status: release.status || "Created",
        environment: release.environment || "prod",
        releaseManagerUserId: "",
        approvedByUserId: "",
        dateOfApproval: "",
        comment: "",
        server: "",
        port: "",
        releaseDate: "",
        releaseNotes: "",
        releaseVideo: "",
        smokeTestDate: "",
        smokeTestResult: "",
      });
    }
  }, [existingHistory, release, open, isEdit, form]);

  const [createHistory, { isLoading: isCreating }] = useCreateHistoryMutation();
  const [updateHistory, { isLoading: isUpdating }] = useUpdateHistoryMutation();
  const isPending = isCreating || isUpdating;

  const onSubmit = async (values: HistoryFormValues) => {
    const body: any = {
      releaseId: release.id,
      status: values.status,
      environment: values.environment,
      releaseManagerUserId: Number(values.releaseManagerUserId),
      approvedByUserId: values.approvedByUserId ? Number(values.approvedByUserId) : null,
      dateOfApproval: values.dateOfApproval ? new Date(values.dateOfApproval) : null,
      comment: values.comment || null,
      server: values.server || null,
      port: values.port ? Number(values.port) : null,
      releaseDate: values.releaseDate ? new Date(values.releaseDate) : null,
      releaseNotes: values.releaseNotes || null,
      releaseVideo: values.releaseVideo || null,
      smokeTestDate: values.smokeTestDate ? new Date(values.smokeTestDate) : null,
      smokeTestResult: values.smokeTestResult || null,
    };

    try {
      if (isEdit) {
        await updateHistory({ id: String(historyId), body }).unwrap();
        toast({ title: "History updated" });
      } else {
        await createHistory(body).unwrap();
        toast({ title: "History entry created" });
      }
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err?.data?.message || "Failed to save", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-form-title">{isEdit ? "Edit History Entry" : "New History Entry"}</DialogTitle>
          <DialogDescription>Release v{release.version}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-status"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="environment" render={({ field }) => (
                <FormItem>
                  <FormLabel>Environment *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-environment"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {ENVIRONMENT_OPTIONS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="releaseManagerUserId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Release Manager *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-release-manager"><SelectValue placeholder="Select manager" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {usersData?.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="approvedByUserId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Approved By</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-approved-by"><SelectValue placeholder="Select user" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {usersData?.map((u) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="dateOfApproval" render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Approval</FormLabel>
                <FormControl><Input type="datetime-local" {...field} data-testid="input-date-of-approval" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="comment" render={({ field }) => (
              <FormItem>
                <FormLabel>Comment</FormLabel>
                <FormControl><Textarea className="resize-none" placeholder="Optional comment..." {...field} data-testid="input-comment" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="server" render={({ field }) => (
                <FormItem>
                  <FormLabel>Server</FormLabel>
                  <FormControl><Input placeholder="Server name or URL" {...field} data-testid="input-server" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="port" render={({ field }) => (
                <FormItem>
                  <FormLabel>Port</FormLabel>
                  <FormControl><Input type="number" placeholder="Port number" {...field} data-testid="input-port" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="releaseDate" render={({ field }) => (
              <FormItem>
                <FormLabel>Release Date</FormLabel>
                <FormControl><Input type="datetime-local" {...field} data-testid="input-release-date" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="releaseNotes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Release Notes URL</FormLabel>
                  <FormControl><Input placeholder="https://..." {...field} data-testid="input-release-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="releaseVideo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Release Video URL</FormLabel>
                  <FormControl><Input placeholder="https://..." {...field} data-testid="input-release-video" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField control={form.control} name="smokeTestDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>Smoke Test Date</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} data-testid="input-smoke-test-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="smokeTestResult" render={({ field }) => (
                <FormItem>
                  <FormLabel>Smoke Test Result</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger data-testid="select-smoke-test"><SelectValue placeholder="Select result" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {SMOKE_TEST_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">Cancel</Button>
              <Button type="submit" disabled={isPending} data-testid="button-save">
                {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isEdit ? "Update" : "Create"} Entry
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
