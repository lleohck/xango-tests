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
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  generateComparisonReportPdf,
  type ComparisonReportRow,
} from "@/lib/pdf-utils";
import { mergeBatchFileMetadata } from "@/lib/xango-mappers";

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
  result1: unknown;
  result2: unknown;
};

type ComparisonRow = {
  model: string;
  ndoc: string;
  before: BatchCsvRow | null;
  after: BatchCsvRow | null;
  result1Equal: boolean | null;
  result2Equal: boolean | null;
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
  "result1",
  "result2",
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
  result1: "result1",
  result2: "result2",
};

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
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

function parseResultCell(raw: string | undefined) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
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
    result1: parseResultCell(raw.result1),
    result2: parseResultCell(raw.result2),
  };
}

function parseBatchCsv(text: string): ParsedCsv {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();

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
  const headerKeys = rawHeaders.map(
    (header) => HEADER_MAP[normalizeHeader(header)] ?? null,
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

function getDeltaBadgeStyle(value: number | null, digits = 0) {
  const formatted = formatDelta(value, digits);
  if (formatted.startsWith("-")) return STATUS_STYLES.improved;
  if (formatted.startsWith("+")) return STATUS_STYLES.regressed;
  return STATUS_STYLES.same;
}

function getDeltaStatus(delta: number | null) {
  if (delta === null) return "na" as const;
  if (delta < 0) return "improved" as const;
  if (delta > 0) return "regressed" as const;
  return "same" as const;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (!isObject(a) || !isObject(b)) return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (Array.isArray(b)) return false;

  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i += 1) {
    if (keysA[i] !== keysB[i]) return false;
    const key = keysA[i];
    if (
      !deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      )
    ) {
      return false;
    }
  }
  return true;
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
  const { data: session } = useSession();
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
  const [lastComparisonAt, setLastComparisonAt] = useState<Date | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileUpload = async (file: File, type: "before" | "after") => {
    setError("");
    setComparisonResults([]);

    try {
      const text = await file.text();
      const parsed = parseBatchCsv(text);

      if (parsed.missingHeaders.length > 0) {
        setError(
          `Arquivo ${type === "before" ? "ANTES" : "DEPOIS"} inválido. ` +
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

      const result1Comparable =
        before?.result1 !== null && after?.result1 !== null;
      const result2Comparable =
        before?.result2 !== null && after?.result2 !== null;
      const result1Equal = result1Comparable
        ? deepEqual(before?.result1, after?.result1)
        : null;
      const result2Equal = result2Comparable
        ? deepEqual(before?.result2, after?.result2)
        : null;
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
        result1Equal,
        result2Equal,
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
    setLastComparisonAt(new Date());
    setError("");
  };

  const downloadComparison = () => {
    if (comparisonResults.length === 0) return;

    const headers = [
      "model",
      "ndoc",
      "result1_equal",
      "result2_equal",
      "before_elapsed1_ms",
      "before_elapsed2_ms",
      "after_elapsed1_ms",
      "after_elapsed2_ms",
      "elapsed1_delta_ms",
      "elapsed2_delta_ms",
    ];

    const rows = comparisonResults.map((result) => {
      return [
        result.model,
        result.ndoc,
        result.result1Equal === null ? "" : String(result.result1Equal),
        result.result2Equal === null ? "" : String(result.result2Equal),
        result.beforeElapsed1 ?? "",
        result.beforeElapsed2 ?? "",
        result.afterElapsed1 ?? "",
        result.afterElapsed2 ?? "",
        result.elapsed1Delta ?? "",
        result.elapsed2Delta ?? "",
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    const d = new Date();
    const dateStr = [
      String(d.getDate()).padStart(2, "0"),
      String(d.getMonth() + 1).padStart(2, "0"),
      d.getFullYear(),
    ].join("-");

    const timeStr = [
      String(d.getHours()).padStart(2, "0"),
      String(d.getMinutes()).padStart(2, "0"),
      String(d.getSeconds()).padStart(2, "0"),
    ].join("-");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `batch_comparision_${dateStr}_${timeStr}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadOfficialReport = async () => {
    if (comparisonResults.length === 0) return;

    setIsGeneratingReport(true);

    try {
      const reportDate = new Date();
      const comparedAt = lastComparisonAt ?? reportDate;
      const metadata = mergeBatchFileMetadata(beforeFile, afterFile);
      const userName = session?.user?.name?.trim() || "Usuário autenticado";
      const userEmail = session?.user?.email?.trim() || "email não informado";
      const reportRows: ComparisonReportRow[] = comparisonResults.map(
        (row) => ({
          model: row.model,
          ndoc: row.ndoc,
          result1Equal: row.result1Equal,
          result2Equal: row.result2Equal,
          beforeElapsed1: row.beforeElapsed1,
          beforeElapsed2: row.beforeElapsed2,
          afterElapsed1: row.afterElapsed1,
          afterElapsed2: row.afterElapsed2,
          elapsed1Delta: row.elapsed1Delta,
          elapsed2Delta: row.elapsed2Delta,
        }),
      );

      await generateComparisonReportPdf({
        rows: reportRows,
        applicationName: metadata.applicationName,
        environmentName: metadata.environmentName,
        applicationCode: metadata.apiCode,
        environmentCode: metadata.environmentCode,
        beforeFileName: beforeFile?.name ?? null,
        afterFileName: afterFile?.name ?? null,
        userName,
        userEmail,
        comparedAt,
        generatedAt: reportDate,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "erro desconhecido ao gerar PDF";
      toast.error(`Falha ao gerar report oficial: ${message}`);
    } finally {
      setIsGeneratingReport(false);
    }
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

    const elapsed1Deltas = comparisonResults
      .map((r) => r.elapsed1Delta)
      .filter((value): value is number => value !== null);
    const elapsed2Deltas = comparisonResults
      .map((r) => r.elapsed2Delta)
      .filter((value): value is number => value !== null);

    const elapsed1AvgDelta =
      elapsed1Deltas.length > 0
        ? elapsed1Deltas.reduce((sum, value) => sum + value, 0) /
          elapsed1Deltas.length
        : null;
    const elapsed2AvgDelta =
      elapsed2Deltas.length > 0
        ? elapsed2Deltas.reduce((sum, value) => sum + value, 0) /
          elapsed2Deltas.length
        : null;

    return {
      matched,
      elapsed1Improved,
      elapsed1Regressed,
      elapsed2Improved,
      elapsed2Regressed,
      elapsed1AvgDelta,
      elapsed2AvgDelta,
      total: comparisonResults.length,
    };
  }, [comparisonResults]);

  return (
    <div>
      <AppHeader
        appName="Xango API Testing"
        logoSrc="/serasa-logo.svg"
        menus={[
          { label: "Consulta Única", href: "/unique" },
          { label: "Processamento em Lote", href: "/batch" },
          { label: "Comparação de Lotes", href: "/compare" },
        ]}
      />
      <div className="bg-background px-6 py-5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Comparação de Lotes
            </h1>
            <p className="text-muted-foreground">
              Carregue dois CSVs exportados do processamento em lote para
              comparar os resultados antes e depois das alterações na API.
            </p>
          </div>
          <Card>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>Arquivo ANTES das Alterações</Label>
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
                        {beforeFile
                          ? beforeFile.name
                          : "Clique para selecionar"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        CSV (máx. 10 MB)
                      </p>
                    </label>
                  </div>
                  {beforeFile && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{beforeRows.length} registros válidos</span>
                      {beforeInvalid > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {beforeInvalid} inválidos
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
                  <Label>Arquivo DEPOIS das Alterações</Label>
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
                      <p className="mt-1 text-xs text-slate-500">
                        CSV (máx. 10 MB)
                      </p>
                    </label>
                  </div>
                  {afterFile && (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{afterRows.length} registros válidos</span>
                      {afterInvalid > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {afterInvalid} inválidos
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
                  Comparar Lotes
                </Button>
              </div>
            </CardContent>
          </Card>

          {stats && (
            <Card>
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
                <CardDescription>
                  Visão geral das diferenças entre os dois lotes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">pares: {stats.matched}</Badge>
                  <Badge variant="outline" className={STATUS_STYLES.improved}>
                    T1 melhorou: {stats.elapsed1Improved}
                  </Badge>
                  <Badge variant="outline" className={STATUS_STYLES.regressed}>
                    T1 piorou: {stats.elapsed1Regressed}
                  </Badge>
                  <Badge variant="outline" className={STATUS_STYLES.improved}>
                    T2 melhorou: {stats.elapsed2Improved}
                  </Badge>
                  <Badge variant="outline" className={STATUS_STYLES.regressed}>
                    T2 piorou: {stats.elapsed2Regressed}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getDeltaBadgeStyle(stats.elapsed1AvgDelta, 2)}
                  >
                    Média ΔT1: {formatDelta(stats.elapsed1AvgDelta, 2)} ms
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getDeltaBadgeStyle(stats.elapsed2AvgDelta, 2)}
                  >
                    Média ΔT2: {formatDelta(stats.elapsed2AvgDelta, 2)} ms
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {comparisonResults.length > 0 && (
            <Card>
              <CardHeader>
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                  <div className="min-w-0">
                    <CardTitle>Resultados da Comparação</CardTitle>
                    <CardDescription>
                      Comparação detalhada por modelo e documento.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={downloadOfficialReport}
                    size="sm"
                    disabled={isGeneratingReport}
                    className="justify-self-center"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {isGeneratingReport
                      ? "Gerando Report..."
                      : "Baixar Report Oficial (PDF)"}
                  </Button>
                  <Button
                    onClick={downloadComparison}
                    variant="outline"
                    size="sm"
                    className="justify-self-end"
                  >
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
                        <th className="px-4 py-3 text-left font-medium">
                          Modelo
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Documento
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Resultado 1 igual
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Resultado 2 igual
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
                        <th className="px-4 py-3 text-center font-medium">
                          Δ T1
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Δ T2
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResults.map((result) => {
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
                            <td className="px-4 py-3 text-center">
                              {result.result1Equal === null ? (
                                "-"
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={
                                    result.result1Equal
                                      ? STATUS_STYLES.improved
                                      : STATUS_STYLES.regressed
                                  }
                                >
                                  {result.result1Equal
                                    ? "Iguais"
                                    : "Diferentes"}
                                </Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {result.result2Equal === null ? (
                                "-"
                              ) : (
                                <Badge
                                  variant="outline"
                                  className={
                                    result.result2Equal
                                      ? STATUS_STYLES.improved
                                      : STATUS_STYLES.regressed
                                  }
                                >
                                  {result.result2Equal
                                    ? "Iguais"
                                    : "Diferentes"}
                                </Badge>
                              )}
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
