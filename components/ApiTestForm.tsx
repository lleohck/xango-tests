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
import { Switch } from "@/components/ui/switch";
import SwitchChoiceCard from "../ui/switch-choice-card";

export type ApiTestFormData = {
  modelo: string;
  ndoc: string;
  explainer: boolean;
  version: "v2" | "v3";
  is_canary: boolean;
};

interface ApiTestFormProps {
  onSubmit: (data: ApiTestFormData) => void;
}

const modelos = ["hvo1", "hvld", "hrle", "hspn", "hgc2"];

export function ApiTestForm({ onSubmit }: ApiTestFormProps) {
  const [formData, setFormData] = useState<ApiTestFormData>({
    modelo: "",
    ndoc: "",
    explainer: false,
    version: "v2",
    is_canary: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = <K extends keyof ApiTestFormData>(
    field: K,
    value: ApiTestFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = Boolean(formData.modelo && formData.ndoc);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Consulta de Modelo</CardTitle>
        <CardDescription>
          Preencha os parâmetros para testar a API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="modelo">Lista de Modelos *</Label>
              <Select
                value={formData.modelo}
                onValueChange={(value) => handleChange("modelo", value)}
              >
                <SelectTrigger id="modelo" className="w-full">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((modelo) => (
                    <SelectItem key={modelo} value={modelo}>
                      {modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ndoc">Número do Documento (ndoc) *</Label>
              <Input
                id="ndoc"
                type="text"
                placeholder="Ex: 12345678900"
                value={formData.ndoc}
                onChange={(e) => handleChange("ndoc", e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-4">
              <div className="space-y-1">
                <Label htmlFor="version">Versão do modelo</Label>
                <p className="text-sm text-muted-foreground">
                  Alterne entre v2 (estável) e v3 (experimental).
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={
                    formData.version === "v2"
                      ? "text-sm font-medium text-foreground"
                      : "text-sm text-muted-foreground"
                  }
                >
                  v2
                </span>
                <Switch
                  id="version"
                  checked={formData.version === "v3"}
                  onCheckedChange={(checked) =>
                    handleChange("version", checked ? "v3" : "v2")
                  }
                  aria-label="Alternar versão do modelo"
                />
                <span
                  className={
                    formData.version === "v3"
                      ? "text-sm font-medium text-foreground"
                      : "text-sm text-muted-foreground"
                  }
                >
                  v3
                </span>
              </div>
            </div>
            <SwitchChoiceCard
              title="Explainer"
              description="Inclui detalhes explicativos na resposta."
              id="explainer"
              checked={formData.explainer}
              onCheckedChange={(checked) => handleChange("explainer", checked)}
            />
            <SwitchChoiceCard
              title="Is Canary"
              description="Usa a rota canary para validações controladas."
              id="is-canary"
              checked={formData.is_canary}
              onCheckedChange={(checked) => handleChange("is_canary", checked)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={!isFormValid}>
            Executar Teste
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
