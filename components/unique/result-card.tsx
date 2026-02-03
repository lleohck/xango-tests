import { FileSearchCorner } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

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
      ? "border-slate-500/40 bg-slate-500/15 text-slate-700 dark:text-slate-300"
      : ok
        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
        : "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300";

  return (
    <Badge variant="outline" className={className}>
      status: {status ?? "NO HTTP"}
    </Badge>
  );
}

export default function UniqueResultCard({
  lastQuery,
  apiResult,
  history,
  onClearHistory,
}: UniqueResultCardProps) {
  const meta = getMeta(apiResult);
  const printable = getPrintablePayload(apiResult);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Resultado da Consulta</CardTitle>
        <CardDescription>Resposta JSON retornada pela API</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Contexto da última query */}
        <div className="space-y-2">
          {lastQuery && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${lastQuery.currentEnvironment.dotClass}`}
                />
                {lastQuery.currentEnvironment.label}
              </Badge>

              <Badge variant="outline">{lastQuery.apiType}</Badge>
              <Badge variant="outline">{lastQuery.modelo}</Badge>
              <Badge variant="outline">{lastQuery.ndoc}</Badge>

              {/* Extras por API (opcional, simples) */}
              {lastQuery.apiType === "bi-data" && lastQuery.forms["bi-data"] && (
                <>
                  <Badge
                    variant="outline"
                    className={
                      lastQuery.forms["bi-data"].explainer
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                    }
                  >
                    explainer
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      lastQuery.forms["bi-data"].is_canary
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "border-slate-500/40 bg-slate-500/15 text-slate-700 dark:text-slate-300"
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

          {/* Meta: status + elapsed + method */}
          {meta && (
            <div className="flex flex-wrap gap-2">
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

        {/* Resultado JSON */}
        {apiResult ? (
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <div className="flex-1 overflow-auto rounded-lg border border-border/70 bg-muted/40 p-4">
              <pre className="text-xs font-mono leading-relaxed text-foreground">
                {JSON.stringify(printable, null, 2)}
              </pre>
            </div>

            {/* Histórico */}
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
                    const title = hm
                      ? `${hm.status ?? "NO HTTP"} • ${hm.elapsedMs ?? 0}ms • ${hm.method ?? "-"}`
                      : `item ${idx + 1}`;

                    return (
                      <AccordionItem key={idx} value={`item-${idx}`}>
                        <AccordionTrigger className="text-left">
                          <div className="flex flex-wrap items-center gap-2">
                            {hm ? <StatusBadge meta={hm} /> : null}
                            {hm?.elapsedMs !== undefined && (
                              <Badge variant="outline">{hm.elapsedMs}ms</Badge>
                            )}
                            {hm?.method && <Badge variant="outline">{hm.method}</Badge>}
                            <span className="text-xs text-muted-foreground">{title}</span>
                          </div>
                        </AccordionTrigger>

                        <AccordionContent>
                          {hm?.url && (
                            <div className="mb-3 rounded-md border border-border/70 bg-muted/30 p-3">
                              <div className="text-xs text-muted-foreground">URL</div>
                              <div className="mt-1 break-all text-xs font-mono">
                                {hm.url}
                              </div>
                            </div>
                          )}

                          <div className="rounded-md border border-border/70 bg-muted/30 p-3">
                            <div className="text-xs text-muted-foreground">JSON</div>
                            <pre className="mt-2 text-xs font-mono leading-relaxed">
                              {JSON.stringify(hp, null, 2)}
                            </pre>
                          </div>
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
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta realizada ainda
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Preencha o formulário e clique em &quot;Executar Teste&quot; para ver o resultado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}