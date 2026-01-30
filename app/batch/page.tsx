"use client";
import { useState } from "react";

import AppHeader from "@/components/shared/app-header";
import EnvironmentConfigForm, {
  EnvironmentConfig,
  environments,
} from "@/components/shared/environment-config-form";
import { ApiType, Environment } from "@/types/shared";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BiDataParamsForm, {
  BiDataParamsFormData,
} from "@/components/shared/apis/bi-data-params-form";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { ChevronsUpDown, PlayCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type BatchTestFormData = {
  forms: {
    "bi-data"?: BiDataParamsFormData;
  };
};

const defaultBiDataParams: BiDataParamsFormData = {
  version: "v2",
  explainer: false,
  is_canary: false,
};

export default function BatchTest() {
  const [isOpen, setIsOpen] = useState(true);
  const [numDocuments, setNumDocuments] = useState([10]);
  const [numModels, setNumModels] = useState([10]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [environment, setEnvironment] = useState<Environment>("DEV");

  const [currentEnvironment, setCurrentEnvironment] =
    useState<EnvironmentConfig>(environments[0]);

  const [formData, setFormData] = useState<BatchTestFormData>({
    forms: {
      "bi-data": defaultBiDataParams,
    },
  });

  const [apiType, setApiType] = useState<ApiType>("bi-data");

  const renderMarks = (marks: number[], min: number, max: number) => (
    <div className="relative h-4">
      {marks.map((mark) => {
        const percent = ((mark - min) / (max - min)) * 100;
        const positionClass =
          mark === min
            ? "translate-x-0"
            : mark === max
              ? "-translate-x-full"
              : "-translate-x-1/2";

        return (
          <span
            key={mark}
            className={`absolute text-xs text-muted-foreground ${positionClass}`}
            style={{ left: `${percent}%` }}
          >
            {mark}
          </span>
        );
      })}
    </div>
  );

  const handleBiDataChange = <K extends keyof BiDataParamsFormData>(
    field: K,
    value: BiDataParamsFormData[K],
  ) => {
    setFormData((prev) => {
      const currentParams = prev.forms["bi-data"] ?? defaultBiDataParams;
      return {
        ...prev,
        forms: {
          ...prev.forms,
          "bi-data": {
            ...currentParams,
            [field]: value,
          },
        },
      };
    });
  };

  const biDataParams = formData.forms["bi-data"] ?? defaultBiDataParams;

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

          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            <div className="h-full w-full">
              <EnvironmentConfigForm
                environment={environment}
                setEnvironment={setEnvironment}
                apiType={apiType}
                setApiType={setApiType}
                currentEnvironment={currentEnvironment}
                setCurrentEnvironment={setCurrentEnvironment}
                className="h-full"
              />
            </div>
            <div className="h-full w-full">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>Parametrização da Chamada</CardTitle>
                  <CardDescription>
                    Preencha os parâmetros para testar a API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BiDataParamsForm
                    version="batch"
                    formData={biDataParams}
                    setFormData={(
                      field: keyof BiDataParamsFormData,
                      value: BiDataParamsFormData[keyof BiDataParamsFormData],
                    ) => handleBiDataChange(field, value)}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle>Configuração do Lote</CardTitle>
                  {isOpen && (
                    <CardDescription className="mt-2">
                      Configure a quantidade de documentos e modelos para testar
                    </CardDescription>
                  )}
                </div>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    aria-label="Alternar detalhes"
                  >
                    <ChevronsUpDown />
                  </Button>
                </CollapsibleTrigger>
              </CardHeader>
              <CollapsibleContent>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="documents-slider">
                        Quantidade de Documentos
                      </Label>
                      <span className="text-sm font-medium">
                        {numDocuments[0]}
                      </span>
                    </div>
                    <Slider
                      id="documents-slider"
                      value={numDocuments}
                      onValueChange={setNumDocuments}
                      min={1}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    {renderMarks([1, 25, 50, 75, 100], 1, 100)}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="models-slider">
                        Quantidade de Modelos
                      </Label>
                      <span className="text-sm font-medium">
                        {numModels[0]}
                      </span>
                    </div>
                    <Slider
                      id="models-slider"
                      value={numModels}
                      onValueChange={setNumModels}
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                    {renderMarks([1, 5, 10, 15, 20], 1, 20)}
                  </div>

                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium">Total de Testes</p>
                        <p className="text-xs text-muted-foreground">
                          {numDocuments[0]} documentos × {numModels[0]} modelos
                          × 2 execuções
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {numDocuments[0] * numModels[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          comparações
                        </p>
                      </div>
                    </div>

                    {isProcessing && (
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span>Processando...</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                    )}

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => {
                        setIsProcessing(true);
                        setProgress(0);
                      }}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>Processando...</>
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-5 w-5" />
                          Iniciar Processamento em Lote
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </div>
  );
}
