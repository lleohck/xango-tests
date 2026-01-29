"use client";

import { useState } from "react";
import { useIamToken, type Environment } from "@/hooks/useIamToken";

export default function IamDemoPage() {
  const [env, setEnv] = useState<Environment>("DEV");
  const { accessToken, loading, error, refresh } = useIamToken(env);

  return (
    <div style={{ padding: 16 }}>
      <h1>Demo — Token da IAM</h1>

      <label>
        Ambiente:&nbsp;
        <select
          value={env}
          onChange={(e) => setEnv(e.target.value as Environment)}
        >
          <option value="DEV">DEV</option>
          <option value="UAT">UAT</option>
          <option value="PRD">PRD</option>
        </select>
      </label>

      <div style={{ marginTop: 12 }}>
        {loading && <p>Carregando token…</p>}
        {error && <p style={{ color: "crimson" }}>Erro: {error}</p>}
        {!loading && !error && (
          <>
            <p>
              <strong>Access Token:</strong>
            </p>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                background: "#0b1021",
                color: "#5effa0",
                padding: 12,
                borderRadius: 6,
              }}
            >
              {accessToken || "—"}
            </pre>
          </>
        )}
      </div>

      <button onClick={refresh} style={{ marginTop: 12 }}>
        Recarregar token (force refresh)
      </button>
    </div>
  );
}
