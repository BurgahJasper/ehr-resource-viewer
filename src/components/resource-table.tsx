import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import type { ResourceWrapper, ProcessingState } from "@/types/ehr";

console.log("ResourceTable from src is loaded");


function relative(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

function StatePill({ state }: { state: ProcessingState }) {
  // shadcn badge supports: "default" | "secondary" | "destructive" | "outline"
  const map: Record<ProcessingState, "default" | "secondary" | "destructive" | "outline"> = {
    PROCESSING_STATE_COMPLETED: "default",
    PROCESSING_STATE_PROCESSING: "secondary",
    PROCESSING_STATE_NOT_STARTED: "outline",
    PROCESSING_STATE_FAILED: "destructive",
    PROCESSING_STATE_UNSPECIFIED: "outline",
  };
  return (
    <Badge variant={map[state]}>
      {state.replace("PROCESSING_STATE_", "")}
    </Badge>
  );
}

function useColumns(open: (row: ResourceWrapper) => void): ColumnDef<ResourceWrapper>[] {
  return useMemo<ColumnDef<ResourceWrapper>[]>(() => [
    {
      header: "Resource Type",
      accessorFn: (r) => r.resource.metadata.resourceType,
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left underline-offset-2 hover:underline font-medium"
          onClick={() => open(row.original)}
        >
          {row.original.resource.metadata.resourceType}
        </button>
      ),
    },
    {
    id: "created",
    header: "Created",
    accessorFn: (r) => r.resource.metadata.createdTime,
    cell: ({ getValue }) => {
        const iso = String(getValue());
        const d = new Date(iso);
        return (
        <span className="text-sm" title={iso}>
            {Number.isNaN(d.getTime()) ? "—" : format(d, "yyyy-MM-dd HH:mm")}
        </span>
        );
    },
    },
    {
    id: "fetched",
    header: "Fetched",
    accessorFn: (r) => r.resource.metadata.fetchTime,
    cell: ({ getValue }) => {
        const iso = String(getValue());
        return (
        <span className="text-sm text-muted-foreground" title={iso}>
            {formatDistanceToNow(new Date(iso), { addSuffix: true })}
        </span>
        );
    },
    },
    {
      header: "State",
      accessorFn: (r) => r.resource.metadata.state,
      cell: ({ getValue }) => <StatePill state={getValue() as ProcessingState} />,
    },
  ], [open]);
}

export function ResourceTable({ data }: { data: ResourceWrapper[] }) {
  const [selected, setSelected] = useState<ResourceWrapper | null>(null);
  const [filter, setFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "fetched", desc: true }]);
  const columns = useColumns((r) => setSelected(r));

  const filtered = filter
    ? data.filter(d => {
        const m = d.resource.metadata;
        return (
          m.resourceType.toLowerCase().includes(filter.toLowerCase()) ||
          m.state.toLowerCase().includes(filter.toLowerCase())
        );
      })
    : data;

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
    onSortingChange: setSorting,
  });

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-xl font-semibold">Resources</h2>
        <Input
          placeholder="Filter by type or state…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => {
                  const label = h.isPlaceholder ? null : (h.column.columnDef.header as React.ReactNode);
                  return (
                    <TableHead
                      key={h.id}
                      className="whitespace-nowrap cursor-pointer select-none"
                      onClick={h.column.getToggleSortingHandler()}
                    >
                      {label}
                      {{
                        asc: " ▲",
                        desc: " ▼",
                      }[h.column.getIsSorted() as string] ?? null}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((r) => (
                <TableRow
                    key={r.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(r.original)}
                >
                    {r.getVisibleCells().map((c) => (
                    <TableCell key={c.id}>
                        {flexRender(c.column.columnDef.cell, c.getContext())}
                    </TableCell>
                    ))}
                </TableRow>
                ))
            ) : (
                <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-sm text-muted-foreground">
                    No resources found.
                </TableCell>
                </TableRow>
            )}
            </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Resource details</SheetTitle>
            <SheetDescription>Metadata and summaries for the selected resource.</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[85vh] pr-4">
            {selected && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Type</div>
                  <div className="font-medium">{selected.resource.metadata.resourceType}</div>

                  <div className="text-muted-foreground">Created</div>
                  <div title={selected.resource.metadata.createdTime}>{relative(selected.resource.metadata.createdTime)}</div>

                  <div className="text-muted-foreground">Fetched</div>
                  <div title={selected.resource.metadata.fetchTime}>{relative(selected.resource.metadata.fetchTime)}</div>

                  {selected.resource.metadata.processedTime && (
                    <>
                      <div className="text-muted-foreground">Processed</div>
                      <div title={selected.resource.metadata.processedTime}>{relative(selected.resource.metadata.processedTime)}</div>
                    </>
                  )}

                  <div className="text-muted-foreground">State</div>
                  <div><StatePill state={selected.resource.metadata.state} /></div>

                  <div className="text-muted-foreground">FHIR Version</div>
                  <div>{selected.resource.metadata.version}</div>

                  <div className="text-muted-foreground">Identifier.key</div>
                  <div className="font-mono">{selected.resource.metadata.identifier.key}</div>

                  <div className="text-muted-foreground">Identifier.uid</div>
                  <div className="font-mono">{selected.resource.metadata.identifier.uid}</div>

                  <div className="text-muted-foreground">Identifier.patientId</div>
                  <div className="font-mono">{selected.resource.metadata.identifier.patientId}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Human Readable</div>
                  <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-3 text-sm">
                    {selected.resource.humanReadableStr}
                  </pre>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">AI Summary</div>
                  <pre className="whitespace-pre-wrap rounded-lg border bg-muted p-3 text-sm">
                    {selected.resource.aiSummary ?? "—"}
                  </pre>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
