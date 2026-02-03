"use client";

import { useActionState } from "react";
import { fetchBiDataAction, type ActionState } from "./actions";

const initialState: ActionState | null = null;

export default function BiDataForm() {
  const [state, action, isPending] = useActionState(fetchBiDataAction, initialState);

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>BI Data - Consulta</h1>

      <form action={action} style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, alignItems: "center" }}>
          <label htmlFor="env">env</label>
          <select id="env" name="env" defaultValue="DEV">
            <option value="DEV">DEV</option>
            <option value="UAT">UAT</option>
            <option value="PRD">PRD</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, alignItems: "center" }}>
          <label htmlFor="version">version</label>
          <select id="version" name="version" defaultValue="v2">
            <option value="v2">v2</option>
            <option value="v3">v3</option>
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, alignItems: "center" }}>
          <label htmlFor="model">model</label>
          <input id="model" name="model" placeholder="ex: my-model" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, alignItems: "center" }}>
          <label htmlFor="ndoc">ndoc</label>
          <input id="ndoc" name="ndoc" placeholder="ex: 12345678900" />
        </div>

        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" name="explainer" />
            explainer
          </label>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" name="is_canary" />
            is_canary
          </label>
        </div>

        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid #ddd",
            background: isPending ? "#eee" : "#111",
            color: isPending ? "#666" : "#fff",
            cursor: isPending ? "not-allowed" : "pointer",
            width: 160,
          }}
        >
          {isPending ? "Consultando..." : "Consultar"}
        </button>
      </form>

      <section style={{ marginTop: 24 }}>
        {state?.ok === false && (
          <div style={{ padding: 12, borderRadius: 10, background: "#ffecec", color: "#8a1f1f" }}>
            <strong>Erro:</strong> {state.error}
            {state.details ? (
              <pre style={{ marginTop: 10, background: "#fff", padding: 10, borderRadius: 8, overflowX: "auto" }}>
                {JSON.stringify(state.details, null, 2)}
              </pre>
            ) : null}
          </div>
        )}

        <h2 style={{ fontSize: 16, marginTop: 18 }}>Resultado</h2>
        <pre style={{ background: "#0b1020", color: "#e8e8e8", padding: 16, borderRadius: 12, overflowX: "auto" }}>
          {state?.ok ? JSON.stringify(state.data, null, 2) : "Sem resultado ainda."}
        </pre>
      </section>
    </main>
  );
}
