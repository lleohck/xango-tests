"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import AppHeader from "@/components/shared/app-header";
import EnvironmentConfigForm, {
  EnvironmentConfig,
  environments,
} from "@/components/shared/environment-config-form";
import type { ApiType, Environment } from "@/types/shared";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import BiDataParamsForm, {
  BiDataParamsFormData,
} from "@/components/shared/apis/bi-data-params-form";
import CiDataParamsForm, {
  CiDataParamsFormData,
} from "@/components/shared/apis/ci-data-params-form";
import BiOrchestratorParamsForm, {
  BiOrchestratorParamsFormData,
} from "@/components/shared/apis/bi-orchestrator-params-form";
import CiOrchestratorParamsForm, {
  CiOrchestratorParamsFormData,
} from "@/components/shared/apis/ci-orchestrator-params-form";

import BatchConfigForm from "@/components/batch/batch-config-form";
import BatchResultsTable, {
  BatchRow,
} from "@/components/batch/batch-results-table";

type ApiFormDataMap = {
  "bi-data"?: BiDataParamsFormData;
  "ci-data"?: CiDataParamsFormData;
  "bi-orchestrator"?: BiOrchestratorParamsFormData;
  "ci-orchestrator"?: CiOrchestratorParamsFormData;
};

type BatchTestFormData = {
  forms: ApiFormDataMap;
};

const defaultParams = {
  "bi-data": {
    version: "v2",
    explainer: false,
    is_canary: false,
  } satisfies BiDataParamsFormData,
  "ci-data": {
    bifrost: false,
    is_canary: false,
  } satisfies CiDataParamsFormData,
  "bi-orchestrator": {
    explainer: false,
    is_canary: false,
  } satisfies BiOrchestratorParamsFormData,
  "ci-orchestrator": {
    user: "user-test",
    cgc: "62173620",
    transaction: "transaction",
    is_canary: false,
  } satisfies CiOrchestratorParamsFormData,
} as const;

type ApiPrefix = "CI" | "BI";

const BATCH_ENV = {
  CI: {
    DEV: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_CI_DEV,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_CI_DEV,
    },
    UAT: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_CI_UAT,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_CI_UAT,
    },
    PRD: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_CI_PRD,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_CI_PRD,
    },
  },
  BI: {
    DEV: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_BI_DEV,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_BI_DEV,
    },
    UAT: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_BI_UAT,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_BI_UAT,
    },
    PRD: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_BI_PRD,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_BI_PRD,
    },
  },
} as const;

function getApiPrefix(apiType: ApiType): ApiPrefix {
  return apiType.startsWith("ci") ? "CI" : "BI";
}

function normalizeJsonLikeArray(raw: string) {
  return raw.trim().replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
}

function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    const normalized = normalizeJsonLikeArray(trimmed);
    try {
      const arr = JSON.parse(normalized);
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
      const noBrackets = normalized.replace(/^\[/, "").replace(/]$/, "");
      return noBrackets
        .split(",")
        .map((s) =>
          s
            .trim()
            .replace(/^"(.*)"$/, "$1")
            .replace(/^'(.*)'$/, "$1"),
        )
        .filter(Boolean);
    }
  }

  return trimmed
    .split(/[\n,;]+/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function getMeta(result: any) {
  return result?.meta ?? null;
}

function getPrintablePayload(result: any) {
  if (!result) return null;
  if (result?.data !== undefined) return result.data;
  if (result?.error !== undefined) return result.error;
  return result;
}

function diffPaths(a: any, b: any, base = ""): string[] {
  if (a === b) return [];
  const aIsObj = a !== null && typeof a === "object";
  const bIsObj = b !== null && typeof b === "object";
  if (!aIsObj || !bIsObj) return [base || "$"];

  const aIsArr = Array.isArray(a);
  const bIsArr = Array.isArray(b);
  if (aIsArr !== bIsArr) return [base || "$"];

  if (aIsArr && bIsArr) {
    const max = Math.max(a.length, b.length);
    const out: string[] = [];
    for (let i = 0; i < max; i++) {
      const p = `${base || "$"}[${i}]`;
      out.push(...diffPaths(a[i], b[i], p));
    }
    return out;
  }

  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const out: string[] = [];
  for (const k of keys) {
    const p = base ? `${base}.${k}` : k;
    out.push(...diffPaths(a[k], b[k], p));
  }
  return out;
}

async function callUnique(
  environment: Environment,
  apiType: ApiType,
  payload: any,
  signal?: AbortSignal,
) {
  const res = await fetch("/api/unique", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ environment, apiType, payload }),
    cache: "no-store",
    signal,
  });

  const json = await res.json();
  return json;
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function promisePool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
  onResult: (r: R) => void,
  onProgress: (done: number) => void,
  isAborted: () => boolean,
) {
  let idx = 0;
  let done = 0;

  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (idx < items.length) {
        if (isAborted()) return;
        const current = items[idx++];
        const result = await worker(current);
        if (isAborted()) return;
        onResult(result);
        done++;
        onProgress(done);
      }
    },
  );

  await Promise.all(runners);
}

export default function BatchTest() {
  const [isOpen, setIsOpen] = useState(true);

  const [environment, setEnvironment] = useState<Environment>("DEV");
  const [currentEnvironment, setCurrentEnvironment] =
    useState<EnvironmentConfig>(environments[0]);

  const [apiType, setApiType] = useState<ApiType>("bi-data");

  const [formData, setFormData] = useState<BatchTestFormData>({
    forms: {
      "bi-data": defaultParams["bi-data"],
      "ci-data": defaultParams["ci-data"],
      "bi-orchestrator": defaultParams["bi-orchestrator"],
      "ci-orchestrator": defaultParams["ci-orchestrator"],
    },
  });

  const apiPrefix = useMemo(() => getApiPrefix(apiType), [apiType]);

  const rawDocs =
    (BATCH_ENV as any)[apiPrefix]?.[environment]?.documents ?? undefined;
  const rawModels =
    (BATCH_ENV as any)[apiPrefix]?.[environment]?.models ?? undefined;

  const documentsList = useMemo(() => parseList(rawDocs), [rawDocs]);
  const modelsList = useMemo(() => parseList(rawModels), [rawModels]);

  const maxDocuments = Math.max(1, Math.min(100, documentsList.length || 100));
  const maxModels = Math.max(1, Math.min(20, modelsList.length || 20));

  const [numDocuments, setNumDocuments] = useState([
    Math.min(10, maxDocuments),
  ]);
  const [numModels, setNumModels] = useState([Math.min(10, maxModels)]);

  useEffect(() => {
    setNumDocuments(([v]) => [Math.max(1, Math.min(v ?? 10, maxDocuments))]);
  }, [maxDocuments]);

  useEffect(() => {
    setNumModels(([v]) => [Math.max(1, Math.min(v ?? 10, maxModels))]);
  }, [maxModels]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [total, setTotal] = useState(0);

  const [rows, setRows] = useState<BatchRow[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const updateApiParams = <T extends object, K extends keyof T>(
    api: ApiType,
    field: K,
    value: T[K],
  ) => {
    setFormData((prev) => {
      const fallback = (defaultParams as any)[api] as T;
      const current = ((prev.forms as any)[api] ?? fallback) as T;

      return {
        ...prev,
        forms: {
          ...prev.forms,
          [api]: {
            ...current,
            [field]: value,
          },
        },
      };
    });
  };

  const currentParams =
    (formData.forms as any)[apiType] ?? (defaultParams as any)[apiType];

  const startBatch = async () => {
    if (isProcessing) return;

    const docsN = Math.max(1, Math.min(numDocuments[0] ?? 1, maxDocuments));
    const modelsN = Math.max(1, Math.min(numModels[0] ?? 1, maxModels));

    const docs = (
      documentsList.length
        ? documentsList
        : Array.from({ length: 100 }).map((_, i) =>
            String(i + 1).padStart(11, "0"),
          )
    ).slice(0, docsN);

    const models = (
      modelsList.length
        ? modelsList
        : Array.from({ length: 20 }).map((_, i) => `model-${i + 1}`)
    ).slice(0, modelsN);

    const combos = models.flatMap((model) =>
      docs.map((ndoc) => ({ model, ndoc })),
    );
    const comparisons = combos.length;

    setRows([]);
    setIsProcessing(true);
    setProgress(0);
    setProcessed(0);
    setTotal(comparisons);

    const controller = new AbortController();
    abortRef.current = controller;

    const acc: BatchRow[] = [];
    let flushTimer: any = null;

    const scheduleFlush = () => {
      if (flushTimer) return;
      flushTimer = setTimeout(() => {
        setRows([...acc]);
        flushTimer = null;
      }, 150);
    };

    const isAborted = () => controller.signal.aborted;

    try {
      await promisePool(
        combos,
        5,
        async ({ model, ndoc }) => {
          const payload = { modelo: model, ndoc, ...(currentParams ?? {}) };
          const exec1 = await callUnique(
            environment,
            apiType,
            payload,
            controller.signal,
          );
          const exec2 = await callUnique(
            environment,
            apiType,
            payload,
            controller.signal,
          );

          const meta1 = getMeta(exec1);
          const meta2 = getMeta(exec2);

          const p1 = getPrintablePayload(exec1);
          const p2 = getPrintablePayload(exec2);

          const ok1 = Boolean(meta1?.ok);
          const ok2 = Boolean(meta2?.ok);

          const diffs = diffPaths(p1, p2);

          const row: BatchRow = {
            id: makeId(),
            model,
            ndoc,
            ok1,
            ok2,
            status1: meta1?.status ?? null,
            status2: meta2?.status ?? null,
            elapsed1: Number(meta1?.elapsedMs ?? 0),
            elapsed2: Number(meta2?.elapsedMs ?? 0),
            diffCount: diffs.length,
            diffPaths: diffs.slice(0, 200),
            result1: p1,
            result2: p2,
          };

          return row;
        },
        (row) => {
          acc.push(row);
          scheduleFlush();
        },
        (done) => {
          setProcessed(done);
          setProgress((done / comparisons) * 100);
        },
        isAborted,
      );

      setRows([...acc]);
      setProgress(100);
      setIsOpen(false);
    } catch {
      setRows((prev) => [...prev]);
    } finally {
      if (flushTimer) clearTimeout(flushTimer);
      abortRef.current = null;
      setIsProcessing(false);
    }
  };

  const stopBatch = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsProcessing(false);
  };

  return (
    <div>
      <AppHeader
        appName="Xango API Testing"
        logoSrc="/serasa-logo.svg"
        menus={[
          { label: "Consulta Unica", href: "/unique" },
          { label: "Processamento em Lote", href: "/batch" },
          { label: "Comparação de Lotes", href: "/compare" },
        ]}
      />
      <div className="bg-background px-6 py-5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Processamento em Lote
            </h1>
            <p className="text-muted-foreground">
              Teste e valide os retornos das APIs em diferentes ambientes usando
              processamento em lote.
            </p>
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            <div className="h-full w-full">
              <EnvironmentConfigForm
                environment={environment}
                setEnvironment={setEnvironment}
                apiType={apiType}
                setApiType={setApiType}
                currentEnvironment={currentEnvironment}
                setCurrentEnvironment={setCurrentEnvironment}
                className="h-full"
              />
            </div>

            <div className="h-full w-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Parametrização da Chamada</CardTitle>
                  <CardDescription>
                    Ajuste os parâmetros específicos da API selecionada
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  {apiType === "bi-data" && (
                    <BiDataParamsForm
                      version="batch"
                      formData={currentParams as BiDataParamsFormData}
                      setFormData={(field, value) =>
                        updateApiParams<BiDataParamsFormData, any>(
                          "bi-data",
                          field,
                          value,
                        )
                      }
                    />
                  )}

                  {apiType === "ci-data" && (
                    <CiDataParamsForm
                      version="batch"
                      formData={currentParams as CiDataParamsFormData}
                      setFormData={(field, value) =>
                        updateApiParams<CiDataParamsFormData, any>(
                          "ci-data",
                          field,
                          value,
                        )
                      }
                    />
                  )}

                  {apiType === "bi-orchestrator" && (
                    <BiOrchestratorParamsForm
                      version="batch"
                      formData={currentParams as BiOrchestratorParamsFormData}
                      setFormData={(field, value) =>
                        updateApiParams<BiOrchestratorParamsFormData, any>(
                          "bi-orchestrator",
                          field,
                          value,
                        )
                      }
                    />
                  )}

                  {apiType === "ci-orchestrator" && (
                    <CiOrchestratorParamsForm
                      version="batch"
                      formData={currentParams as CiOrchestratorParamsFormData}
                      setFormData={(field, value) =>
                        updateApiParams<CiOrchestratorParamsFormData, any>(
                          "ci-orchestrator",
                          field,
                          value,
                        )
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
              <CardHeader
                onClick={() => setIsOpen(!isOpen)}
                className="flex flex-row items-center justify-between gap-3"
              >
                <div>
                  <CardTitle>Configuração do Lote</CardTitle>
                  {isOpen && (
                    <CardDescription className="mt-2">
                      Configure a quantidade de documentos e modelos para testar
                    </CardDescription>
                  )}
                </div>

                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    aria-label="Alternar detalhes"
                  >
                    <ChevronsUpDown />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>

              <CollapsibleContent>
                <CardContent>
                  <BatchConfigForm
                    numDocuments={numDocuments}
                    setNumDocuments={setNumDocuments}
                    numModels={numModels}
                    setNumModels={setNumModels}
                    maxDocuments={maxDocuments}
                    maxModels={maxModels}
                    isProcessing={isProcessing}
                    progress={progress}
                    processed={processed}
                    total={total}
                    onStart={startBatch}
                    onStop={stopBatch}
                  />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          <Card>
            <CardHeader>
              <CardTitle>Resultados da Comparação</CardTitle>
              <CardDescription>
                Comparação entre duas execuções consecutivas para cada
                combinação de modelo e documento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BatchResultsTable rows={rows} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
