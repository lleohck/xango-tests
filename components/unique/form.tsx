"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import type { ApiType } from "@/types/shared";

// Forms específicos (BI-DATA você já tem)
import BiDataParamsForm, {
  BiDataParamsFormData,
} from "@/components/shared/apis/bi-data-params-form";

// Você precisa ter/criar estes três:
import CiDataParamsForm, {
  CiDataParamsFormData,
} from "@/components/shared/apis/ci-data-params-form";

import BiOrchestratorParamsForm, {
  BiOrchestratorParamsFormData,
} from "@/components/shared/apis/bi-orchestrator-params-form";

import CiOrchestratorParamsForm, {
  CiOrchestratorParamsFormData,
} from "@/components/shared/apis/ci-orchestrator-params-form";

/** Map de dados por API */
type ApiFormDataMap = {
  "bi-data"?: BiDataParamsFormData;
  "ci-data"?: CiDataParamsFormData;
  "bi-orchestrator"?: BiOrchestratorParamsFormData;
  "ci-orchestrator"?: CiOrchestratorParamsFormData;
};

export type UniqueTestFormData = {
  modelo: string;
  ndoc: string;
  forms: ApiFormDataMap;
};

interface UniqueTestFormProps {
  apiName: ApiType;
  onSubmit: (data: UniqueTestFormData) => void;
}

/** Defaults por API */
const defaultParams = {
  "bi-data": {
    version: "v3",
    explainer: false,
    is_canary: false,
  } satisfies BiDataParamsFormData,

  "ci-data": {
    bifrost: false,
    is_canary: false,
  } satisfies CiDataParamsFormData,

  "bi-orchestrator": {
    explainer: false,
    is_canary: false,
  } satisfies BiOrchestratorParamsFormData,

  "ci-orchestrator": {
    user: "user-test",
    cgc: "62173620",
    transaction: "transaction",
    is_canary: false,
  } satisfies CiOrchestratorParamsFormData,
} as const;

/** Registry: API -> { defaultParams, renderer do form } */
const apiRegistry = {
  "bi-data": {
    defaultParams: defaultParams["bi-data"],
    render: (props: {
      data: BiDataParamsFormData;
      onChange: <K extends keyof BiDataParamsFormData>(
        field: K,
        value: BiDataParamsFormData[K],
      ) => void;
    }) => (
      <BiDataParamsForm
        version="unique"
        formData={props.data}
        setFormData={props.onChange}
      />
    ),
  },

  "ci-data": {
    defaultParams: defaultParams["ci-data"],
    render: (props: {
      data: CiDataParamsFormData;
      onChange: <K extends keyof CiDataParamsFormData>(
        field: K,
        value: CiDataParamsFormData[K],
      ) => void;
    }) => (
      <CiDataParamsForm version="unique" formData={props.data} setFormData={props.onChange} />
    ),
  },

  "bi-orchestrator": {
    defaultParams: defaultParams["bi-orchestrator"],
    render: (props: {
      data: BiOrchestratorParamsFormData;
      onChange: <K extends keyof BiOrchestratorParamsFormData>(
        field: K,
        value: BiOrchestratorParamsFormData[K],
      ) => void;
    }) => (
      <BiOrchestratorParamsForm
        version="unique"
        formData={props.data}
        setFormData={props.onChange}
      />
    ),
  },

  "ci-orchestrator": {
    defaultParams: defaultParams["ci-orchestrator"],
    render: (props: {
      data: CiOrchestratorParamsFormData;
      onChange: <K extends keyof CiOrchestratorParamsFormData>(
        field: K,
        value: CiOrchestratorParamsFormData[K],
      ) => void;
    }) => (
      <CiOrchestratorParamsForm
        version="unique"
        formData={props.data}
        setFormData={props.onChange}
      />
    ),
  },
} satisfies Record<
  ApiType,
  { defaultParams: any; render: (props: any) => JSX.Element }
>;

export function UniqueTestForm({ apiName, onSubmit }: UniqueTestFormProps) {
  const [formData, setFormData] = useState<UniqueTestFormData>({
    modelo: "",
    ndoc: "",
    forms: {
      [apiName]: apiRegistry[apiName].defaultParams,
    },
  });

  const currentApiParams = useMemo(() => {
    const existing = formData.forms[apiName];
    return (existing ?? apiRegistry[apiName].defaultParams) as any;
  }, [apiName, formData.forms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalized: UniqueTestFormData = {
      ...formData,
      forms: {
        ...formData.forms,
        [apiName]: currentApiParams,
      },
    };

    onSubmit(normalized);
  };

  const handleBaseChange = (field: "modelo" | "ndoc", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateApiParams = <T extends object, K extends keyof T>(
    api: ApiType,
    field: K,
    value: T[K],
  ) => {
    setFormData((prev) => {
      const fallback = apiRegistry[api].defaultParams as T;
      const current = ((prev.forms[api] ?? fallback) as T) ?? fallback;

      return {
        ...prev,
        forms: {
          ...prev.forms,
          [api]: {
            ...current,
            [field]: value,
          },
        },
      };
    });
  };

  const isFormValid = Boolean(formData.modelo && formData.ndoc);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parametrização da Chamada</CardTitle>
        <CardDescription>
          Preencha os parâmetros para testar a API selecionada
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modelo">Modelo *</Label>
              <Input
                id="modelo"
                type="text"
                placeholder="Ex: hspn"
                value={formData.modelo}
                onChange={(e) => handleBaseChange("modelo", e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ndoc">Número do Documento (ndoc) *</Label>
              <Input
                id="ndoc"
                type="text"
                placeholder="Ex: 12345678900"
                value={formData.ndoc}
                onChange={(e) => handleBaseChange("ndoc", e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-3">
            {apiRegistry[apiName].render({
              data: currentApiParams,
              onChange: (field: any, value: any) =>
                updateApiParams<any, any>(apiName, field, value),
            })}
          </div>

          <Button type="submit" className="w-full" disabled={!isFormValid}>
            Executar Teste
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
