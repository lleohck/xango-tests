"use client";

import { useEffect, useState } from "react";

import type { ApiType, Environment } from "@/types/shared";
import AppHeader from "@/components/shared/app-header";
import BatchCustomizationApiCard from "@/components/batch/customization/batch-customization-api-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BATCH_APIS,
  BATCH_API_LABELS,
  BatchCustomizationData,
  BatchCustomizationPatch,
  readBatchCustomization,
  updateBatchCustomization,
} from "@/lib/batch-customization-storage";

export default function BatchCustomizationPage() {
  const [activeApi, setActiveApi] = useState<ApiType>(BATCH_APIS[0]);
  const [customizationData, setCustomizationData] =
    useState<BatchCustomizationData>(() => readBatchCustomization());

  useEffect(() => {
    const refreshData = () => setCustomizationData(readBatchCustomization());
    window.addEventListener("storage", refreshData);
    return () => window.removeEventListener("storage", refreshData);
  }, []);

  const handleSave = (
    api: ApiType,
    environment: Environment,
    value: BatchCustomizationPatch,
  ) => {
    const nextData = updateBatchCustomization(api, environment, value);
    setCustomizationData(nextData);
  };

  return (
    <div>
      <AppHeader
        appName="Xango API Testing"
        logoSrc="/serasa-logo.svg"
        menus={[
          { label: "Consulta Única", href: "/unique" },
          { label: "Processamento em Lote", href: "/batch" },
          { label: "Comparação de Lotes", href: "/compare" },
        ]}
      />

      <div className="bg-background px-6 py-5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Personalização do Lote
            </h1>
            <p className="text-muted-foreground">
              Personalize a lista de documentos e modelos padrão do{" "}
              <span className="font-semibold">Processamento em Lote</span>.
            </p>
          </div>

          <Tabs
            value={activeApi}
            onValueChange={(value) => setActiveApi(value as ApiType)}
          >
            <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-transparent p-0 lg:grid-cols-4">
              {BATCH_APIS.map((api) => (
                <TabsTrigger
                  key={api}
                  value={api}
                  className="h-9 rounded-md border bg-muted/50"
                >
                  {BATCH_API_LABELS[api]}
                </TabsTrigger>
              ))}
            </TabsList>

            {BATCH_APIS.map((api) => (
              <TabsContent key={api} value={api} className="mt-1">
                <BatchCustomizationApiCard
                  api={api}
                  data={customizationData}
                  onSave={handleSave}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
