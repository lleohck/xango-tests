"use client";

import { useState } from "react";
import {
  FileSearchCorner,
  Copy,
  Check,
  ChevronDown,
  Terminal,
  FileJson,
  Loader2,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import JsonViewer from "@/components/shared/json-viewer";

import { EnvironmentConfig } from "@/components/shared/environment-config-form";
import type { ApiType, Environment } from "@/types/shared";
import type { UniqueTestFormData } from "./form";

type LastQuery =
  | (UniqueTestFormData & {
      environment: Environment;
      apiType: ApiType;
      currentEnvironment: EnvironmentConfig;
    })
  | null;

type ApiResultShape =
  | {
      meta?: {
        ok: boolean;
        status: number | null;
        elapsedMs: number;
        method?: string;
        url?: string;
        timestamp?: string;
        request?: unknown;
      };
      data?: unknown;
      error?: unknown;
    }
  | unknown;

type UniqueResultCardProps = {
  lastQuery: LastQuery;
  apiResult: ApiResultShape;
  history: ApiResultShape[];
  isLoading: boolean;
  onClearHistory?: () => void;
};

function getMeta(result: any) {
  return result?.meta ?? null;
}

function getPrintablePayload(result: any) {
  if (!result) return null;
  if (result?.data !== undefined) return result.data;
  if (result?.error !== undefined) return result.error;
  return result;
}

function StatusBadge({ meta }: { meta: any }) {
  const status = meta?.status;
  const ok = meta?.ok;

  const className =
    status === null
      ? "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
      : ok
        ? "border-[color:var(--color-feedback-success)]/30 bg-[color:var(--color-feedback-success)]/10 text-[color:var(--color-feedback-success)]"
        : "border-[color:var(--color-feedback-error)]/30 bg-[color:var(--color-feedback-error)]/10 text-[color:var(--color-feedback-error)]";

  return (
    <Badge variant="outline" className={className}>
      status: {status ?? "NO HTTP"}
    </Badge>
  );
}

type RequestDebug = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown | null;
};

function isRequestDebug(v: any): v is RequestDebug {
  return v && typeof v === "object" && typeof v.url === "string" && typeof v.method === "string";
}

function shellQuote(value: string) {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

function toCurl(req: RequestDebug) {
  const method = (req.method || "GET").toUpperCase();
  const url = req.url;

  const parts: string[] = [];
  parts.push("curl -k");
  parts.push(`-X ${method}`);
  parts.push(shellQuote(url));

  const headers = req.headers ?? {};
  for (const [k, v] of Object.entries(headers)) {
    if (v === undefined || v === null) continue;

    if (k.toLowerCase() === "authorization") {
      parts.push(`-H ${shellQuote(`Authorization: Bearer <TOKEN>`)}`
      );
      continue;
    }

    parts.push(`-H ${shellQuote(`${k}: ${String(v)}`)}`);
  }

  const hasBody = req.body !== undefined && req.body !== null && method !== "GET" && method !== "HEAD";
  if (hasBody) {
    const bodyStr = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    parts.push(`--data-raw ${shellQuote(bodyStr)}`);
  }

  return parts.join(" \\\n  ");
}

export default function UniqueResultCard({
  lastQuery,
  apiResult,
  history,
  isLoading,
  onClearHistory,
}: UniqueResultCardProps) {
  const meta = getMeta(apiResult);
  const printable = getPrintablePayload(apiResult);

  const [copied, setCopied] = useState<"consulta" | "curl" | "resultado" | null>(null);

  const copyToClipboard = async (text: string, kind: "consulta" | "curl" | "resultado") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1200);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);

        setCopied(kind);
        window.setTimeout(() => setCopied(null), 1200);
      } catch {
        setCopied(null);
      }
    }
  };

  const request = isRequestDebug(meta?.request) ? (meta!.request as RequestDebug) : null;

  const handleCopyConsulta = () => {
    if (!request) return;
    copyToClipboard(JSON.stringify(request, null, 2), "consulta");
  };

  const handleCopyCurl = () => {
    if (!request) return;
    copyToClipboard(toCurl(request), "curl");
  };

  const handleCopyResultado = () => {
    if (printable == null) return;
    copyToClipboard(JSON.stringify(printable, null, 2), "resultado");
  };

  const buttonLabel =
    copied === "curl"
      ? "cURL copiado!"
      : copied === "consulta"
        ? "Consulta copiada!"
        : copied === "resultado"
          ? "Resultado copiado!"
          : "Copiar";

  const ButtonIcon = copied ? Check : Copy;
  const copyDisabled = isLoading || (!request && printable == null);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Resultado da Consulta</CardTitle>
          <CardDescription>Resposta JSON retornada pela API</CardDescription>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-2 px-2"
              disabled={copyDisabled}
              title="Copiar"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ButtonIcon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isLoading ? "Carregando..." : buttonLabel}
              </span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={handleCopyConsulta} disabled={!request || isLoading}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar consulta
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleCopyCurl} disabled={!request || isLoading}>
              <Terminal className="mr-2 h-4 w-4" />
              Copiar cURL
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleCopyResultado} disabled={printable == null || isLoading}>
              <FileJson className="mr-2 h-4 w-4" />
              Copiar resultado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          {lastQuery && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-2">
                <div className={`h-2 w-2 rounded-full ${lastQuery.currentEnvironment.dotClass}`} />
                {lastQuery.currentEnvironment.label}
              </Badge>

              <Badge variant="outline">{lastQuery.apiType}</Badge>
              <Badge variant="outline">{lastQuery.modelo}</Badge>
              <Badge variant="outline">{lastQuery.ndoc}</Badge>

              {lastQuery.apiType === "bi-data" && lastQuery.forms["bi-data"] && (
                <>
                  <Badge
                    variant="outline"
                    className={
                      lastQuery.forms["bi-data"].explainer
                        ? "border-[color:var(--color-feedback-success)]/30 bg-[color:var(--color-feedback-success)]/10 text-[color:var(--color-feedback-success)]"
                        : "border-[color:var(--color-feedback-error)]/30 bg-[color:var(--color-feedback-error)]/10 text-[color:var(--color-feedback-error)]"
                    }
                  >
                    explainer
                  </Badge>

                  <Badge
                    variant="outline"
                    className={
                      lastQuery.forms["bi-data"].is_canary
                        ? "border-[color:var(--color-feedback-success)]/30 bg-[color:var(--color-feedback-success)]/10 text-[color:var(--color-feedback-success)]"
                        : "border-muted-foreground/30 bg-muted/40 text-muted-foreground"
                    }
                  >
                    canary
                  </Badge>

                  <Badge variant="outline" className="bg-muted/30">
                    {lastQuery.forms["bi-data"].version}
                  </Badge>
                </>
              )}
            </div>
          )}

          {meta && (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge meta={meta} />
              <Badge variant="outline">{meta.elapsedMs}ms</Badge>
              {meta.method && <Badge variant="outline">{meta.method}</Badge>}
              {meta.url && (
                <Badge variant="outline" className="max-w-full truncate">
                  {meta.url}
                </Badge>
              )}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
            <Loader2 className="mb-3 h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando resultado...</p>
          </div>
        ) : apiResult ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <JsonViewer value={printable} defaultOpenDepth={2} />

            {history?.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Histórico (últimos {history.length})
                  </p>
                  {onClearHistory && (
                    <button
                      onClick={onClearHistory}
                      className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                      type="button"
                    >
                      limpar
                    </button>
                  )}
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {history.map((h: any, idx: number) => {
                    const hm = getMeta(h);
                    const hp = getPrintablePayload(h);

                    return (
                      <AccordionItem key={idx} value={`item-${idx}`}>
                        <AccordionTrigger className="text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            {hm ? <StatusBadge meta={hm} /> : null}
                            {hm?.elapsedMs !== undefined && (
                              <Badge variant="outline">{hm.elapsedMs}ms</Badge>
                            )}
                            {hm?.method && <Badge variant="outline">{hm.method}</Badge>}
                            {hm?.timestamp ? (
                              <span className="text-xs text-muted-foreground">
                                {new Date(hm.timestamp).toLocaleString("pt-BR")}
                              </span>
                            ) : null}
                          </div>
                        </AccordionTrigger>

                        <AccordionContent className="space-y-3">
                          {hm?.url && (
                            <div className="rounded-lg border border-border/70 bg-muted/30 p-3">
                              <div className="text-xs text-muted-foreground">URL</div>
                              <div className="mt-1 break-all font-mono text-xs text-foreground">
                                {hm.url}
                              </div>
                            </div>
                          )}

                          <JsonViewer value={hp} defaultOpenDepth={2} className="max-h-[360px]" />
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <FileSearchCorner />
            </div>
            <p className="text-sm text-muted-foreground">Nenhuma consulta realizada ainda</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Preencha o formulário e clique em &quot;Executar Teste&quot; para ver o resultado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}