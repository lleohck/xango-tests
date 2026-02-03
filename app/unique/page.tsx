"use client";
import { useState } from "react";
import {
  UniqueTestForm,
  type UniqueTestFormData,
} from "@/components/unique/form";

import AppHeader from "@/components/shared/app-header";
import EnvironmentConfigForm, {
  EnvironmentConfig,
  environments,
} from "@/components/shared/environment-config-form";
import UniqueResultCard from "@/components/unique/result-card";
import { ApiType, Environment } from "@/types/shared";

type LastQuery = UniqueTestFormData & {
  environment: Environment;
  apiType: ApiType;
  currentEnvironment: EnvironmentConfig;
};

export default function UniqueTest() {
  const [environment, setEnvironment] = useState<Environment>("DEV");
  const [currentEnvironment, setCurrentEnvironment] =
    useState<EnvironmentConfig>(environments[0]);
  const [apiType, setApiType] = useState<ApiType>("bi-data");
  const [apiResponse, setApiResponse] = useState<unknown>(null);
  const [lastQuery, setLastQuery] = useState<LastQuery | null>(null);

  const handleApiTest = async (formData: UniqueTestFormData) => {
    const biDataParams = formData.forms["bi-data"];
    setLastQuery({ ...formData, environment, apiType, currentEnvironment });
    setApiResponse(null);

    const payload = {
      modelo: formData.modelo,
      ndoc: formData.ndoc,
      ...(apiType === "bi-data" && biDataParams
        ? {
            explainer: biDataParams.explainer,
            version: biDataParams.version,
            is_canary: biDataParams.is_canary,
          }
        : {}),
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

      const text = await res.text();
      let data: unknown = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }

      if (!res.ok) {
        const message =
          (data && typeof data === "object" && "error" in data && data.error) ||
          (typeof data === "string" ? data : null) ||
          `Falha ao consultar API (${res.status}).`;
        throw new Error(String(message));
      }

      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: err?.message ?? "Erro ao consultar API" });
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
              Consulta Unica de Modelos
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

            <UniqueResultCard lastQuery={lastQuery} apiResponse={apiResponse} />
          </div>
        </div>
      </div>
    </div>
  );
}
