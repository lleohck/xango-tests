"use client";
import { useState } from "react";
import { ApiTestForm, type ApiTestFormData } from "@/components/ApiTestForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import AppHeader from "@/components/shared/app-header";
import EnvironmentConfigForm, {
  EnvironmentConfig,
  environments,
} from "@/components/shared/environment-config-form";
import { FileSearchCorner } from "lucide-react";

type Environment = "DEV" | "UAT" | "PRD";
type ApiType = "ci-data" | "bi-data";
type LastQuery = ApiTestFormData & {
  environment: Environment;
  apiType: ApiType;
};

export default function UniqueTest() {
  const [environment, setEnvironment] = useState<Environment>("DEV");
  const [currentEnvironment, setCurrentEnvironment] =
    useState<EnvironmentConfig>(environments[0]);
  const [apiType, setApiType] = useState<ApiType>("ci-data");
  const [apiResponse, setApiResponse] = useState<unknown>(null);
  const [lastQuery, setLastQuery] = useState<LastQuery | null>(null);

  const handleApiTest = (formData: ApiTestFormData) => {
    setLastQuery({ ...formData, environment, apiType });
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

                {apiResponse ? (
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
                      <FileSearchCorner />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Nenhuma consulta realizada ainda
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Preencha o formulário e clique em &quot;Executar
                      Teste&quot; para ver o resultado
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
