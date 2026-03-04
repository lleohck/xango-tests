import { ApiType, Environment } from "@/types/shared";

export const API_DISPLAY_NAME_BY_TYPE: Record<ApiType, string> = {
  "bi-data": "experian-score-bi-data-api",
  "ci-data": "experian-score-ci-data-api",
  "bi-orchestrator": "experian-score-cs-bi-orchestrator",
  "ci-orchestrator": "experian-srv-chronos-orchestrator",
};

export const ENVIRONMENT_DISPLAY_NAME: Record<Environment, string> = {
  PRD: "Produção",
  UAT: "Homologação",
  DEV: "Desenvolvimento",
};

const BATCH_FILENAME_REGEX =
  /^([A-Z-]+)_(DEV|UAT|PRD)_batch_result_\d{2}-\d{2}-\d{4}_\d{2}-\d{2}-\d{2}\.csv$/i;

const API_CODE_TO_TYPE: Record<string, ApiType> = {
  "BI-DATA": "bi-data",
  "CI-DATA": "ci-data",
  "BI-ORCHESTRATOR": "bi-orchestrator",
  "CI-ORCHESTRATOR": "ci-orchestrator",
};

function normalizeApiCode(raw: string) {
  return raw.trim().replace(/_/g, "-").replace(/\s+/g, "-");
}

export function resolveApiType(
  value: string | ApiType | null | undefined,
): ApiType | null {
  if (!value) return null;

  const normalized = normalizeApiCode(value);
  const lower = normalized.toLowerCase();
  if (lower in API_DISPLAY_NAME_BY_TYPE) {
    return lower as ApiType;
  }

  const upper = normalized.toUpperCase();
  return API_CODE_TO_TYPE[upper] ?? null;
}

export function getApiDisplayName(value: string | ApiType | null | undefined) {
  if (!value) return "N/A";
  const apiType = resolveApiType(value);
  if (apiType) return API_DISPLAY_NAME_BY_TYPE[apiType];
  return value.trim();
}

export function resolveEnvironment(
  value: string | Environment | null | undefined,
): Environment | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  if (upper === "DEV" || upper === "UAT" || upper === "PRD") return upper;
  return null;
}

export function getEnvironmentDisplayName(
  value: string | Environment | null | undefined,
) {
  const env = resolveEnvironment(value);
  if (!env) return value?.trim() || "N/A";
  return ENVIRONMENT_DISPLAY_NAME[env];
}

export type BatchFileMetadata = {
  apiCode: string | null;
  environmentCode: Environment | null;
};

export function parseBatchResultFileName(fileName: string): BatchFileMetadata {
  const trimmed = fileName.trim();
  const strictMatch = trimmed.match(BATCH_FILENAME_REGEX);

  if (strictMatch) {
    const [, apiCodeRaw, envRaw] = strictMatch;
    return {
      apiCode: normalizeApiCode(apiCodeRaw).toUpperCase(),
      environmentCode: envRaw.toUpperCase() as Environment,
    };
  }

  const fallbackTokens = trimmed.replace(/\.csv$/i, "").split("_");
  const apiCode = fallbackTokens[0]?.trim();
  const environmentCode = resolveEnvironment(fallbackTokens[1]);

  return {
    apiCode: apiCode ? normalizeApiCode(apiCode).toUpperCase() : null,
    environmentCode,
  };
}

function mergeRawValue(left: string | null, right: string | null) {
  if (left && right) return left === right ? left : `${left} / ${right}`;
  return left ?? right ?? "N/A";
}

function mergeMappedValue(
  left: string | null,
  right: string | null,
  mapper: (value: string | null) => string,
) {
  if (left && right) {
    if (left === right) return mapper(left);
    return `${mapper(left)} / ${mapper(right)}`;
  }
  return mapper(left ?? right);
}

export function mergeBatchFileMetadata(
  beforeFile: File | null,
  afterFile: File | null,
) {
  const beforeMeta = beforeFile
    ? parseBatchResultFileName(beforeFile.name)
    : { apiCode: null, environmentCode: null };
  const afterMeta = afterFile
    ? parseBatchResultFileName(afterFile.name)
    : { apiCode: null, environmentCode: null };

  const apiCode = mergeRawValue(beforeMeta.apiCode, afterMeta.apiCode);
  const environmentCode = mergeRawValue(
    beforeMeta.environmentCode,
    afterMeta.environmentCode,
  );

  const applicationName = mergeMappedValue(
    beforeMeta.apiCode,
    afterMeta.apiCode,
    getApiDisplayName,
  );
  const environmentName = mergeMappedValue(
    beforeMeta.environmentCode,
    afterMeta.environmentCode,
    getEnvironmentDisplayName,
  );

  return {
    apiCode,
    environmentCode,
    applicationName,
    environmentName,
  };
}
