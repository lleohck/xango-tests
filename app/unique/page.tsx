"use client";

import { useState } from "react";
import AppHeader from "@/components/shared/app-header";

import EnvironmentConfigForm, {
  EnvironmentConfig,
  environments,
} from "@/components/shared/environment-config-form";

import {
  UniqueTestForm,
  type UniqueTestFormData,
} from "@/components/unique/form";

import UniqueResultCard from "@/components/unique/result-card";
import type { ApiType, Environment } from "@/types/shared";

type LastQuery = UniqueTestFormData & {
  environment: Environment;
  apiType: ApiType;
  currentEnvironment: EnvironmentConfig;
};

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

export default function UniqueTest() {
  const [environment, setEnvironment] = useState<Environment>("DEV");
  const [currentEnvironment, setCurrentEnvironment] =
    useState<EnvironmentConfig>(environments[0]);

  // ⚠️ Garanta que seu EnvironmentConfigForm suporte as 4 APIs (bi-data, ci-data, bi-orchestrator, ci-orchestrator)
  const [apiType, setApiType] = useState<ApiType>("bi-data");

  const [lastQuery, setLastQuery] = useState<LastQuery | null>(null);

  // Último resultado enriquecido (meta + data/error)
  const [apiResult, setApiResult] = useState<ApiResultShape>(null);

  // Histórico (últimos N)
  const [history, setHistory] = useState<ApiResultShape[]>([]);

  const handleApiTest = async (formData: UniqueTestFormData) => {
    setLastQuery({ ...formData, environment, apiType, currentEnvironment });
    setApiResult(null);

    // pega os parâmetros do form específico da API
    const apiParams = formData.forms[apiType];

    const payload = {
      modelo: formData.modelo,
      ndoc: formData.ndoc,
      ...(apiParams ?? {}),
    };

    try {
      const res = await fetch("/api/unique", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          environment,
          apiType,
          payload,
        }),
        cache: "no-store",
      });

      const json = await res.json();

      setApiResult(json);
      setHistory((prev) => [json, ...prev].slice(0, 30));
    } catch (err: any) {
      const fallback = {
        meta: {
          ok: false,
          status: null,
          elapsedMs: 0,
          timestamp: new Date().toISOString(),
        },
        error: { message: err?.message ?? "Erro ao consultar API" },
      };

      setApiResult(fallback);
      setHistory((prev) => [fallback, ...prev].slice(0, 30));
    }
  };

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

      <div className="bg-background px-6 py-5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Consulta Única de Modelos
            </h1>
            <p className="text-muted-foreground">
              Teste e valide os retornos das APIs em diferentes ambientes
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <EnvironmentConfigForm
                environment={environment}
                setEnvironment={setEnvironment}
                apiType={apiType}
                setApiType={setApiType}
                currentEnvironment={currentEnvironment}
                setCurrentEnvironment={setCurrentEnvironment}
              />

              <UniqueTestForm apiName={apiType} onSubmit={handleApiTest} />
            </div>

            <UniqueResultCard
              lastQuery={lastQuery}
              apiResult={apiResult}
              history={history}
              onClearHistory={() => setHistory([])}
            />
          </div>
        </div>
      </div>
    </div>
  );
}