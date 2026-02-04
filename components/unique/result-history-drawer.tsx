"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy, FileJson, Terminal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import JsonViewer from "@/components/shared/json-viewer";

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

type RequestDebug = {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: unknown | null;
};

type Props = {
  history: ApiResultShape[];
  currentTimestamp?: string | null;
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

function isRequestDebug(v: any): v is RequestDebug {
  return (
    v &&
    typeof v === "object" &&
    typeof v.url === "string" &&
    typeof v.method === "string"
  );
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
      parts.push(`-H ${shellQuote(`Authorization: Bearer <TOKEN>`)}`);
      continue;
    }

    parts.push(`-H ${shellQuote(`${k}: ${String(v)}`)}`);
  }

  const hasBody =
    req.body !== undefined &&
    req.body !== null &&
    method !== "GET" &&
    method !== "HEAD";

  if (hasBody) {
    const bodyStr =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    parts.push(`--data-raw ${shellQuote(bodyStr)}`);
  }

  return parts.join(" \\\n  ");
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

export default function ResultHistoryDrawer({
  history,
  currentTimestamp,
  onClearHistory,
}: Props) {
  const [copied, setCopied] = useState<
    "consulta" | "curl" | "resultado" | null
  >(null);

  const copyToClipboard = async (
    text: string,
    kind: "consulta" | "curl" | "resultado",
  ) => {
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

  const filteredHistory = useMemo(() => {
    if (!currentTimestamp) return history;
    return history.filter(
      (h: any) => getMeta(h)?.timestamp !== currentTimestamp,
    );
  }, [history, currentTimestamp]);

  const buttonLabel =
    copied === "curl"
      ? "cURL copiado!"
      : copied === "consulta"
        ? "Consulta copiada!"
        : copied === "resultado"
          ? "Resultado copiado!"
          : "Copiar";

  const ButtonIcon = copied ? Check : Copy;

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-3">
          Histórico
        </Button>
      </DrawerTrigger>

      <DrawerContent className="h-[100svh] w-[min(720px,100vw)]">
        <DrawerHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <DrawerTitle>Histórico</DrawerTitle>
            <DrawerDescription>Consultas anteriores</DrawerDescription>
          </div>

          <div>
            <div className="flex items-center gap-2">
              {onClearHistory ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={onClearHistory}
                >
                  limpar
                </Button>
              ) : null}
            </div>
            
          </div>
        </DrawerHeader>

        <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6">
          {filteredHistory.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Sem histórico ainda
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                As consultas anteriores aparecerão aqui
              </p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredHistory.map((h: any, idx: number) => {
                const hm = getMeta(h);
                const hp = getPrintablePayload(h);
                const req = isRequestDebug(hm?.request)
                  ? (hm!.request as RequestDebug)
                  : null;

                return (
                  <AccordionItem key={idx} value={`item-${idx}`}>
                    <AccordionTrigger className="text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        {hm ? <StatusBadge meta={hm} /> : null}
                        {hm?.elapsedMs !== undefined ? (
                          <Badge variant="outline">{hm.elapsedMs}ms</Badge>
                        ) : null}
                        {hm?.method ? (
                          <Badge variant="outline">{hm.method}</Badge>
                        ) : null}
                        {hm?.timestamp ? (
                          <span className="text-xs text-muted-foreground">
                            {new Date(hm.timestamp).toLocaleString("pt-BR")}
                          </span>
                        ) : null}
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        {hm?.url ? (
                          <Badge
                            variant="outline"
                            className="max-w-full truncate"
                          >
                            {hm.url}
                          </Badge>
                        ) : (
                          <span />
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-2 px-2"
                              disabled={!req && hp == null}
                            >
                              <ButtonIcon className="h-4 w-4" />
                              <span className="hidden sm:inline">
                                {buttonLabel}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-70" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                              onClick={() =>
                                req &&
                                copyToClipboard(
                                  JSON.stringify(req, null, 2),
                                  "consulta",
                                )
                              }
                              disabled={!req}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar consulta
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                req && copyToClipboard(toCurl(req), "curl")
                              }
                              disabled={!req}
                            >
                              <Terminal className="mr-2 h-4 w-4" />
                              Copiar cURL
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() =>
                                hp != null &&
                                copyToClipboard(
                                  JSON.stringify(hp, null, 2),
                                  "resultado",
                                )
                              }
                              disabled={hp == null}
                            >
                              <FileJson className="mr-2 h-4 w-4" />
                              Copiar resultado
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <JsonViewer
                        value={hp}
                        defaultOpenDepth={2}
                        className="max-h-[420px]"
                      />
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
