"use client";

import { useMemo, useState } from "react";
import AppHeader from "@/components/shared/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type BatchCsvRow = {
  model: string;
  ndoc: string;
  ok1: boolean;
  ok2: boolean;
  status1: number | null;
  status2: number | null;
  elapsed1: number;
  elapsed2: number;
  diffCount: number;
};

type ComparisonRow = {
  model: string;
  ndoc: string;
  before: BatchCsvRow | null;
  after: BatchCsvRow | null;
  beforeOk1: boolean | null;
  beforeOk2: boolean | null;
  afterOk1: boolean | null;
  afterOk2: boolean | null;
  ok1Status: "improved" | "regressed" | "same" | "na";
  ok2Status: "improved" | "regressed" | "same" | "na";
  beforeDiff: number | null;
  afterDiff: number | null;
  diffDelta: number | null;
  diffStatus: "improved" | "regressed" | "same" | "na";
  beforeElapsed1: number | null;
  beforeElapsed2: number | null;
  afterElapsed1: number | null;
  afterElapsed2: number | null;
  elapsed1Delta: number | null;
  elapsed2Delta: number | null;
  elapsed1Status: "improved" | "regressed" | "same" | "na";
  elapsed2Status: "improved" | "regressed" | "same" | "na";
};

type ParsedCsv = {
  rows: BatchCsvRow[];
  invalidRows: number;
  missingHeaders: string[];
};

const REQUIRED_HEADERS = [
  "model",
  "ndoc",
  "ok1",
  "ok2",
  "status1",
  "status2",
  "elapsed1",
  "elapsed2",
  "diffCount",
];

const HEADER_MAP: Record<string, keyof BatchCsvRow> = {
  model: "model",
  modelo: "model",
  ndoc: "ndoc",
  documento: "ndoc",
  ok1: "ok1",
  ok2: "ok2",
  status1: "status1",
  status2: "status2",
  elapsed1ms: "elapsed1",
  elapsed2ms: "elapsed2",
  elapsed1: "elapsed1",
  elapsed2: "elapsed2",
  diffcount: "diffCount",
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      out.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  out.push(current);
  return out;
}

function parseBoolean(raw: string | undefined) {
  const value = (raw ?? "").trim().toLowerCase();
  return value === "true" || value === "1" || value === "yes";
}

function parseNumber(raw: string | undefined, fallback = 0) {
  if (raw === undefined || raw === null) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function parseNullableNumber(raw: string | undefined) {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function coerceBatchRow(
  raw: Partial<Record<keyof BatchCsvRow, string>>,
): BatchCsvRow | null {
  const model = (raw.model ?? "").trim();
  const ndoc = (raw.ndoc ?? "").trim();
  if (!model || !ndoc) return null;

  return {
    model,
    ndoc,
    ok1: parseBoolean(raw.ok1),
    ok2: parseBoolean(raw.ok2),
    status1: parseNullableNumber(raw.status1),
    status2: parseNullableNumber(raw.status2),
    elapsed1: parseNumber(raw.elapsed1),
    elapsed2: parseNumber(raw.elapsed2),
    diffCount: parseNumber(raw.diffCount),
  };
}

function parseBatchCsv(text: string): ParsedCsv {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  if (!normalized) {
    return { rows: [], invalidRows: 0, missingHeaders: REQUIRED_HEADERS };
  }

  const lines = normalized.split("\n").filter((line) => line.trim().length);
  if (lines.length === 0) {
    return { rows: [], invalidRows: 0, missingHeaders: REQUIRED_HEADERS };
  }

  const rawHeaders = splitCsvLine(lines[0]);
  if (rawHeaders.length === 0) {
    return { rows: [], invalidRows: 0, missingHeaders: REQUIRED_HEADERS };
  }

  rawHeaders[0] = rawHeaders[0].replace(/^\uFEFF/, "");
  const headerKeys = rawHeaders.map((header) =>
    HEADER_MAP[normalizeHeader(header)] ?? null,
  );

  const missingHeaders = REQUIRED_HEADERS.filter(
    (required) => !headerKeys.includes(required as keyof BatchCsvRow),
  );

  const rows: BatchCsvRow[] = [];
  let invalidRows = 0;

  for (let i = 1; i < lines.length; i += 1) {
    const values = splitCsvLine(lines[i]);
    const rawRow: Partial<Record<keyof BatchCsvRow, string>> = {};

    headerKeys.forEach((key, index) => {
      if (!key) return;
      rawRow[key] = values[index] ?? "";
    });

    const row = coerceBatchRow(rawRow);
    if (!row) {
      invalidRows += 1;
      continue;
    }

    rows.push(row);
  }

  return { rows, invalidRows, missingHeaders };
}

function makeRowKey(row: BatchCsvRow) {
  return `${row.model}::${row.ndoc}`;
}

function buildRowMap(rows: BatchCsvRow[]) {
  const map = new Map<string, BatchCsvRow>();
  let duplicates = 0;

  rows.forEach((row) => {
    const key = makeRowKey(row);
    if (map.has(key)) duplicates += 1;
    map.set(key, row);
  });

  return { map, duplicates };
}

function formatNumber(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) return "-";
  return value.toFixed(digits);
}

function formatDelta(value: number | null, digits = 0) {
  if (value === null || Number.isNaN(value)) return "-";
  const fixed = value.toFixed(digits);
  return value > 0 ? `+${fixed}` : fixed;
}

function getDeltaStatus(delta: number | null) {
  if (delta === null) return "na" as const;
  if (delta < 0) return "improved" as const;
  if (delta > 0) return "regressed" as const;
  return "same" as const;
}

function getOkStatus(beforeOk: boolean | null, afterOk: boolean | null) {
  if (beforeOk === null || afterOk === null) return "na" as const;
  if (beforeOk === afterOk) return "same" as const;
  if (!beforeOk && afterOk) return "improved" as const;
  return "regressed" as const;
}

const STATUS_STYLES = {
  improved:
    "border-[color:var(--color-feedback-success)]/30 bg-[color:var(--color-feedback-success)]/10 text-[color:var(--color-feedback-success)]",
  regressed:
    "border-[color:var(--color-feedback-error)]/30 bg-[color:var(--color-feedback-error)]/10 text-[color:var(--color-feedback-error)]",
  same: "bg-muted text-muted-foreground",
  na: "bg-muted text-muted-foreground",
} as const;

export default function BatchComparisonPage() {
  const [beforeFile, setBeforeFile] = useState<File | null>(null);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [beforeRows, setBeforeRows] = useState<BatchCsvRow[]>([]);
  const [afterRows, setAfterRows] = useState<BatchCsvRow[]>([]);
  const [beforeInvalid, setBeforeInvalid] = useState(0);
  const [afterInvalid, setAfterInvalid] = useState(0);
  const [beforeDuplicates, setBeforeDuplicates] = useState(0);
  const [afterDuplicates, setAfterDuplicates] = useState(0);
  const [comparisonResults, setComparisonResults] = useState<ComparisonRow[]>(
    [],
  );
  const [error, setError] = useState<string>("");

  const handleFileUpload = async (file: File, type: "before" | "after") => {
    setError("");
    setComparisonResults([]);

    try {
      const text = await file.text();
      const parsed = parseBatchCsv(text);

      if (parsed.missingHeaders.length > 0) {
        setError(
          `Arquivo ${type === "before" ? "ANTES" : "DEPOIS"} invalido. ` +
            `Esperado CSV do processamento em lote (campos: ${parsed.missingHeaders.join(", ")}).`,
        );
        return;
      }

      const { duplicates } = buildRowMap(parsed.rows);

      if (type === "before") {
        setBeforeFile(file);
        setBeforeRows(parsed.rows);
        setBeforeInvalid(parsed.invalidRows);
        setBeforeDuplicates(duplicates);
      } else {
        setAfterFile(file);
        setAfterRows(parsed.rows);
        setAfterInvalid(parsed.invalidRows);
        setAfterDuplicates(duplicates);
      }
    } catch (err) {
      setError(
        `Erro ao processar arquivo ${type === "before" ? "ANTES" : "DEPOIS"}: ${err}`,
      );
    }
  };

  const compareData = () => {
    if (beforeRows.length === 0 || afterRows.length === 0) {
      setError("Por favor, carregue ambos os arquivos CSV");
      return;
    }

    const beforeMap = buildRowMap(beforeRows).map;
    const afterMap = buildRowMap(afterRows).map;
    const results: ComparisonRow[] = [];

    beforeMap.forEach((before, key) => {
      const after = afterMap.get(key);
      if (!after) return;

      const beforeOk1 = before ? before.ok1 : null;
      const beforeOk2 = before ? before.ok2 : null;
      const afterOk1 = after ? after.ok1 : null;
      const afterOk2 = after ? after.ok2 : null;
      const ok1Status = getOkStatus(beforeOk1, afterOk1);
      const ok2Status = getOkStatus(beforeOk2, afterOk2);

      const beforeDiff = before ? before.diffCount : null;
      const afterDiff = after ? after.diffCount : null;
      const diffComparable =
        beforeOk1 === true &&
        beforeOk2 === true &&
        afterOk1 === true &&
        afterOk2 === true &&
        beforeDiff !== null &&
        afterDiff !== null;
      const diffDelta = diffComparable ? afterDiff - beforeDiff : null;
      const diffStatus = diffComparable ? getDeltaStatus(diffDelta) : "na";

      const beforeElapsed1 = before ? before.elapsed1 : null;
      const beforeElapsed2 = before ? before.elapsed2 : null;
      const afterElapsed1 = after ? after.elapsed1 : null;
      const afterElapsed2 = after ? after.elapsed2 : null;
      const elapsed1Delta =
        beforeElapsed1 !== null && afterElapsed1 !== null
          ? afterElapsed1 - beforeElapsed1
          : null;
      const elapsed2Delta =
        beforeElapsed2 !== null && afterElapsed2 !== null
          ? afterElapsed2 - beforeElapsed2
          : null;
      const elapsed1Status = getDeltaStatus(elapsed1Delta);
      const elapsed2Status = getDeltaStatus(elapsed2Delta);

      results.push({
        model: before?.model ?? after?.model ?? "",
        ndoc: before?.ndoc ?? after?.ndoc ?? "",
        before,
        after,
        beforeOk1,
        beforeOk2,
        afterOk1,
        afterOk2,
        ok1Status,
        ok2Status,
        beforeDiff,
        afterDiff,
        diffDelta,
        diffStatus,
        beforeElapsed1,
        beforeElapsed2,
        afterElapsed1,
        afterElapsed2,
        elapsed1Delta,
        elapsed2Delta,
        elapsed1Status,
        elapsed2Status,
      });
    });

    results.sort((a, b) => {
      const byModel = a.model.localeCompare(b.model);
      if (byModel !== 0) return byModel;
      return a.ndoc.localeCompare(b.ndoc);
    });

    setComparisonResults(results);
    setError("");
  };

  const downloadComparison = () => {
    if (comparisonResults.length === 0) return;

    const headers = [
      "model",
      "ndoc",
      "before_ok1",
      "before_ok2",
      "after_ok1",
      "after_ok2",
      "ok1_status",
      "ok2_status",
      "before_diffCount",
      "after_diffCount",
      "diff_delta",
      "diff_status",
      "before_elapsed1_ms",
      "before_elapsed2_ms",
      "after_elapsed1_ms",
      "after_elapsed2_ms",
      "elapsed1_delta_ms",
      "elapsed2_delta_ms",
      "elapsed1_status",
      "elapsed2_status",
      "before_status1",
      "before_status2",
      "after_status1",
      "after_status2",
    ];

    const rows = comparisonResults.map((result) => {
      const beforeStatus1 = result.before?.status1 ?? "";
      const beforeStatus2 = result.before?.status2 ?? "";
      const afterStatus1 = result.after?.status1 ?? "";
      const afterStatus2 = result.after?.status2 ?? "";

      return [
        result.model,
        result.ndoc,
        result.beforeOk1 === null ? "" : String(result.beforeOk1),
        result.beforeOk2 === null ? "" : String(result.beforeOk2),
        result.afterOk1 === null ? "" : String(result.afterOk1),
        result.afterOk2 === null ? "" : String(result.afterOk2),
        result.ok1Status,
        result.ok2Status,
        result.beforeDiff ?? "",
        result.afterDiff ?? "",
        result.diffDelta ?? "",
        result.diffStatus,
        result.beforeElapsed1 ?? "",
        result.beforeElapsed2 ?? "",
        result.afterElapsed1 ?? "",
        result.afterElapsed2 ?? "",
        result.elapsed1Delta ?? "",
        result.elapsed2Delta ?? "",
        result.elapsed1Status,
        result.elapsed2Status,
        beforeStatus1,
        beforeStatus2,
        afterStatus1,
        afterStatus2,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `batch_comparison_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = useMemo(() => {
    if (comparisonResults.length === 0) return null;

    const matched = comparisonResults.length;
    const elapsed1Improved = comparisonResults.filter(
      (r) => r.elapsed1Status === "improved",
    ).length;
    const elapsed1Regressed = comparisonResults.filter(
      (r) => r.elapsed1Status === "regressed",
    ).length;
    const elapsed2Improved = comparisonResults.filter(
      (r) => r.elapsed2Status === "improved",
    ).length;
    const elapsed2Regressed = comparisonResults.filter(
      (r) => r.elapsed2Status === "regressed",
    ).length;

    return {
      matched,
      elapsed1Improved,
      elapsed1Regressed,
      elapsed2Improved,
      elapsed2Regressed,
      total: comparisonResults.length,
    };
  }, [comparisonResults]);

  return (
    <>
      <AppHeader
        appName="Xango API Testing"
        logoSrc="/serasa-logo.svg"
        menus={[
          { label: "Consulta Unica", href: "/unique" },
          { label: "Processamento em Lote", href: "/batch" },
          { label: "Comparacao de Lotes", href: "/compare" },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Comparacao de Lotes</CardTitle>
          <CardDescription>
            Carregue dois CSVs exportados do processamento em lote para comparar
            os resultados antes e depois das alteracoes na API.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <Label>Arquivo ANTES das alteracoes</Label>
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-slate-400">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "before");
                  }}
                  className="hidden"
                  id="before-file"
                />
                <label
                  htmlFor="before-file"
                  className="flex cursor-pointer flex-col items-center justify-center"
                >
                  <Upload className="mb-2 h-8 w-8 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">
                    {beforeFile ? beforeFile.name : "Clique para selecionar"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">CSV (max 10MB)</p>
                </label>
              </div>
              {beforeFile && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{beforeRows.length} registros validos</span>
                  {beforeInvalid > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {beforeInvalid} invalidos
                    </Badge>
                  )}
                  {beforeDuplicates > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {beforeDuplicates} duplicados
                    </Badge>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Arquivo DEPOIS das alteracoes</Label>
              <div className="rounded-lg border-2 border-dashed border-slate-300 p-6 transition-colors hover:border-slate-400">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "after");
                  }}
                  className="hidden"
                  id="after-file"
                />
                <label
                  htmlFor="after-file"
                  className="flex cursor-pointer flex-col items-center justify-center"
                >
                  <Upload className="mb-2 h-8 w-8 text-slate-400" />
                  <p className="text-sm font-medium text-slate-700">
                    {afterFile ? afterFile.name : "Clique para selecionar"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">CSV (max 10MB)</p>
                </label>
              </div>
              {afterFile && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{afterRows.length} registros validos</span>
                  {afterInvalid > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {afterInvalid} invalidos
                    </Badge>
                  )}
                  {afterDuplicates > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {afterDuplicates} duplicados
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="border-t pt-4">
            <Button
              onClick={compareData}
              className="w-full"
              size="lg"
              disabled={!beforeFile || !afterFile}
            >
              <FileText className="mr-2 h-5 w-5" />
              Comparar Resultados
            </Button>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>
              Visao geral das diferencas entre os dois lotes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">pares: {stats.matched}</Badge>
              <Badge
                variant="outline"
                className={STATUS_STYLES.improved}
              >
                T1 melhorou: {stats.elapsed1Improved}
              </Badge>
              <Badge
                variant="outline"
                className={STATUS_STYLES.regressed}
              >
                T1 piorou: {stats.elapsed1Regressed}
              </Badge>
              <Badge
                variant="outline"
                className={STATUS_STYLES.improved}
              >
                T2 melhorou: {stats.elapsed2Improved}
              </Badge>
              <Badge
                variant="outline"
                className={STATUS_STYLES.regressed}
              >
                T2 piorou: {stats.elapsed2Regressed}
              </Badge>
              <Badge variant="outline">total: {stats.total}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {comparisonResults.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Resultados da Comparacao</CardTitle>
                <CardDescription>
                  Comparacao detalhada por modelo e documento.
                </CardDescription>
              </div>
              <Button onClick={downloadComparison} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Baixar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Modelo</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Documento
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Diffs Antes
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Diffs Depois
                    </th>
                    <th className="px-4 py-3 text-center font-medium">Δ Diffs</th>
                    <th className="px-4 py-3 text-center font-medium">
                      OK1 Antes
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      OK1 Depois
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status OK1
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      OK2 Antes
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      OK2 Depois
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status OK2
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status1 Antes
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status2 Antes
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status1 Depois
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status2 Depois
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      T1 Antes (ms)
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      T2 Antes (ms)
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      T1 Depois (ms)
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      T2 Depois (ms)
                    </th>
                    <th className="px-4 py-3 text-center font-medium">Δ T1</th>
                    <th className="px-4 py-3 text-center font-medium">Δ T2</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResults.map((result) => {
                    const ok1Badge = result.ok1Status;
                    const ok2Badge = result.ok2Status;
                    const diffBadge = result.diffStatus;
                    const elapsed1Badge = result.elapsed1Status;
                    const elapsed2Badge = result.elapsed2Status;

                    return (
                      <tr
                        key={`${result.model}-${result.ndoc}`}
                        className="border-b hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">{result.model}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {result.ndoc}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {formatNumber(result.beforeDiff)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {formatNumber(result.afterDiff)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          <Badge variant="outline" className={STATUS_STYLES[diffBadge]}>
                            {formatDelta(result.diffDelta)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {result.beforeOk1 === null ? (
                            "-"
                          ) : result.beforeOk1 ? (
                            <Badge variant="outline" className={STATUS_STYLES.improved}>
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={STATUS_STYLES.regressed}>
                              Falha
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {result.afterOk1 === null ? (
                            "-"
                          ) : result.afterOk1 ? (
                            <Badge variant="outline" className={STATUS_STYLES.improved}>
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={STATUS_STYLES.regressed}>
                              Falha
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ok1Badge === "improved" ? (
                            <Badge variant="outline" className={STATUS_STYLES.improved}>
                              Melhorou
                            </Badge>
                          ) : ok1Badge === "regressed" ? (
                            <Badge variant="outline" className={STATUS_STYLES.regressed}>
                              Piorou
                            </Badge>
                          ) : ok1Badge === "same" ? (
                            <Badge variant="outline" className={STATUS_STYLES.same}>
                              Igual
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={STATUS_STYLES.na}>
                              -
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {result.beforeOk2 === null ? (
                            "-"
                          ) : result.beforeOk2 ? (
                            <Badge variant="outline" className={STATUS_STYLES.improved}>
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={STATUS_STYLES.regressed}>
                              Falha
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {result.afterOk2 === null ? (
                            "-"
                          ) : result.afterOk2 ? (
                            <Badge variant="outline" className={STATUS_STYLES.improved}>
                              OK
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={STATUS_STYLES.regressed}>
                              Falha
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ok2Badge === "improved" ? (
                            <Badge variant="outline" className={STATUS_STYLES.improved}>
                              Melhorou
                            </Badge>
                          ) : ok2Badge === "regressed" ? (
                            <Badge variant="outline" className={STATUS_STYLES.regressed}>
                              Piorou
                            </Badge>
                          ) : ok2Badge === "same" ? (
                            <Badge variant="outline" className={STATUS_STYLES.same}>
                              Igual
                            </Badge>
                          ) : (
                            <Badge variant="outline" className={STATUS_STYLES.na}>
                              -
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {formatNumber(result.before?.status1 ?? null)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {formatNumber(result.before?.status2 ?? null)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {formatNumber(result.after?.status1 ?? null)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {formatNumber(result.after?.status2 ?? null)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {formatNumber(result.beforeElapsed1, 0)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {formatNumber(result.beforeElapsed2, 0)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {formatNumber(result.afterElapsed1, 0)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {formatNumber(result.afterElapsed2, 0)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          <Badge
                            variant="outline"
                            className={STATUS_STYLES[elapsed1Badge]}
                          >
                            {formatDelta(result.elapsed1Delta, 0)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          <Badge
                            variant="outline"
                            className={STATUS_STYLES[elapsed2Badge]}
                          >
                            {formatDelta(result.elapsed2Delta, 0)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={STATUS_STYLES.improved}>
                  Melhorou
                </Badge>
                <span className="text-muted-foreground">
                  Reducao de diffs, OK ou tempo menor
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={STATUS_STYLES.regressed}>
                  Piorou
                </Badge>
                <span className="text-muted-foreground">
                  Aumento de diffs, OK caiu ou tempo maior
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={STATUS_STYLES.same}>
                  Igual
                </Badge>
                <span className="text-muted-foreground">
                  Sem alteracao relevante
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
