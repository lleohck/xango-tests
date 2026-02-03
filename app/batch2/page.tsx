"use client";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, PlayCircle, FileSpreadsheet } from "lucide-react";
import type { Environment, ApiType } from "@/types/shared";

interface BatchProcessingPageProps {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
  apiType: ApiType;
  setApiType: (api: ApiType) => void;
}

interface ComparisonResult {
  modelo: string;
  ndoc: string;
  execution1: any;
  execution2: any;
  differences: string[];
}

const modelos = ["hnu2", "hnu1", "hspn", "hbbv"];

export default function BatchProcessingPage() {
  const [numDocuments, setNumDocuments] = useState([10]);
  const [numModels, setNumModels] = useState([5]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ComparisonResult[]>([]);

  const handleBatchTest = async () => {
    setIsProcessing(true);
    setProgress(0);
    const newResults: ComparisonResult[] = [];

    const totalTests = numDocuments[0] * numModels[0];
    let completed = 0;

    for (let m = 0; m < numModels[0]; m++) {
      for (let d = 0; d < numDocuments[0]; d++) {
        const modelo = modelos[m % modelos.length];
        const ndoc = `DOC${String(d + 1).padStart(6, "0")}`;

        // Simulate two consecutive API calls
        const execution1 = generateMockResponse(modelo, ndoc);
        await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate delay
        const execution2 = generateMockResponse(modelo, ndoc);

        const differences = findDifferences(execution1, execution2);

        newResults.push({
          modelo,
          ndoc,
          execution1,
          execution2,
          differences,
        });

        completed++;
        setProgress((completed / totalTests) * 100);
      }
    }

    setResults(newResults);
    setIsProcessing(false);
  };

  const generateMockResponse = (modelo: string, ndoc: string) => {
    return {
      score: parseFloat(Math.random().toFixed(4)),
      prediction: Math.random() > 0.5 ? "approved" : "rejected",
      confidence: parseFloat((Math.random() * 100).toFixed(2)),
      processing_time_ms: Math.floor(Math.random() * 1000),
    };
  };

  const findDifferences = (exec1: any, exec2: any): string[] => {
    const diffs: string[] = [];
    for (const key in exec1) {
      if (exec1[key] !== exec2[key]) {
        diffs.push(key);
      }
    }
    return diffs;
  };

  const downloadCSV = () => {
    const headers = [
      "Modelo",
      "Documento",
      "Score_1",
      "Score_2",
      "Score_Diff",
      "Prediction_1",
      "Prediction_2",
      "Match",
      "Confidence_1",
      "Confidence_2",
      "Confidence_Diff",
      "Time_1",
      "Time_2",
    ];

    const rows = results.map((result) => {
      const scoreDiff = Math.abs(
        result.execution1.score - result.execution2.score,
      );
      const match =
        result.execution1.prediction === result.execution2.prediction
          ? "✓"
          : "✗";
      const confidenceDiff = Math.abs(
        result.execution1.confidence - result.execution2.confidence,
      );

      return [
        result.modelo,
        result.ndoc,
        result.execution1.score,
        result.execution2.score,
        scoreDiff.toFixed(4),
        result.execution1.prediction,
        result.execution2.prediction,
        match,
        result.execution1.confidence,
        result.execution2.confidence,
        confidenceDiff.toFixed(2),
        result.execution1.processing_time_ms,
        result.execution2.processing_time_ms,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `batch_comparison_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Batch Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração do Lote</CardTitle>
          <CardDescription>
            Configure a quantidade de documentos e modelos para testar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="documents-slider">Quantidade de Documentos</Label>
              <span className="text-sm font-medium">{numDocuments[0]}</span>
            </div>
            <Slider
              id="documents-slider"
              value={numDocuments}
              onValueChange={setNumDocuments}
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="models-slider">Quantidade de Modelos</Label>
              <span className="text-sm font-medium">{numModels[0]}</span>
            </div>
            <Slider
              id="models-slider"
              value={numModels}
              onValueChange={setNumModels}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium">Total de Testes</p>
                <p className="text-xs text-muted-foreground">
                  {numDocuments[0]} documentos × {numModels[0]} modelos × 2
                  execuções
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {numDocuments[0] * numModels[0]}
                </p>
                <p className="text-xs text-muted-foreground">comparações</p>
              </div>
            </div>

            {isProcessing && (
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Processando...</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleBatchTest}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>Processando...</>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Iniciar Processamento em Lote
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Resultados da Comparação</CardTitle>
                <CardDescription>
                  Comparação entre as duas execuções consecutivas para cada
                  combinação
                </CardDescription>
              </div>
              <Button onClick={downloadCSV} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Baixar CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Modelo</th>
                    <th className="px-4 py-3 text-left font-medium">
                      Documento
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Score 1
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Score 2
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Δ Score
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Prediction 1
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Prediction 2
                    </th>
                    <th className="px-4 py-3 text-center font-medium">Match</th>
                    <th className="px-4 py-3 text-center font-medium">
                      Confidence 1
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Confidence 2
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Δ Conf
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result, idx) => {
                    const scoreDiff = Math.abs(
                      result.execution1.score - result.execution2.score,
                    );
                    const predictionMatch =
                      result.execution1.prediction ===
                      result.execution2.prediction;
                    const confidenceDiff = Math.abs(
                      result.execution1.confidence -
                        result.execution2.confidence,
                    );

                    return (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3">{result.modelo}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {result.ndoc}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {result.execution1.score.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {result.execution2.score.toFixed(4)}
                        </td>
                        <td
                          className={`px-4 py-3 text-center font-mono text-xs font-semibold ${
                            scoreDiff > 0.01
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {scoreDiff.toFixed(4)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs ${
                              result.execution1.prediction === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {result.execution1.prediction}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs ${
                              result.execution2.prediction === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {result.execution2.prediction}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-center text-lg ${
                            predictionMatch ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
                          {predictionMatch ? "✓" : "✗"}
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {result.execution1.confidence.toFixed(2)}%
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-xs">
                          {result.execution2.confidence.toFixed(2)}%
                        </td>
                        <td
                          className={`px-4 py-3 text-center font-mono text-xs font-semibold ${
                            confidenceDiff > 5
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {confidenceDiff.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-200 rounded" />
                <span className="text-muted-foreground">
                  Diferença aceitável
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded" />
                <span className="text-muted-foreground">
                  Diferença significativa
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {results.length} resultados
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
