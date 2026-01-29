"use client";
import { useEffect, useRef, useState } from "react";
import { ApiTestForm, type ApiTestFormData } from "@/components/ApiTestForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/shared/app-header";
import { toast } from "sonner";
import { useIamToken, type Environment } from "@/hooks/useIamToken";

type ApiType = "ci-data" | "bi-data";
type LastQuery = ApiTestFormData & {
  environment: Environment;
  apiType: ApiType;
};

const API_URLS: Record<ApiType, Record<Environment, string | undefined>> = {
  "ci-data": {
    DEV:
      process.env.NEXT_PUBLIC_API_CI_DATA_DEV_URL ??
      process.env.API_CI_DATA_DEV_URL,
    UAT:
      process.env.NEXT_PUBLIC_API_CI_DATA_UAT_URL ??
      process.env.API_CI_DATA_UAT_URL,
    PRD:
      process.env.NEXT_PUBLIC_API_CI_DATA_PRD_URL ??
      process.env.API_CI_DATA_PRD_URL,
  },
  "bi-data": {
    DEV:
      process.env.NEXT_PUBLIC_API_BI_DATA_DEV_URL ??
      process.env.API_BI_DATA_DEV_URL,
    UAT:
      process.env.NEXT_PUBLIC_API_BI_DATA_UAT_URL ??
      process.env.API_BI_DATA_UAT_URL,
    PRD:
      process.env.NEXT_PUBLIC_API_BI_DATA_PRD_URL ??
      process.env.API_BI_DATA_PRD_URL,
  },
};

const getApiUrl = (apiType: ApiType, environment: Environment) =>
  API_URLS[apiType]?.[environment];

const environments: Array<{
  value: Environment;
  label: string;
  description: string;
  dotClass: string;
}> = [
  {
    value: "DEV",
    label: "DEV",
    description: "Development",
    dotClass: "bg-sky-500",
  },
  {
    value: "UAT",
    label: "UAT",
    description: "User Acceptance Testing",
    dotClass: "bg-amber-500",
  },
  {
    value: "PRD",
    label: "PRD",
    description: "Production",
    dotClass: "bg-rose-500",
  },
];

const apiOptions: Array<{ value: ApiType; label: string }> = [
  { value: "ci-data", label: "ci-data" },
  { value: "bi-data", label: "bi-data" },
];

export default function UniqueTest() {
  const [environment, setEnvironment] = useState<Environment>("DEV");
  const [apiType, setApiType] = useState<ApiType>("ci-data");
  const [apiResponse, setApiResponse] = useState<unknown>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<LastQuery | null>(null);
  const apiAbortRef = useRef<AbortController | null>(null);

  const { accessToken, error: iamError, refresh } = useIamToken(environment);

  useEffect(() => () => apiAbortRef.current?.abort(), []);

  const handleApiTest = async (formData: ApiTestFormData) => {
    setLastQuery({ ...formData, environment, apiType });
    setApiLoading(true);
    setApiError(null);
    setApiResponse(null);

    apiAbortRef.current?.abort();
    const ac = new AbortController();
    apiAbortRef.current = ac;
    const isCurrentRequest = () => apiAbortRef.current === ac;

    const apiUrl = getApiUrl(apiType, environment);
    if (!apiUrl) {
      const message = `URL da API não configurada para ${apiType}/${environment}.`;
      if (isCurrentRequest()) {
        setApiError(message);
        setApiResponse({ error: message });
        setApiLoading(false);
      }
      toast.error("Configuração ausente", { description: message });
      return;
    }

    const token = accessToken ?? (await refresh());
    if (!token) {
      const message = iamError ?? "Token IAM indisponível.";
      if (isCurrentRequest()) {
        setApiError(message);
        setApiResponse({ error: message });
        setApiLoading(false);
      }
      toast.error("Erro de autenticação", { description: message });
      return;
    }

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
        signal: ac.signal,
        cache: "no-store",
      });

      const text = await res.text();
      let payload: unknown = text;
      if (text) {
        try {
          payload = JSON.parse(text);
        } catch {
          payload = text;
        }
      }

      if (!res.ok) {
        const message =
          (payload as { error?: string })?.error ??
          text ??
          `Falha na API (${res.status})`;
        throw new Error(message);
      }

      if (isCurrentRequest()) {
        setApiResponse(payload ?? { ok: true });
        toast.success("Consultado com Sucesso!", {
          description: `${formData.modelo} | ${formData.ndoc}`,
        });
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      const message = err?.message ?? "Erro ao consultar API";
      if (isCurrentRequest()) {
        setApiError(message);
        setApiResponse({ error: message });
        toast.error("Erro na consulta", { description: message });
      }
    } finally {
      if (isCurrentRequest()) setApiLoading(false);
    }
  };

  const currentEnvironment =
    environments.find((item) => item.value === environment) ?? environments[0];

  return (
    <div>
      <AppHeader
        appName="Xango API Testing"
        logoSrc="/serasa-logo.svg"
        menus={[
          { label: "Consulta Unica", href: "/unique" },
          { label: "Processamento em Lote", href: "/batch" },
        ]}
      />

      <div className="min-h-[calc(100svh-5rem)] bg-background px-6 py-5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Consulta Unica de Modelos
            </h1>
            <p className="text-muted-foreground">
              Teste e valide os retornos das APIs em diferentes ambientes
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuração de Ambiente</CardTitle>
                  <CardDescription>
                    Selecione o ambiente e a API que deseja testar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="environment">Ambiente</Label>
                      <Select
                        value={environment}
                        onValueChange={(value) =>
                          setEnvironment(value as Environment)
                        }
                      >
                        <SelectTrigger id="environment" className="w-full">
                          <SelectValue placeholder="Selecione um ambiente" />
                        </SelectTrigger>
                        <SelectContent>
                          {environments.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`h-2 w-2 rounded-full ${item.dotClass}`}
                                />
                                <span className="font-medium">
                                  {item.label}
                                </span>
                                <span className="text-muted-foreground">
                                  - {item.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="api">API</Label>
                      <Select
                        value={apiType}
                        onValueChange={(value) => setApiType(value as ApiType)}
                      >
                        <SelectTrigger id="api" className="w-full">
                          <SelectValue placeholder="Selecione a API" />
                        </SelectTrigger>
                        <SelectContent>
                          {apiOptions.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Conectado em:
                    </span>
                    <Badge variant="outline" className="gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${currentEnvironment.dotClass}`}
                      />
                      {currentEnvironment.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">•</span>
                    <Badge variant="outline">{apiType}</Badge>
                  </div>
                </CardContent>
              </Card>

              <ApiTestForm onSubmit={handleApiTest} />
            </div>

            <Card className="flex h-full flex-col">
              <CardHeader>
                <CardTitle>Resultado da Consulta</CardTitle>
                <CardDescription>
                  Resposta JSON retornada pela API
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div className="space-y-2">
                  {lastQuery && (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${currentEnvironment.dotClass}`}
                        />
                        {currentEnvironment.label}
                      </Badge>
                      <Badge variant="outline">{lastQuery.apiType}</Badge>
                      <Badge variant="outline">{lastQuery.modelo}</Badge>
                      <Badge variant="outline">{lastQuery.ndoc}</Badge>
                      <Badge
                        variant="outline"
                        className={
                          lastQuery.explainer
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        }
                      >
                        explainer
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          lastQuery.is_canary
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                        }
                      >
                        canary
                      </Badge>
                      <Badge variant="outline" className="bg-muted/30">
                        {lastQuery.version}
                      </Badge>
                    </div>
                  )}
                </div>

                {apiLoading ? (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
                    <div className="mb-3 h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Consultando API...
                    </p>
                  </div>
                ) : apiResponse ? (
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex-1 overflow-auto rounded-lg border border-border/70 bg-muted/40 p-4">
                      <pre className="text-xs font-mono leading-relaxed text-foreground">
                        {JSON.stringify(apiResponse, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
                    <div className="mb-4 rounded-full bg-muted p-3">
                      <svg
                        className="h-6 w-6 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {apiError
                        ? "Falha na consulta. Verifique o erro e tente novamente."
                        : "Nenhuma consulta realizada ainda"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Preencha o formulário e clique em "Executar Teste" para
                      ver o resultado
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
