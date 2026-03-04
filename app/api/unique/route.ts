// app/api/unique/route.ts
import { NextResponse } from "next/server";
import { Agent } from "undici";

import { fetchIamToken } from "@/server/auth/iam";
import type { ApiType, Environment } from "@/types/shared";
import { buildRequest, getBaseUrl } from "@/server/api/registry";

export const runtime = "nodejs";

const insecureDispatcher = new Agent({
  connect: {
    rejectUnauthorized: false,
  },
});

function safeJson(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function serializeError(e: unknown) {
  if (!isRecord(e)) {
    return {
      name: undefined,
      message: String(e ?? "Unknown error"),
      code: undefined,
      cause: undefined,
    };
  }

  const cause = isRecord(e.cause)
    ? {
        name:
          typeof e.cause.name === "string" ? e.cause.name : undefined,
        message:
          typeof e.cause.message === "string" ? e.cause.message : undefined,
        code: typeof e.cause.code === "string" ? e.cause.code : undefined,
        hostname:
          typeof e.cause.hostname === "string" ? e.cause.hostname : undefined,
        port:
          typeof e.cause.port === "number" ? e.cause.port : undefined,
      }
    : undefined;

  return {
    name: typeof e.name === "string" ? e.name : undefined,
    message: typeof e.message === "string" ? e.message : "fetch failed",
    code: typeof e.code === "string" ? e.code : undefined,
    cause,
  };
}

type UniqueRouteInput = {
  environment: Environment;
  apiType: ApiType;
  payload: Record<string, unknown>;
};

export async function POST(req: Request) {
  const start = Date.now();

  try {
    const { environment, apiType, payload } =
      (await req.json()) as UniqueRouteInput;

    const baseUrl = getBaseUrl(apiType, environment);
    const built = buildRequest(apiType, baseUrl, payload);

    const token = await fetchIamToken(environment);

    const headers = {
      ...built.headers,
      Authorization: `Bearer ${token.accessToken}`,
    };

    const requestDebug = {
      url: built.url,
      method: built.method,
      headers: { ...headers, Authorization: "Bearer ********" },
      body: built.body ?? null,
    };

    const fetchOptions: RequestInit & { dispatcher?: Agent } = {
      method: built.method,
      headers,
      body: built.body ? JSON.stringify(built.body) : undefined,
      cache: "no-store",
      dispatcher: insecureDispatcher,
    };

    const res = await fetch(built.url, fetchOptions);

    const elapsedMs = Date.now() - start;

    const text = await res.text();
    const parsed = safeJson(text);

    const meta = {
      ok: res.ok,
      status: res.status,
      elapsedMs,
      url: built.url,
      method: built.method,
      timestamp: new Date().toISOString(),
      request: requestDebug,
    };

    if (!res.ok) {
      return NextResponse.json({ meta, error: parsed }, { status: res.status });
    }

    return NextResponse.json({ meta, data: parsed }, { status: 200 });
  } catch (err: unknown) {
    const elapsedMs = Date.now() - start;
    const message = err instanceof Error ? err.message : "fetch failed";

    return NextResponse.json(
      {
        meta: {
          ok: false,
          status: null,
          elapsedMs,
          timestamp: new Date().toISOString(),
        },
        error: {
          message,
          details: serializeError(err),
        },
      },
      { status: 500 },
    );
  }
}
