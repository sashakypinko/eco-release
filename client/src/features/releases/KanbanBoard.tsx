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
import { ExternalLink, Calendar as CalendarIcon, User, GripVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, EnvironmentBadge } from "@/shared/StatusBadge";
import { STATUS_OPTIONS, statusVariant } from "@/shared/constants";
import { formatDate } from "@/shared/utils";
import { useAuth } from "@/providers/AuthProvider";
import { useReorderReleasesMutation } from "./api";
import type { Release } from "@/shared/types";

interface KanbanBoardProps {
  items: Release[];
  isLoading: boolean;
  error?: any;
}

const CARD_WIDTH = 280;

function CardContent({ item, isOverlay = false }: { item: Release; isOverlay?: boolean }) {
  return (
    <div
      className={`bg-card border rounded-lg p-3 space-y-2 ${
        isOverlay ? "shadow-lg ring-2 ring-primary/20" : ""
      }`}
      data-testid={`kanban-card-${item.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-sm font-medium truncate">{item.version}</span>
        <span className="text-xs text-muted-foreground font-mono shrink-0">#{item.id}</span>
      </div>
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

function SortableCard({ item, onClick }: { item: Release; onClick: () => void }) {
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="relative group cursor-pointer" onClick={onClick}>
        <div
          className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <CardContent item={item} />
      </div>
    </div>
  );
}

function DroppableColumn({
  statusName,
  items,
  onCardClick,
  isOver,
}: {
  statusName: string;
  items: Release[];
  onCardClick: (id: number) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id: `column-${statusName}`,
  });

  const sortableIds = items.map((i) => `item-${i.id}`);
  const variant = statusVariant[statusName] || "bg-muted text-muted-foreground";

  return (
    <div
      className={`flex flex-col min-w-[300px] max-w-[320px] rounded-lg border transition-colors ${
        isOver ? "bg-primary/5 ring-1 ring-primary/20" : "bg-muted/30"
      }`}
    >
      <div className="px-3 py-2.5 border-b flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Badge className={`${variant} no-default-hover-elevate no-default-active-elevate text-xs shrink-0`}>
            {statusName}
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground font-medium shrink-0">{items.length}</span>
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
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-xs text-muted-foreground">
              No items
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
  const canReorder = hasPermission("release:edit");

  const [reorderReleases] = useReorderReleasesMutation();

  const [activeCard, setActiveCard] = useState<Release | null>(null);
  const [localColumns, setLocalColumns] = useState<Map<string, Release[]> | null>(null);
  const localColumnsRef = useRef<Map<string, Release[]> | null>(null);
  const pendingMoveRef = useRef<{ itemId: number; targetStatus: string } | null>(null);
  const [overColumnId, setOverColumnId] = useState<string | null>(null);

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
          <div key={i} className="min-w-[300px] max-w-[320px] rounded-lg border bg-muted/30">
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
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-board">
        {STATUS_OPTIONS.map((status) => (
          <DroppableColumn
            key={status}
            statusName={status}
            items={grouped.get(status) || []}
            onCardClick={(id) => navigate(`/releases/${id}`)}
            isOver={overColumnId === status}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div style={{ width: CARD_WIDTH }}>
            <CardContent item={activeCard} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
