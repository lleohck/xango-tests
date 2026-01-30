"use client";
import { useState } from "react";
import { ApiTestForm, type ApiTestFormData } from "@/components/ApiTestForm";

import AppHeader from "@/components/shared/app-header";
import EnvironmentConfigForm, {
  EnvironmentConfig,
  environments,
} from "@/components/shared/environment-config-form";
import UniqueResultCard from "@/components/unique/result-card";
import { ApiType, Environment } from "@/types/shared";

type LastQuery = ApiTestFormData & {
  environment: Environment;
  apiType: ApiType;
  currentEnvironment: EnvironmentConfig;
};

export default function UniqueTest() {
  const [environment, setEnvironment] = useState<Environment>("DEV");
  const [currentEnvironment, setCurrentEnvironment] =
    useState<EnvironmentConfig>(environments[0]);
  const [apiType, setApiType] = useState<ApiType>("ci-data");
  const [apiResponse, setApiResponse] = useState<unknown>(null);
  const [lastQuery, setLastQuery] = useState<LastQuery | null>(null);

  const handleApiTest = (formData: ApiTestFormData) => {
    setLastQuery({ ...formData, environment, apiType, currentEnvironment });
    // Mock API response
    const mockResponse = {
      status: "success",
      timestamp: new Date().toISOString(),
      environment: environment,
      api: apiType,
      data: {
        modelo: formData.modelo,
        ndoc: formData.ndoc,
        explainer: formData.explainer,
        version: formData.version,
        is_canary: formData.is_canary,
        result: {
          score: Math.random().toFixed(4),
          prediction: Math.random() > 0.5 ? "approved" : "rejected",
          confidence: (Math.random() * 100).toFixed(2) + "%",
          processing_time_ms: Math.floor(Math.random() * 1000),
          model_version: formData.version,
        },
      },
    };

    setApiResponse(mockResponse);
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
              <EnvironmentConfigForm
                environment={environment}
                setEnvironment={setEnvironment}
                apiType={apiType}
                setApiType={setApiType}
                currentEnvironment={currentEnvironment}
                setCurrentEnvironment={setCurrentEnvironment}
              />
              <ApiTestForm onSubmit={handleApiTest} />
            </div>

            <UniqueResultCard lastQuery={lastQuery} apiResponse={apiResponse} />
          </div>
        </div>
      </div>
    </div>
  );
}
