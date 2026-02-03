export type Environment = "DEV" | "UAT" | "PRD";

export type ApiType =
  | "bi-data"
  | "ci-data"
  | "bi-orchestrator"
  | "ci-orchestrator";

// como você quer apenas "omit" ou "true" via switch:
// boolean resolve perfeitamente (false = omit)
export type CanaryBool = boolean;