import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Plus, Search, X, Filter, ExternalLink, Calendar, User, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, EnvironmentBadge } from "@/components/status-badge";
import { STATUS_OPTIONS } from "@/lib/constants";
import { format } from "date-fns";

export default function ReleasesListPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: productsData } = useQuery<any[]>({ queryKey: ["/api/products"] });

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("page_size", "25");
  if (search) queryParams.set("search", search);
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (productFilter !== "all") queryParams.set("product_id", productFilter);

  const { data, isLoading } = useQuery<{
    data: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>({
    queryKey: [`/api/releases?${queryParams.toString()}`],
  });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setProductFilter("all");
    setPage(1);
  };

  const hasFilters = search || statusFilter !== "all" || productFilter !== "all";

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Releases</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your software releases and deployments</p>
        </div>
        <Button onClick={() => navigate("/releases/new")} data-testid="button-create-release">
          <Plus className="w-4 h-4 mr-2" />
          New Release
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by version..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[220px]" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={(v) => { setProductFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[200px]" data-testid="select-product-filter">
              <SelectValue placeholder="Filter by product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {productsData?.map((p: any) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} data-testid="button-clear-filters">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Jira Issue</TableHead>
                <TableHead>Planned Date</TableHead>
                <TableHead>User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data?.data && data.data.length > 0 ? (
                data.data.map((release: any) => (
                  <TableRow
                    key={release.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => navigate(`/releases/${release.id}`)}
                    data-testid={`row-release-${release.id}`}
                  >
                    <TableCell className="font-mono text-muted-foreground">{release.id}</TableCell>
                    <TableCell className="font-medium">{release.product?.name || "—"}</TableCell>
                    <TableCell className="font-mono">{release.version}</TableCell>
                    <TableCell><EnvironmentBadge env={release.environment} /></TableCell>
                    <TableCell><StatusBadge status={release.latestStatus} /></TableCell>
                    <TableCell>
                      {release.projectJiraIssue ? (
                        <a
                          href={release.projectJiraIssue}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`link-jira-${release.id}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Jira
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {release.plannedReleaseDate ? (
                        <span className="text-sm inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted-foreground" />
                          {format(new Date(release.plannedReleaseDate), "MMM d, yyyy")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {release.user ? (
                        <span className="text-sm inline-flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {release.user.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Rocket className="w-10 h-10 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No releases found</p>
                      <Button variant="outline" size="sm" onClick={() => navigate("/releases/new")} data-testid="button-create-first-release">
                        Create your first release
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {(data.page - 1) * data.pageSize + 1} to {Math.min(data.page * data.pageSize, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Rocket(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  );
}
