import { FileSearchCorner } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnvironmentConfig } from "../shared/environment-config-form";
import { ApiType, Environment } from "@/types/shared";
import { ApiTestFormData } from "../ApiTestForm";

type UniqueResultCardProps = {
  lastQuery:
    | (ApiTestFormData & {
        environment: Environment;
        apiType: ApiType;
        currentEnvironment: EnvironmentConfig;
      })
    | null;
  apiResponse: unknown;
};

export default function UniqueResultCard({
  lastQuery,
  apiResponse,
}: UniqueResultCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle>Resultado da Consulta</CardTitle>
        <CardDescription>Resposta JSON retornada pela API</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="space-y-2">
          {lastQuery && (
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${lastQuery.currentEnvironment.dotClass}`}
                />
                {lastQuery.currentEnvironment.label}
              </Badge>
              <Badge variant="outline">{lastQuery.apiType}</Badge>
              <Badge variant="outline">{lastQuery.modelo}</Badge>
              <Badge variant="outline">{lastQuery.ndoc}</Badge>
              <Badge
                variant="outline"
                className={
                  lastQuery.explainer
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                }
              >
                explainer
              </Badge>
              <Badge
                variant="outline"
                className={
                  lastQuery.is_canary
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300"
                }
              >
                canary
              </Badge>
              <Badge variant="outline" className="bg-muted/30">
                {lastQuery.version}
              </Badge>
            </div>
          )}
        </div>

        {apiResponse ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 overflow-auto rounded-lg border border-border/70 bg-muted/40 p-4">
              <pre className="text-xs font-mono leading-relaxed text-foreground">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-3">
              <FileSearchCorner />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma consulta realizada ainda
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Preencha o formulário e clique em &quot;Executar Teste&quot; para
              ver o resultado
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
