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
  const [environment, setEnvironment] = useState<Environment>("DEV");
  const [currentEnvironment, setCurrentEnvironment] =
    useState<EnvironmentConfig>(environments[0]);

  const [formData, setFormData] = useState<BatchTestFormData>({
    forms: {
      "bi-data": defaultBiDataParams,
    },
  });

  const [apiType, setApiType] = useState<ApiType>("bi-data");

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
        </div>
      </div>
    </div>
  );
}
