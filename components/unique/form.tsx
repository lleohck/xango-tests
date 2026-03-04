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
type ApiParamsByType = {
  "bi-data": BiDataParamsFormData;
  "ci-data": CiDataParamsFormData;
  "bi-orchestrator": BiOrchestratorParamsFormData;
  "ci-orchestrator": CiOrchestratorParamsFormData;
};

type ApiFormDataMap = Partial<ApiParamsByType>;

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
const defaultParams: ApiParamsByType = {
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
};

type ApiRegistryEntry<K extends ApiType> = {
  defaultParams: ApiParamsByType[K];
  render: (props: {
    data: ApiParamsByType[K];
    onChange: <F extends keyof ApiParamsByType[K]>(
      field: F,
      value: ApiParamsByType[K][F],
    ) => void;
  }) => React.JSX.Element;
};

type ApiRegistry = {
  [K in ApiType]: ApiRegistryEntry<K>;
};

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
} satisfies ApiRegistry;

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
    return (existing ??
      apiRegistry[apiName].defaultParams) as ApiParamsByType[typeof apiName];
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

  const updateApiParams = <
    K extends ApiType,
    F extends keyof ApiParamsByType[K],
  >(
    api: K,
    field: F,
    value: ApiParamsByType[K][F],
  ) => {
    setFormData((prev) => {
      const fallback = apiRegistry[api].defaultParams;
      const current =
        ((prev.forms[api] ?? fallback) as ApiParamsByType[K]) ?? fallback;

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

  const renderApiParams = () => {
    if (apiName === "bi-data") {
      return apiRegistry["bi-data"].render({
        data: currentApiParams as BiDataParamsFormData,
        onChange: (field, value) => updateApiParams("bi-data", field, value),
      });
    }

    if (apiName === "ci-data") {
      return apiRegistry["ci-data"].render({
        data: currentApiParams as CiDataParamsFormData,
        onChange: (field, value) => updateApiParams("ci-data", field, value),
      });
    }

    if (apiName === "bi-orchestrator") {
      return apiRegistry["bi-orchestrator"].render({
        data: currentApiParams as BiOrchestratorParamsFormData,
        onChange: (field, value) =>
          updateApiParams("bi-orchestrator", field, value),
      });
    }

    return apiRegistry["ci-orchestrator"].render({
      data: currentApiParams as CiOrchestratorParamsFormData,
      onChange: (field, value) =>
        updateApiParams("ci-orchestrator", field, value),
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
            {renderApiParams()}
          </div>

          <Button type="submit" className="w-full" disabled={!isFormValid}>
            Executar Teste
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
