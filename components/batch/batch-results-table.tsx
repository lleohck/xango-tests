"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import JsonViewer from "@/components/shared/json-viewer";

export type BatchRow = {
  id: string;
  model: string;
  ndoc: string;
  ok1: boolean;
  ok2: boolean;
  status1: number | null;
  status2: number | null;
  elapsed1: number;
  elapsed2: number;
  diffCount: number;
  diffPaths: string[];
  result1: unknown;
  result2: unknown;
};

type Props = {
  rows: BatchRow[];
};

function toCsvValue(v: any) {
  const s = typeof v === "string" ? v : JSON.stringify(v);
  const escaped = s.replaceAll(`"`, `""`);
  return `"${escaped}"`;
}

export default function BatchResultsTable({ rows }: Props) {
  const [openRow, setOpenRow] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = rows.length;
    const matches = rows.filter(
      (r) => r.diffCount === 0 && r.ok1 && r.ok2,
    ).length;
    const mismatches = rows.filter(
      (r) => r.diffCount > 0 && r.ok1 && r.ok2,
    ).length;
    const failures = rows.filter((r) => !r.ok1 || !r.ok2).length;
    return { total, matches, mismatches, failures };
  }, [rows]);

  const downloadCSV = () => {
    const headers = [
      "model",
      "ndoc",
      "ok1",
      "ok2",
      "status1",
      "status2",
      "elapsed1_ms",
      "elapsed2_ms",
      "diffCount",
      "diffPaths",
    ];

    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          toCsvValue(r.model),
          toCsvValue(r.ndoc),
          toCsvValue(String(r.ok1)),
          toCsvValue(String(r.ok2)),
          toCsvValue(String(r.status1 ?? "")),
          toCsvValue(String(r.status2 ?? "")),
          toCsvValue(String(r.elapsed1)),
          toCsvValue(String(r.elapsed2)),
          toCsvValue(String(r.diffCount)),
          toCsvValue(r.diffPaths.join("|")),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `batch_comparison_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">total: {stats.total}</Badge>
          <Badge
            variant="outline"
            className="border-[color:var(--color-feedback-success)]/30 bg-[color:var(--color-feedback-success)]/10 text-[color:var(--color-feedback-success)]"
          >
            iguais: {stats.matches}
          </Badge>
          <Badge
            variant="outline"
            className="border-[color:var(--color-feedback-warning)]/30 bg-[color:var(--color-feedback-warning)]/10 text-[color:var(--color-feedback-warning)]"
          >
            diferentes: {stats.mismatches}
          </Badge>
          <Badge
            variant="outline"
            className="border-[color:var(--color-feedback-error)]/30 bg-[color:var(--color-feedback-error)]/10 text-[color:var(--color-feedback-error)]"
          >
            falhas: {stats.failures}
          </Badge>
        </div>

        <Button
          onClick={downloadCSV}
          variant="outline"
          size="sm"
          disabled={rows.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Baixar CSV
        </Button>
      </div>

      <div className="overflow-auto rounded-lg border border-border/70">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="w-[44px] px-2 py-3" />
              <th className="px-4 py-3 text-left font-medium">Modelo</th>
              <th className="px-4 py-3 text-left font-medium">Documento</th>
              <th className="px-4 py-3 text-center font-medium">Status 1</th>
              <th className="px-4 py-3 text-center font-medium">Status 2</th>
              <th className="px-4 py-3 text-center font-medium">T1 (ms)</th>
              <th className="px-4 py-3 text-center font-medium">T2 (ms)</th>
              <th className="px-4 py-3 text-center font-medium">Diffs</th>
              <th className="px-4 py-3 text-left font-medium">Paths</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const okBoth = r.ok1 && r.ok2;
              const isEqual = okBoth && r.diffCount === 0;

              const rowClass = !okBoth
                ? "bg-[color:var(--color-feedback-error)]/5"
                : isEqual
                  ? "bg-[color:var(--color-feedback-success)]/5"
                  : "bg-[color:var(--color-feedback-warning)]/5";

              const isOpen = openRow === r.id;

              return (
                <Fragment key={r.id}>
                  <tr className={`border-b hover:bg-accent/30 ${rowClass}`}>
                    <td className="px-2 py-2 align-middle">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          setOpenRow((prev) => (prev === r.id ? null : r.id))
                        }
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </td>

                    <td className="px-4 py-3 align-middle">{r.model}</td>
                    <td className="px-4 py-3 align-middle font-mono text-xs">
                      {r.ndoc}
                    </td>

                    <td className="px-4 py-3 align-middle text-center">
                      <Badge variant="outline">{r.status1 ?? "NO HTTP"}</Badge>
                    </td>

                    <td className="px-4 py-3 align-middle text-center">
                      <Badge variant="outline">{r.status2 ?? "NO HTTP"}</Badge>
                    </td>

                    <td className="px-4 py-3 align-middle text-center font-mono text-xs">
                      {r.elapsed1}
                    </td>
                    <td className="px-4 py-3 align-middle text-center font-mono text-xs">
                      {r.elapsed2}
                    </td>

                    <td className="px-4 py-3 align-middle text-center font-mono text-xs font-semibold">
                      {r.diffCount}
                    </td>

                    <td className="px-4 py-3 align-middle">
                      <div className="max-w-[420px] truncate text-xs text-muted-foreground">
                        {r.diffPaths.slice(0, 6).join(", ")}
                        {r.diffPaths.length > 6 ? "..." : ""}
                      </div>
                    </td>
                  </tr>

                  {isOpen ? (
                    <tr className="border-b">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              diffs: {r.diffCount}
                            </Badge>
                            {r.diffCount > 0 ? (
                              <Badge
                                variant="outline"
                                className="border-[color:var(--color-feedback-warning)]/30 bg-[color:var(--color-feedback-warning)]/10 text-[color:var(--color-feedback-warning)]"
                              >
                                diferentes
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-[color:var(--color-feedback-success)]/30 bg-[color:var(--color-feedback-success)]/10 text-[color:var(--color-feedback-success)]"
                              >
                                iguais
                              </Badge>
                            )}
                            {!okBoth ? (
                              <Badge
                                variant="outline"
                                className="border-[color:var(--color-feedback-error)]/30 bg-[color:var(--color-feedback-error)]/10 text-[color:var(--color-feedback-error)]"
                              >
                                falha
                              </Badge>
                            ) : null}
                          </div>

                          {r.diffPaths.length > 0 ? (
                            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                              <div className="text-xs text-muted-foreground">
                                Diferenças (paths)
                              </div>
                              <div className="mt-2 max-h-24 overflow-auto font-mono text-xs text-foreground">
                                {r.diffPaths.slice(0, 200).map((p) => (
                                  <div key={p}>{p}</div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          <div className="grid gap-3 lg:grid-cols-2">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                  Execução 1
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {r.status1 ?? "NO HTTP"}
                                  </Badge>
                                  <Badge variant="outline">
                                    {r.elapsed1}ms
                                  </Badge>
                                </div>
                              </div>
                              <JsonViewer
                                value={r.result1}
                                defaultOpenDepth={2}
                                className="max-h-[420px]"
                              />
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                  Execução 2
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {r.status2 ?? "NO HTTP"}
                                  </Badge>
                                  <Badge variant="outline">
                                    {r.elapsed2}ms
                                  </Badge>
                                </div>
                              </div>
                              <JsonViewer
                                value={r.result2}
                                defaultOpenDepth={2}
                                className="max-h-[420px]"
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
