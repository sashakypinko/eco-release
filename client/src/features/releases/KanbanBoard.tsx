import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation } from "wouter";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensors,
  useSensor,
  useDroppable,
  CollisionDetection,
  pointerWithin,
  rectIntersection,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, Calendar as CalendarIcon, User, MoreHorizontal, ChevronDown, ChevronRight, Eye, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EnvironmentBadge } from "@/shared/StatusBadge";
import { STATUS_OPTIONS, statusVariant } from "@/shared/constants";
import { formatDate } from "@/shared/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useReorderReleasesMutation, useDeleteReleaseMutation } from "./api";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ReleaseFormModal from "./ReleaseFormModal";
import type { Release } from "@/shared/types";

interface KanbanBoardProps {
  items: Release[];
  isLoading: boolean;
  error?: any;
}

const COLLAPSED_KEY = "kanban-collapsed-columns";

function getCollapsedColumns(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveCollapsedColumns(collapsed: Record<string, boolean>) {
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed));
}

function CardContent({ item, isOverlay = false }: { item: Release; isOverlay?: boolean }) {
  return (
    <div
      className={`bg-card border rounded-lg p-3 space-y-2 ${
        isOverlay ? "shadow-lg ring-2 ring-primary/20" : ""
      }`}
      data-testid={`kanban-card-${item.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs text-muted-foreground font-mono">#{item.id}</span>
      </div>
      <p className="font-medium text-sm truncate">{item.version}</p>
      {item.product && (
        <p className="text-xs text-muted-foreground truncate">{item.product.name}</p>
      )}
      <div className="flex items-center gap-1.5 flex-wrap">
        <EnvironmentBadge env={item.environment} />
        {item.projectJiraIssue && (
          <a
            href={item.projectJiraIssue}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
            data-testid={`kanban-jira-${item.id}`}
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        {item.plannedReleaseDate ? (
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            {formatDate(item.plannedReleaseDate)}
          </span>
        ) : (
          <span />
        )}
        {item.user && (
          <span className="inline-flex items-center gap-1 truncate max-w-[120px]">
            <User className="w-3 h-3" />
            {item.user.name}
          </span>
        )}
      </div>
    </div>
  );
}

function CardContextMenu({
  item,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  item: Release;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity z-20"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          data-testid={`kanban-card-menu-${item.id}`}
        >
          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(); }} data-testid={`kanban-card-view-${item.id}`}>
          <Eye className="w-4 h-4 mr-2" />
          View
        </DropdownMenuItem>
        {canEdit && (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }} data-testid={`kanban-card-edit-${item.id}`}>
            <Pencil className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive focus:text-destructive"
            data-testid={`kanban-card-delete-${item.id}`}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortableCard({
  item,
  onClick,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: {
  item: Release;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `item-${item.id}`,
    data: { type: "card", item },
  });

  const wasDragging = useRef(false);

  useEffect(() => {
    if (isDragging) {
      wasDragging.current = true;
    }
  }, [isDragging]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (wasDragging.current) {
      wasDragging.current = false;
      e.stopPropagation();
      return;
    }
    onClick();
  }, [onClick]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative group cursor-grab active:cursor-grabbing"
      onClick={handleClick}
    >
      <CardContextMenu
        item={item}
        onView={onClick}
        onEdit={onEdit}
        onDelete={onDelete}
        canEdit={canEdit}
        canDelete={canDelete}
      />
      <CardContent item={item} />
    </div>
  );
}

function DroppableColumn({
  statusName,
  items,
  onCardClick,
  onCardEdit,
  onCardDelete,
  canEdit,
  canDelete,
  isOver,
  collapsed,
  onToggleCollapse,
}: {
  statusName: string;
  items: Release[];
  onCardClick: (id: number) => void;
  onCardEdit: (id: number) => void;
  onCardDelete: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
  isOver: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const { setNodeRef } = useDroppable({
    id: `column-${statusName}`,
  });

  const sortableIds = items.map((i) => `item-${i.id}`);
  const variant = statusVariant[statusName] || "bg-muted text-muted-foreground";

  if (collapsed) {
    return (
      <div
        className="flex flex-col items-center w-10 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors py-2"
        onClick={onToggleCollapse}
        data-testid={`kanban-column-collapsed-${statusName}`}
      >
        <ChevronRight className="w-4 h-4 text-muted-foreground mb-2 shrink-0" />
        <Badge className={`${variant} no-default-hover-elevate no-default-active-elevate text-xs shrink-0 [writing-mode:vertical-lr] rotate-180 py-1.5 px-1`}>
          {statusName}
        </Badge>
        <span className="text-xs text-muted-foreground font-medium mt-2 shrink-0">{items.length}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col min-w-[280px] max-w-[300px] rounded-lg border transition-colors ${
        isOver ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30"
      }`}
    >
      <div className="px-3 py-2.5 border-b flex items-center gap-2">
        <button
          onClick={onToggleCollapse}
          className="p-0.5 rounded hover:bg-muted transition-colors shrink-0"
          data-testid={`kanban-column-toggle-${statusName}`}
        >
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
        <Badge className={`${variant} no-default-hover-elevate no-default-active-elevate text-xs shrink-0`}>
          {statusName}
        </Badge>
        <span className="text-xs text-muted-foreground font-medium shrink-0 ml-auto">{items.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[120px] max-h-[calc(100vh-260px)]"
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {items.length > 0 ? (
            items.map((item) => (
              <SortableCard
                key={item.id}
                item={item}
                onClick={() => onCardClick(item.id)}
                onEdit={() => onCardEdit(item.id)}
                onDelete={() => onCardDelete(item.id)}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-xs text-muted-foreground">
              No Items
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}

export default function KanbanBoard({ items, isLoading, error }: KanbanBoardProps) {
  const [, navigate] = useLocation();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canReorder = hasPermission("release:edit");
  const canEdit = hasPermission("release:edit");
  const canDelete = hasPermission("release:delete");

  const [reorderReleases] = useReorderReleasesMutation();
  const [deleteRelease] = useDeleteReleaseMutation();

  const [activeCard, setActiveCard] = useState<Release | null>(null);
  const [localColumns, setLocalColumns] = useState<Map<string, Release[]> | null>(null);
  const localColumnsRef = useRef<Map<string, Release[]> | null>(null);
  const pendingMoveRef = useRef<{ itemId: number; targetStatus: string } | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>(getCollapsedColumns);
  const [editReleaseId, setEditReleaseId] = useState<string | null>(null);

  const toggleCollapse = useCallback((status: string) => {
    setCollapsedColumns((prev) => {
      const next = { ...prev, [status]: !prev[status] };
      saveCollapsedColumns(next);
      return next;
    });
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteRelease(String(id)).unwrap();
      toast({ title: "Release deleted" });
    } catch {
      toast({ title: "Failed to delete release", variant: "destructive" });
    }
  }, [deleteRelease, toast]);

  const serverGrouped = useMemo(() => {
    const map = new Map<string, Release[]>();
    for (const status of STATUS_OPTIONS) {
      map.set(status, []);
    }
    for (const item of items) {
      const status = item.latestStatus || item.status || "Created";
      const list = map.get(status);
      if (list) {
        list.push(item);
      } else {
        const created = map.get("Created");
        if (created) created.push(item);
      }
    }
    Array.from(map.values()).forEach((list) => {
      list.sort((a: Release, b: Release) => (a.sortOrder || 0) - (b.sortOrder || 0));
    });
    return map;
  }, [items]);

  const grouped = localColumns || serverGrouped;

  const itemMap = useMemo(() => {
    const m = new Map<number, Release>();
    for (const item of items) {
      m.set(item.id, item);
    }
    return m;
  }, [items]);

  useEffect(() => {
    const pending = pendingMoveRef.current;
    if (!pending || !localColumns) return;
    const serverList = serverGrouped.get(pending.targetStatus) || [];
    if (serverList.some((item) => item.id === pending.itemId)) {
      pendingMoveRef.current = null;
      localColumnsRef.current = null;
      setLocalColumns(null);
    }
  }, [serverGrouped, localColumns]);

  const updateLocalColumns = useCallback((cols: Map<string, Release[]>) => {
    localColumnsRef.current = cols;
    setLocalColumns(cols);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: canReorder ? 5 : Infinity },
    }),
    useSensor(KeyboardSensor),
  );

  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      const cardCollision = pointerCollisions.find((c) =>
        String(c.id).startsWith("item-")
      );
      if (cardCollision) return [cardCollision];
      const columnCollision = pointerCollisions.find((c) =>
        String(c.id).startsWith("column-")
      );
      if (columnCollision) return [columnCollision];
      return pointerCollisions;
    }
    return rectIntersection(args);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "card") {
      setActiveCard(data.item);
      const initial = new Map(
        Array.from(serverGrouped.entries()).map(([k, v]) => [k, [...v]])
      );
      updateLocalColumns(initial);
    }
  }, [serverGrouped, updateLocalColumns]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    if (!canReorder) return;
    const { active, over } = event;
    if (!over || !localColumnsRef.current) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    const cols = localColumnsRef.current;
    let sourceStatus: string | null = null;
    let activeItem: Release | null = null;

    const colEntries = Array.from(cols.entries());
    for (let c = 0; c < colEntries.length; c++) {
      const [status, list] = colEntries[c];
      const idx = list.findIndex((i: Release) => `item-${i.id}` === activeId);
      if (idx !== -1) {
        sourceStatus = status;
        activeItem = list[idx];
        break;
      }
    }
    if (!sourceStatus || !activeItem) return;

    let targetStatus: string | null = null;
    let overIndex = -1;

    if (overId.startsWith("column-")) {
      targetStatus = overId.replace("column-", "");
    } else if (overId.startsWith("item-")) {
      for (let c = 0; c < colEntries.length; c++) {
        const [status, list] = colEntries[c];
        const idx = list.findIndex((i: Release) => `item-${i.id}` === overId);
        if (idx !== -1) {
          targetStatus = status;
          overIndex = idx;
          break;
        }
      }
    }

    if (!targetStatus) return;
    setOverColumnId(targetStatus);

    if (sourceStatus === targetStatus) {
      const list = cols.get(sourceStatus)!;
      const activeIdx = list.findIndex((i) => `item-${i.id}` === activeId);
      if (activeIdx !== -1 && overIndex !== -1 && activeIdx !== overIndex) {
        const newList = arrayMove(list, activeIdx, overIndex);
        const newCols = new Map(cols);
        newCols.set(sourceStatus, newList);
        updateLocalColumns(newCols);
      }
    } else {
      const sourceList = [...cols.get(sourceStatus)!];
      const targetList = [...cols.get(targetStatus)!];
      const activeIdx = sourceList.findIndex((i) => `item-${i.id}` === activeId);
      if (activeIdx !== -1) {
        sourceList.splice(activeIdx, 1);
        if (overIndex !== -1) {
          targetList.splice(overIndex, 0, activeItem);
        } else {
          targetList.push(activeItem);
        }
        const newCols = new Map(cols);
        newCols.set(sourceStatus, sourceList);
        newCols.set(targetStatus, targetList);
        updateLocalColumns(newCols);
      }
    }
  }, [canReorder, updateLocalColumns]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveCard(null);
    setOverColumnId(null);

    if (!canReorder || !localColumnsRef.current) {
      localColumnsRef.current = null;
      setLocalColumns(null);
      return;
    }

    const finalColumns = localColumnsRef.current;
    const reorderItems: Array<{ id: number; sort_order: number; status?: string }> = [];
    let hasStatusChange = false;
    let statusChangeItem: { id: number; status: string } | null = null;

    Array.from(finalColumns.entries()).forEach(([status, cards]) => {
      cards.forEach((card: Release, index: number) => {
        const original = itemMap.get(card.id);
        const newSortOrder = index + 1;
        const originalStatus = original?.latestStatus || original?.status || "Created";
        const statusChanged = originalStatus !== status;
        const sortOrderChanged = (original?.sortOrder || 0) !== newSortOrder;

        if (statusChanged || sortOrderChanged) {
          const entry: { id: number; sort_order: number; status?: string } = { id: card.id, sort_order: newSortOrder };
          if (statusChanged) {
            entry.status = status;
            hasStatusChange = true;
            statusChangeItem = { id: card.id, status };
          }
          reorderItems.push(entry);
        }
      });
    });

    if (reorderItems.length === 0) {
      localColumnsRef.current = null;
      setLocalColumns(null);
      return;
    }

    try {
      if (statusChangeItem) {
        const sc = statusChangeItem as { id: number; status: string };
        pendingMoveRef.current = {
          itemId: sc.id,
          targetStatus: sc.status,
        };
      }

      await reorderReleases({ items: reorderItems }).unwrap();

      if (!hasStatusChange) {
        localColumnsRef.current = null;
        setLocalColumns(null);
      }
    } catch {
      pendingMoveRef.current = null;
      localColumnsRef.current = null;
      setLocalColumns(null);
    }
  }, [canReorder, itemMap, reorderReleases]);

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
    setOverColumnId(null);
    pendingMoveRef.current = null;
    localColumnsRef.current = null;
    setLocalColumns(null);
  }, []);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[280px] max-w-[300px] rounded-lg border bg-muted/30">
            <div className="px-3 py-2.5 border-b">
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="p-2 space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Failed to load releases for board view.</p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex gap-3 overflow-x-auto pb-4" data-testid="kanban-board">
          {STATUS_OPTIONS.map((status) => (
            <DroppableColumn
              key={status}
              statusName={status}
              items={grouped.get(status) || []}
              onCardClick={(id) => navigate(`/releases/${id}`)}
              onCardEdit={(id) => setEditReleaseId(String(id))}
              onCardDelete={handleDelete}
              canEdit={canEdit}
              canDelete={canDelete}
              isOver={overColumnId === status}
              collapsed={!!collapsedColumns[status]}
              onToggleCollapse={() => toggleCollapse(status)}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeCard ? (
            <div style={{ width: 280 }}>
              <CardContent item={activeCard} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {editReleaseId !== null && (
        <ReleaseFormModal
          open={true}
          releaseId={editReleaseId}
          onClose={() => setEditReleaseId(null)}
          onSuccess={() => setEditReleaseId(null)}
        />
      )}
    </>
  );
}
