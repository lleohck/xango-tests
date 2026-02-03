"use client";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import BiDataParamsForm, {
  BiDataParamsFormData,
} from "../shared/apis/bi-data-params-form";
import { ApiType } from "@/types/shared";
import { Field, FieldLabel, FieldDescription } from "../ui/field";

type CiDataParamsFormData = Record<string, never>;

type ApiFormDataMap = {
  "bi-data"?: BiDataParamsFormData;
  "ci-data"?: CiDataParamsFormData;
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

const defaultBiDataParams: BiDataParamsFormData = {
  version: "v2",
  explainer: false,
  is_canary: false,
};

export function UniqueTestForm({ apiName, onSubmit }: UniqueTestFormProps) {
  const [formData, setFormData] = useState<UniqueTestFormData>({
    modelo: "",
    ndoc: "",
    forms: {
      "bi-data": defaultBiDataParams,
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleBaseChange = (field: "modelo" | "ndoc", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

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

  const isFormValid = Boolean(formData.modelo && formData.ndoc);
  const biDataParams = formData.forms["bi-data"] ?? defaultBiDataParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parametrização da Chamada</CardTitle>
        <CardDescription>
          Preencha os parâmetros para testar a API
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

          {apiName === "bi-data" && (
            <BiDataParamsForm
              version="unique"
              formData={biDataParams}
              setFormData={(
                field: keyof BiDataParamsFormData,
                value: BiDataParamsFormData[keyof BiDataParamsFormData],
              ) => handleBiDataChange(field, value)}
            />
          )}

          <Button type="submit" className="w-full" disabled={!isFormValid}>
            Executar Teste
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
