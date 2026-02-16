import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Search, X, ExternalLink, Calendar as CalendarIcon, User, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { StatusBadge, EnvironmentBadge } from "@/shared/StatusBadge";
import { STATUS_OPTIONS } from "@/shared/constants";
import { formatDate } from "@/shared/utils";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setSearch, setStatusFilter, setProductFilter, setUserFilter, setDateFilter, setPage, clearFilters } from "./slice";
import { useGetReleasesQuery } from "./api";
import { useGetProductsQuery, useGetUsersQuery } from "@/features/reference-data/api";
import ReleaseFormModal from "./ReleaseFormModal";

export default function ReleasesListPage() {
  const [, navigate] = useLocation();
  const { hasPermission } = useAuth();
  const dispatch = useAppDispatch();
  const { search, statusFilter, productFilter, userFilter, dateFilter, page, pageSize } = useAppSelector((s) => s.releases);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: productsData } = useGetProductsQuery();
  const { data: usersData } = useGetUsersQuery();

  const queryParams = new URLSearchParams();
  queryParams.set("page", String(page));
  queryParams.set("page_size", String(pageSize));
  if (search) queryParams.set("search", search);
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (productFilter !== "all") queryParams.set("product_id", productFilter);
  if (userFilter !== "all") queryParams.set("user_id", userFilter);
  if (dateFilter) queryParams.set("date_from", dateFilter);
  if (dateFilter) queryParams.set("date_to", dateFilter);

  const { data, isLoading } = useGetReleasesQuery(queryParams.toString());

  const hasFilters = search || statusFilter !== "all" || productFilter !== "all" || userFilter !== "all" || dateFilter;

  const selectedDate = dateFilter ? new Date(dateFilter + "T00:00:00") : undefined;

  return (
    <div className="p-6 space-y-6 max-w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Releases</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your software releases and deployments</p>
        </div>
        {hasPermission("release:create") && (
          <Button onClick={() => setCreateModalOpen(true)} data-testid="button-create-release">
            <Plus className="w-4 h-4 mr-2" />
            New Release
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by version..."
              value={search}
              onChange={(e) => dispatch(setSearch(e.target.value))}
              className="pl-9"
              data-testid="input-search"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => dispatch(setStatusFilter(v))}>
            <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={(v) => dispatch(setProductFilter(v))}>
            <SelectTrigger className="w-[180px]" data-testid="select-product-filter">
              <SelectValue placeholder="Filter by product" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              {productsData?.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={userFilter} onValueChange={(v) => dispatch(setUserFilter(v))}>
            <SelectTrigger className="w-[180px]" data-testid="select-user-filter">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {usersData?.map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
                data-testid="button-date-filter"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(day) => {
                  if (day) {
                    const yyyy = day.getFullYear();
                    const mm = String(day.getMonth() + 1).padStart(2, "0");
                    const dd = String(day.getDate()).padStart(2, "0");
                    dispatch(setDateFilter(`${yyyy}-${mm}-${dd}`));
                  } else {
                    dispatch(setDateFilter(""));
                  }
                  setCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => dispatch(clearFilters())} data-testid="button-clear-filters">
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
                data.data.map((release) => (
                  <TableRow
                    key={release.id}
                    className="cursor-pointer hover-elevate"
                    onClick={() => navigate(`/releases/${release.id}`)}
                    data-testid={`row-release-${release.id}`}
                  >
                    <TableCell className="font-mono text-muted-foreground">{release.id}</TableCell>
                    <TableCell className="font-medium">{release.product?.name || "\u2014"}</TableCell>
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
                        <span className="text-muted-foreground">{"\u2014"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {release.plannedReleaseDate ? (
                        <span className="text-sm inline-flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                          {formatDate(release.plannedReleaseDate)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{"\u2014"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {release.user ? (
                        <span className="text-sm inline-flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {release.user.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{"\u2014"}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <RocketIcon className="w-10 h-10 text-muted-foreground/50" />
                      <p className="text-muted-foreground">No releases found</p>
                      {hasPermission("release:create") && (
                        <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(true)} data-testid="button-create-first-release">
                          Create your first release
                        </Button>
                      )}
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
                onClick={() => dispatch(setPage(page - 1))}
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
                onClick={() => dispatch(setPage(page + 1))}
                data-testid="button-next-page"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ReleaseFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={(id) => navigate(`/releases/${id}`)}
      />
    </div>
  );
}

function RocketIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  );
}
