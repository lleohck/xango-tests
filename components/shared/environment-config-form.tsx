import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Environment = "DEV" | "UAT" | "PRD";
export type EnvironmentConfig = {
  value: Environment;
  label: string;
  description: string;
  dotClass: string;
};

export const environments: Array<EnvironmentConfig> = [
  {
    value: "DEV",
    label: "DEV",
    description: "Development",
    dotClass: "bg-sky-500",
  },
  {
    value: "UAT",
    label: "UAT",
    description: "User Acceptance Testing",
    dotClass: "bg-amber-500",
  },
  {
    value: "PRD",
    label: "PRD",
    description: "Production",
    dotClass: "bg-rose-500",
  },
];

type ApiType = "ci-data" | "bi-data";
const apiOptions: Array<{ value: ApiType; label: string }> = [
  { value: "bi-data", label: "bi-data" },
  { value: "ci-data", label: "ci-data" },
];

type EnvironmentConfigFormProps = {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
  apiType: ApiType;
  setApiType: (api: ApiType) => void;
  currentEnvironment: (typeof environments)[0];
  setCurrentEnvironment?: (env: (typeof environments)[0]) => void;
};

export default function EnvironmentConfigForm({
  environment,
  setEnvironment,
  apiType,
  setApiType,
  currentEnvironment,
  setCurrentEnvironment,
}: EnvironmentConfigFormProps) {
  const handleEnvironmentChange = (env: Environment) => {
    setEnvironment(env);
    if (setCurrentEnvironment) {
      setCurrentEnvironment(
        environments.find((item) => item.value === env) ?? environments[0],
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração de Ambiente</CardTitle>
        <CardDescription>
          Selecione o ambiente e a API que deseja testar
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="environment">Ambiente</Label>
            <Select
              value={environment}
              onValueChange={(value) =>
                handleEnvironmentChange(value as Environment)
              }
            >
              <SelectTrigger id="environment" className="w-full">
                <SelectValue placeholder="Selecione um ambiente" />
              </SelectTrigger>
              <SelectContent>
                {environments.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${item.dotClass}`}
                      />
                      <span className="font-medium">{item.label}</span>
                      <span className="text-muted-foreground">
                        - {item.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api">API</Label>
            <Select
              value={apiType}
              onValueChange={(value) => setApiType(value as ApiType)}
            >
              <SelectTrigger id="api" className="w-full">
                <SelectValue placeholder="Selecione a API" />
              </SelectTrigger>
              <SelectContent>
                {apiOptions.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Conectado em:</span>
          <Badge variant="outline" className="gap-2">
            <div
              className={`h-2 w-2 rounded-full ${currentEnvironment.dotClass}`}
            />
            {currentEnvironment.label}
          </Badge>
          <span className="text-sm text-muted-foreground">•</span>
          <Badge variant="outline">{apiType}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
