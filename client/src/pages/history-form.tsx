import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ENVIRONMENT_OPTIONS, STATUS_OPTIONS, SMOKE_TEST_OPTIONS } from "@/lib/constants";

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

export default function HistoryFormPage() {
  const params = useParams<{ id: string; historyId: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEdit = !!params.historyId;
  const releaseId = Number(params.id);

  const { data: usersData } = useQuery<any[]>({ queryKey: ["/api/users"] });

  const { data: releaseData } = useQuery<{ release: any }>({
    queryKey: ["/api/releases", params.id],
  });

  const existingHistory = isEdit
    ? releaseData?.release?.histories?.find((h: any) => h.id === Number(params.historyId))
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
    if (existingHistory) {
      form.reset({
        status: existingHistory.status || "Created",
        environment: existingHistory.environment || "prod",
        releaseManagerUserId: existingHistory.releaseManagerUserId ? String(existingHistory.releaseManagerUserId) : "",
        approvedByUserId: existingHistory.approvedByUserId ? String(existingHistory.approvedByUserId) : "",
        dateOfApproval: existingHistory.dateOfApproval ? new Date(existingHistory.dateOfApproval).toISOString().slice(0, 16) : "",
        comment: existingHistory.comment || "",
        server: existingHistory.server || "",
        port: existingHistory.port ? String(existingHistory.port) : "",
        releaseDate: existingHistory.releaseDate ? new Date(existingHistory.releaseDate).toISOString().slice(0, 16) : "",
        releaseNotes: existingHistory.releaseNotes || "",
        releaseVideo: existingHistory.releaseVideo || "",
        smokeTestDate: existingHistory.smokeTestDate ? new Date(existingHistory.smokeTestDate).toISOString().slice(0, 16) : "",
        smokeTestResult: existingHistory.smokeTestResult || "",
      });
    } else if (releaseData?.release && !isEdit) {
      form.setValue("environment", releaseData.release.environment || "prod");
      form.setValue("status", releaseData.release.status || "Created");
    }
  }, [existingHistory, releaseData, isEdit, form]);

  const mutation = useMutation({
    mutationFn: async (values: HistoryFormValues) => {
      const body: any = {
        releaseId,
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

      const res = isEdit
        ? await apiRequest("PUT", `/api/release-histories/${params.historyId}`, body)
        : await apiRequest("POST", "/api/release-histories", body);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: isEdit ? "History updated" : "History entry created" });
      queryClient.invalidateQueries({ queryKey: ["/api/releases", params.id] });
      navigate(`/releases/${releaseId}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/releases/${releaseId}`)} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-form-title">
            {isEdit ? "Edit History Entry" : "New History Entry"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Release v{releaseData?.release?.version || "..."}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
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
                        {usersData?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
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
                        {usersData?.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
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
                <Button type="button" variant="outline" onClick={() => navigate(`/releases/${releaseId}`)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending} data-testid="button-save">
                  {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isEdit ? "Update" : "Create"} Entry
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
