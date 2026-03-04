import type { ApiType, Environment } from "@/types/shared";

type ApiGroup = "CI" | "BI";

type BatchDefaultConfigMap = Record<
  ApiGroup,
  Record<Environment, { documents?: string; models?: string }>
>;

const BATCH_DEFAULT_CONFIG: BatchDefaultConfigMap = {
  CI: {
    DEV: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_CI_DEV,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_CI_DEV,
    },
    UAT: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_CI_UAT,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_CI_UAT,
    },
    PRD: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_CI_PRD,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_CI_PRD,
    },
  },
  BI: {
    DEV: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_BI_DEV,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_BI_DEV,
    },
    UAT: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_BI_UAT,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_BI_UAT,
    },
    PRD: {
      documents: process.env.NEXT_PUBLIC_BATCH_DOCUMENTS_BI_PRD,
      models: process.env.NEXT_PUBLIC_BATCH_MODELS_BI_PRD,
    },
  },
};

function getApiGroup(apiType: ApiType): ApiGroup {
  return apiType.startsWith("ci") ? "CI" : "BI";
}

function normalizeJsonLikeArray(raw: string) {
  return raw.trim().replace(/,\s*]/g, "]").replace(/,\s*}/g, "}");
}

export function parseBatchList(raw: string | undefined): string[] {
  if (!raw) return [];

  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith("[")) {
    const normalized = normalizeJsonLikeArray(trimmed);

    try {
      const parsed = JSON.parse(normalized);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      const noBrackets = normalized.replace(/^\[/, "").replace(/]$/, "");
      return noBrackets
        .split(",")
        .map((item) =>
          item
            .trim()
            .replace(/^"(.*)"$/, "$1")
            .replace(/^'(.*)'$/, "$1"),
        )
        .filter(Boolean);
    }
  }

  return trimmed
    .split(/[\n,;]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getBatchDefaultLists(apiType: ApiType, environment: Environment) {
  const group = getApiGroup(apiType);
  const source = BATCH_DEFAULT_CONFIG[group][environment];

  return {
    documents: parseBatchList(source.documents),
    models: parseBatchList(source.models),
  };
}
