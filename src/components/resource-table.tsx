"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResourceWrapper, ProcessingState } from "@/src/types/ehr";

function relative(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}

function stateBadge(state: ProcessingState) {
  const map: Record<string, string> = {
    PROCESSING_STATE_COMPLETED: "success",
    PROCESSING_STATE_PROCESSING: "secondary",
    PROCESSING_STATE_NOT_STARTED: "outline",
    PROCESSING_STATE_FAILED: "destructive",
    PROCESSING_STATE_UNSPECIFIED: "outline",
  };
  const variant = (map[state] ?? "outline") as any;
  return <Badge variant={variant}>{state.replace("PROCESSING_STATE_", "")}</Badge>;
}

function useColumns(open: (row: ResourceWrapper) => void): ColumnDef<ResourceWrapper>[] {
  return useMemo<ColumnDef<ResourceWrapper>[]>(() => [
    {
      header: "Resource Type",
      accessorFn: (r) => r.resource.metadata.resourceType,
      cell: ({ row }) => (
        <button
          className="text-left underline-offset-2 hover:underline"
          onClick={() => open(row.original)}
        >
          {row.original.resource.metadata.resourceType}
        </button>
      ),
    },
    {
      header: "Created",
      accessorFn: (r) => r.resource.metadata.createdTime,
      cell: ({ getValue }) => {
        const iso = String(getValue());
        return <span title={iso}>{relative(iso)}</span>;
      },
    },
    {
      header: "Fetched",
      accessorFn: (r) => r.resource.metadata.fetchTime,
      cell: ({ getValue }) => {
        const iso = String(getValue());
        return <span title={iso}>{relative(iso)}</span>;
      },
    },
    {
      header: "State",
      accessorFn: (r) => r.resource.metadata.state,
      cell: ({ getValue }) => stateBadge(getValue() as ProcessingState),
    },
  ], [open]);
}

export function ResourceTable({ data }: { data: ResourceWrapper[] }) {
  const [selected, setSelected] = useState<ResourceWrapper | null>(null);
  const columns = useColumns((r) => setSelected(r));

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map(r => (
                <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r.original)}>
                  {r.getVisibleCells().map(c => (
                    <TableCell key={c.id}>
                      {flexRender(c.column.columnDef.cell, c.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-28 text-center text-sm text-muted-foreground">
                  No resources yet.
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
          </SheetHeader>
          <ScrollArea className="h-[85vh] pr-4">
            {selected && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Type</div>
                  <div className="font-medium">{selected.resource.metadata.resourceType}</div>

                  <div className="text-muted-foreground">Created</div>
                  <div title={selected.resource.metadata.createdTime}>
                    {relative(selected.resource.metadata.createdTime)}
                  </div>

                  <div className="text-muted-foreground">Fetched</div>
                  <div title={selected.resource.metadata.fetchTime}>
                    {relative(selected.resource.metadata.fetchTime)}
                  </div>

                  {selected.resource.metadata.processedTime && (
                    <>
                      <div className="text-muted-foreground">Processed</div>
                      <div title={selected.resource.metadata.processedTime}>
                        {relative(selected.resource.metadata.processedTime)}
                      </div>
                    </>
                  )}

                  <div className="text-muted-foreground">State</div>
                  <div>{stateBadge(selected.resource.metadata.state)}</div>

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
