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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ApiTestFormProps {
  onSubmit: (data: any) => void;
}

const modelos = [
  "modelo-credit-score-v1",
  "modelo-fraud-detection-v2",
  "modelo-risk-assessment-v3",
  "modelo-customer-segmentation-v1",
  "modelo-churn-prediction-v2",
];

export function ApiTestForm({ onSubmit }: ApiTestFormProps) {
  const [formData, setFormData] = useState({
    modelo: "",
    ndoc: "",
    explainer: "false",
    version: "v2",
    is_canary: "false",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = formData.modelo && formData.ndoc;

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
          {/* Lista de Modelos */}
          <div className="space-y-2">
            <Label htmlFor="modelo">Lista de Modelos *</Label>
            <Select
              value={formData.modelo}
              onValueChange={(value) => handleChange("modelo", value)}
            >
              <SelectTrigger id="modelo">
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

          {/* ndoc */}
          <div className="space-y-2">
            <Label htmlFor="ndoc">Número do Documento (ndoc) *</Label>
            <Input
              id="ndoc"
              type="text"
              placeholder="Ex: 12345678900"
              value={formData.ndoc}
              onChange={(e) => handleChange("ndoc", e.target.value)}
            />
          </div>

          {/* explainer */}
          <div className="space-y-3">
            <Label>Explainer</Label>
            <RadioGroup
              value={formData.explainer}
              onValueChange={(value) => handleChange("explainer", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="explainer-true" />
                <Label
                  htmlFor="explainer-true"
                  className="font-normal cursor-pointer"
                >
                  True
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="explainer-false" />
                <Label
                  htmlFor="explainer-false"
                  className="font-normal cursor-pointer"
                >
                  False
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* version */}
          <div className="space-y-3">
            <Label>Version</Label>
            <RadioGroup
              value={formData.version}
              onValueChange={(value) => handleChange("version", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="v2" id="version-v2" />
                <Label
                  htmlFor="version-v2"
                  className="font-normal cursor-pointer"
                >
                  v2
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="v3" id="version-v3" />
                <Label
                  htmlFor="version-v3"
                  className="font-normal cursor-pointer"
                >
                  v3
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* is_canary */}
          <div className="space-y-3">
            <Label>Is Canary</Label>
            <RadioGroup
              value={formData.is_canary}
              onValueChange={(value) => handleChange("is_canary", value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="canary-true" />
                <Label
                  htmlFor="canary-true"
                  className="font-normal cursor-pointer"
                >
                  True
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="canary-false" />
                <Label
                  htmlFor="canary-false"
                  className="font-normal cursor-pointer"
                >
                  False
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={!isFormValid}>
            Executar Teste
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
