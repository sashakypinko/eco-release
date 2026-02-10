import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ENVIRONMENT_OPTIONS, STATUS_OPTIONS } from "@/lib/constants";

const releaseFormSchema = z.object({
  version: z.string().min(1, "Version is required"),
  description: z.string().optional(),
  environment: z.string().min(1, "Environment is required"),
  status: z.string().min(1, "Status is required"),
  projectJiraIssue: z.string().optional(),
  customerContact: z.string().optional(),
  plannedReleaseDate: z.string().optional(),
  productId: z.string().optional(),
  workOrderId: z.string().optional(),
  userId: z.string().optional(),
});

type ReleaseFormValues = z.infer<typeof releaseFormSchema>;

export default function ReleaseFormPage() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEdit = !!params.id;

  const { data: releaseData, isLoading: releaseLoading } = useQuery<{ release: any }>({
    queryKey: ["/api/releases", params.id],
    enabled: isEdit,
  });

  const { data: productsData } = useQuery<any[]>({ queryKey: ["/api/products"] });
  const { data: usersData } = useQuery<any[]>({ queryKey: ["/api/users"] });

  const form = useForm<ReleaseFormValues>({
    resolver: zodResolver(releaseFormSchema),
    defaultValues: {
      version: "",
      description: "",
      environment: "prod",
      status: "Created",
      projectJiraIssue: "",
      customerContact: "",
      plannedReleaseDate: "",
      productId: "",
      workOrderId: "",
      userId: "",
    },
  });

  const selectedProductId = form.watch("productId");

  const { data: workOrdersData } = useQuery<any[]>({
    queryKey: [`/api/work-orders?product_id=${selectedProductId}`],
    enabled: !!selectedProductId,
  });

  useEffect(() => {
    if (releaseData?.release) {
      const r = releaseData.release;
      form.reset({
        version: r.version || "",
        description: r.description || "",
        environment: r.environment || "prod",
        status: r.status || "Created",
        projectJiraIssue: r.projectJiraIssue || "",
        customerContact: r.customerContact || "",
        plannedReleaseDate: r.plannedReleaseDate ? r.plannedReleaseDate.split("T")[0] : "",
        productId: r.productId ? String(r.productId) : "",
        workOrderId: r.workOrderId ? String(r.workOrderId) : "",
        userId: r.userId ? String(r.userId) : "",
      });
    }
  }, [releaseData, form]);

  const mutation = useMutation({
    mutationFn: async (values: ReleaseFormValues) => {
      const body: any = {
        version: values.version,
        description: values.description || null,
        environment: values.environment,
        status: values.status,
        projectJiraIssue: values.projectJiraIssue || null,
        customerContact: values.customerContact || null,
        plannedReleaseDate: values.plannedReleaseDate || null,
        productId: values.productId ? Number(values.productId) : null,
        workOrderId: values.workOrderId ? Number(values.workOrderId) : null,
        userId: values.userId ? Number(values.userId) : null,
      };

      const res = isEdit
        ? await apiRequest("PUT", `/api/releases/${params.id}`, body)
        : await apiRequest("POST", "/api/releases", body);
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: isEdit ? "Release updated" : "Release created" });
      queryClient.invalidateQueries({ queryKey: ["/api/releases"] });
      if (isEdit) {
        queryClient.invalidateQueries({ queryKey: ["/api/releases", params.id] });
        navigate(`/releases/${params.id}`);
      } else {
        navigate(`/releases/${data.release?.id || ""}`);
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const onSubmit = (values: ReleaseFormValues) => {
    mutation.mutate(values);
  };

  if (isEdit && releaseLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(isEdit ? `/releases/${params.id}` : "/")} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-form-title">
            {isEdit ? "Edit Release" : "New Release"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isEdit ? "Update release details" : "Create a new release record"}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="productId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product">
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {productsData?.map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="workOrderId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Order</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={!selectedProductId}>
                      <FormControl>
                        <SelectTrigger data-testid="select-work-order">
                          <SelectValue placeholder={selectedProductId ? "Select work order" : "Select product first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {workOrdersData?.map((wo: any) => (
                          <SelectItem key={wo.id} value={String(wo.id)}>{wo.title || `WO-${wo.id}`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="version" render={({ field }) => (
                <FormItem>
                  <FormLabel>Version *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 2.1.0" {...field} data-testid="input-version" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Release description..." className="resize-none" {...field} data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="environment" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-environment">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ENVIRONMENT_OPTIONS.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="projectJiraIssue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jira Issue URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://jira.example.com/..." {...field} data-testid="input-jira" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="customerContact" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact name or email" {...field} data-testid="input-customer-contact" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="plannedReleaseDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Release Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-planned-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="userId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned User</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger data-testid="select-user">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {usersData?.map((u: any) => (
                          <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(isEdit ? `/releases/${params.id}` : "/")} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending} data-testid="button-save">
                  {mutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isEdit ? "Update" : "Create"} Release
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
