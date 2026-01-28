"use client";
import { useState } from "react";
import { ApiTestForm } from "@/components/ApiTestForm";
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

type Environment = "DEV" | "UAT" | "PRD";
type ApiType = "ci-data" | "bi-data";

export default function App() {
  const [environment, setEnvironment] = useState<Environment>("DEV");
  const [apiType, setApiType] = useState<ApiType>("ci-data");
  const [apiResponse, setApiResponse] = useState<any>(null);

  const handleApiTest = (formData: any) => {
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
          features_used: 42,
          risk_factors: [
            { name: "credit_history", impact: 0.35 },
            { name: "income_ratio", impact: 0.28 },
            { name: "debt_level", impact: 0.22 },
          ],
        },
      },
    };

    setApiResponse(mockResponse);
  };

  const getEnvironmentColor = (env: Environment) => {
    switch (env) {
      case "DEV":
        return "bg-blue-500";
      case "UAT":
        return "bg-yellow-500";
      case "PRD":
        return "bg-red-500";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            API Testing Dashboard
          </h1>
          <p className="text-muted-foreground">
            Teste e valide os retornos das APIs em diferentes ambientes
          </p>
        </div>

        {/* Environment and API Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Configuração de Ambiente</CardTitle>
            <CardDescription>
              Selecione o ambiente e a API que deseja testar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="environment">Ambiente</Label>
                <Select
                  value={environment}
                  onValueChange={(value) =>
                    setEnvironment(value as Environment)
                  }
                >
                  <SelectTrigger id="environment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEV">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getEnvironmentColor("DEV")}`}
                        />
                        DEV - Development
                      </div>
                    </SelectItem>
                    <SelectItem value="UAT">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getEnvironmentColor("UAT")}`}
                        />
                        UAT - User Acceptance Testing
                      </div>
                    </SelectItem>
                    <SelectItem value="PRD">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getEnvironmentColor("PRD")}`}
                        />
                        PRD - Production
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api">API</Label>
                <Select
                  value={apiType}
                  onValueChange={(value) => setApiType(value as ApiType)}
                >
                  <SelectTrigger id="api">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ci-data">ci-data</SelectItem>
                    <SelectItem value="bi-data">bi-data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Conectado em:
              </span>
              <Badge variant="outline" className="gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${getEnvironmentColor(environment)}`}
                />
                {environment}
              </Badge>
              <span className="text-sm text-muted-foreground">•</span>
              <Badge variant="outline">{apiType}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API Test Form */}
          <ApiTestForm onSubmit={handleApiTest} />

          {/* API Response Display */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Resultado da Consulta</CardTitle>
              <CardDescription>
                Resposta JSON retornada pela API
              </CardDescription>
            </CardHeader>
            <CardContent>
              {apiResponse ? (
                <div className="rounded-lg bg-slate-950 p-4 overflow-auto max-h-[600px]">
                  <pre className="text-xs text-green-400 font-mono">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-slate-100 p-3 mb-4">
                    <svg
                      className="w-6 h-6 text-slate-400"
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
                    Nenhuma consulta realizada ainda
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Preencha o formulário e clique em "Executar Teste" para ver
                    o resultado
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
