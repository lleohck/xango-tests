"use client";

import { useState } from "react";
import type { ApiType, Environment } from "@/types/shared";

import {
  BATCH_API_LABELS,
  BATCH_ENVIRONMENTS,
  BATCH_ENVIRONMENT_LABELS,
  BatchCustomizationData,
  BatchCustomizationPatch,
} from "@/lib/batch-customization-storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BatchCustomizationEnvironmentForm from "./batch-customization-environment-form";
import { getBatchDefaultLists } from "@/lib/batch-default-config";

type BatchCustomizationApiCardProps = {
  api: ApiType;
  data: BatchCustomizationData;
  onSave: (
    api: ApiType,
    environment: Environment,
    value: BatchCustomizationPatch,
  ) => void;
};

export default function BatchCustomizationApiCard({
  api,
  data,
  onSave,
}: BatchCustomizationApiCardProps) {
  const [activeEnvironment, setActiveEnvironment] = useState<Environment>("DEV");
  const defaultLists = getBatchDefaultLists(api, activeEnvironment);
  const documentsLabel = defaultLists.documents.length
    ? defaultLists.documents.join(", ")
    : "Nenhuma configuração padrão";
  const modelsLabel = defaultLists.models.length
    ? defaultLists.models.join(", ")
    : "Nenhuma configuração padrão";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{BATCH_API_LABELS[api]}</CardTitle>
        <CardDescription>
          Configure os documentos e modelos para cada ambiente.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs
          value={activeEnvironment}
          onValueChange={(value) => setActiveEnvironment(value as Environment)}
        >
          <TabsList className="grid h-auto w-full grid-cols-3">
            {BATCH_ENVIRONMENTS.map((environment) => (
              <TabsTrigger
                key={environment}
                value={environment}
                className="py-1.5"
              >
                {BATCH_ENVIRONMENT_LABELS[environment]}
              </TabsTrigger>
            ))}
          </TabsList>

          {BATCH_ENVIRONMENTS.map((environment) => (
            <TabsContent key={environment} value={environment} className="mt-4">
              <BatchCustomizationEnvironmentForm
                idSuffix={`${api}-${environment}`}
                value={data[api][environment]}
                onSave={(value) => onSave(api, environment, value)}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      <Separator />

      <CardFooter className="items-start">
        <div className="w-full space-y-3">
          <p className="text-sm font-medium">
            Configuração padrão em{" "}
            <span className="font-semibold">
              {BATCH_ENVIRONMENT_LABELS[activeEnvironment]}
            </span>
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lista de documentos
              </p>
              <p className="text-sm break-words">{documentsLabel}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Lista de modelos
              </p>
              <p className="text-sm break-words">{modelsLabel}</p>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
