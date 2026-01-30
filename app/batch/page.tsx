"use client";
import { useState } from "react";
import { ApiTestForm, type ApiTestFormData } from "@/components/unique/form";

import AppHeader from "@/components/shared/app-header";
import EnvironmentConfigForm, {
  EnvironmentConfig,
  environments,
} from "@/components/shared/environment-config-form";
import UniqueResultCard from "@/components/unique/result-card";
import { ApiType, Environment } from "@/types/shared";
import { Card } from "@/components/ui/card";
import BiDataParamsForm from "@/components/shared/apis/bi-data-params-form";

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

          <div className="flex flex-row gap-4">
            <div className="max-w-1/2">
              <EnvironmentConfigForm
                environment={environment}
                setEnvironment={setEnvironment}
                apiType={apiType}
                setApiType={setApiType}
                currentEnvironment={currentEnvironment}
                setCurrentEnvironment={setCurrentEnvironment}
              />
            </div>
            <div className="max-w-1/2">
              <BiDataParamsForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
