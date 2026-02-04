"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { PlayCircle, Square } from "lucide-react";

type Props = {
  numDocuments: number[];
  setNumDocuments: (v: number[]) => void;
  numModels: number[];
  setNumModels: (v: number[]) => void;
  maxDocuments: number;
  maxModels: number;
  isProcessing: boolean;
  progress: number;
  processed: number;
  total: number;
  onStart: () => void;
  onStop: () => void;
};

export default function BatchConfigForm({
  numDocuments,
  setNumDocuments,
  numModels,
  setNumModels,
  maxDocuments,
  maxModels,
  isProcessing,
  progress,
  processed,
  total,
  onStart,
  onStop,
}: Props) {
  const renderMarks = (marks: number[], min: number, max: number) => (
    <div className="relative h-4">
      {marks.map((mark) => {
        const percent = ((mark - min) / (max - min)) * 100;
        const positionClass =
          mark === min
            ? "translate-x-0"
            : mark === max
              ? "-translate-x-full"
              : "-translate-x-1/2";

        return (
          <span
            key={mark}
            className={`absolute text-xs text-muted-foreground ${positionClass}`}
            style={{ left: `${percent}%` }}
          >
            {mark}
          </span>
        );
      })}
    </div>
  );

  const docs = numDocuments[0] ?? 1;
  const models = numModels[0] ?? 1;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="documents-slider">Quantidade de Documentos</Label>
          <span className="text-sm font-medium">{docs}</span>
        </div>
        <Slider
          id="documents-slider"
          value={numDocuments}
          onValueChange={setNumDocuments}
          min={1}
          max={maxDocuments}
          step={1}
          className="w-full"
          disabled={isProcessing}
        />
        {renderMarks(
          [
            1,
            Math.min(25, maxDocuments),
            Math.min(50, maxDocuments),
            Math.min(75, maxDocuments),
            maxDocuments,
          ].filter((v, i, arr) => arr.indexOf(v) === i),
          1,
          maxDocuments,
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="models-slider">Quantidade de Modelos</Label>
          <span className="text-sm font-medium">{models}</span>
        </div>
        <Slider
          id="models-slider"
          value={numModels}
          onValueChange={setNumModels}
          min={1}
          max={maxModels}
          step={1}
          className="w-full"
          disabled={isProcessing}
        />
        {renderMarks(
          [
            1,
            Math.min(5, maxModels),
            Math.min(10, maxModels),
            Math.min(15, maxModels),
            maxModels,
          ].filter((v, i, arr) => arr.indexOf(v) === i),
          1,
          maxModels,
        )}
      </div>

      <div className="border-t pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Total de Testes</p>
            <p className="text-xs text-muted-foreground">
              {docs} documentos × {models} modelos × 2 execuções
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{docs * models}</p>
            <p className="text-xs text-muted-foreground">comparações</p>
          </div>
        </div>

        {isProcessing && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processando...</span>
              <span>
                {processed}/{total} ({progress.toFixed(0)}%)
              </span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            className="w-full"
            size="lg"
            onClick={onStart}
            disabled={isProcessing}
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Iniciar Processamento em Lote
          </Button>

          <Button
            className=""
            size="lg"
            variant="outline"
            onClick={onStop}
            disabled={!isProcessing}
            title="Parar processamento"
          >
            <Square className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
