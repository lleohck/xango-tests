"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [key: string]: Json };

function isObject(v: unknown): v is Record<string, Json> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function isArray(v: unknown): v is Json[] {
  return Array.isArray(v);
}

function Primitive({ value }: { value: Json }) {
  if (value === null) {
    return <span className="text-muted-foreground">null</span>;
  }
  if (typeof value === "string") {
    return (
      <span className="text-chart-1">
        &quot;{value}&quot;
      </span>
    );
  }
  if (typeof value === "number") {
    return <span className="text-chart-2">{value}</span>;
  }
  if (typeof value === "boolean") {
    return <span className="text-chart-3">{String(value)}</span>;
  }
  return null;
}

function Collapsible({
  label,
  children,
  defaultOpen,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center gap-2 rounded-md px-1 py-0.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      >
        <span className="select-none leading-none">
          {open ? "▾" : "▸"}
        </span>
        {label}
      </button>
      {open ? <div>{children}</div> : null}
    </div>
  );
}

function Node({
  value,
  name,
  level,
  defaultOpenDepth,
}: {
  value: Json;
  name?: string;
  level: number;
  defaultOpenDepth: number;
}) {
  const padStyle = { paddingLeft: `${level * 14}px` };

  // Primitive
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return (
      <div style={padStyle} className="whitespace-pre">
        {name !== undefined ? (
          <>
            <span className="text-chart-5">{name}</span>
            <span className="text-muted-foreground">: </span>
          </>
        ) : null}
        <Primitive value={value} />
      </div>
    );
  }

  // Array
  if (isArray(value)) {
    const openByDefault = level < defaultOpenDepth;
    const count = value.length;

    const label = (
      <span>
        {name !== undefined ? (
          <>
            <span className="text-chart-5">{name}</span>
            <span className="text-muted-foreground">: </span>
          </>
        ) : null}
        <span className="text-muted-foreground">Array</span>{" "}
        <span className="text-muted-foreground/80">({count})</span>
      </span>
    );

    return (
      <div style={padStyle}>
        <Collapsible label={label} defaultOpen={openByDefault}>
          <div className="space-y-1">
            <div style={{ paddingLeft: 14 }} className="text-muted-foreground">
              <span>[</span>
            </div>

            {value.map((item, idx) => (
              <Node
                key={idx}
                value={item}
                name={`[${idx}]`}
                level={level + 1}
                defaultOpenDepth={defaultOpenDepth}
              />
            ))}

            <div style={{ paddingLeft: 14 }} className="text-muted-foreground">
              <span>]</span>
            </div>
          </div>
        </Collapsible>
      </div>
    );
  }

  // Object
  if (isObject(value)) {
    const openByDefault = level < defaultOpenDepth;
    const entries = Object.entries(value);
    const count = entries.length;

    const label = (
      <span>
        {name !== undefined ? (
          <>
            <span className="text-chart-5">{name}</span>
            <span className="text-muted-foreground">: </span>
          </>
        ) : null}
        <span className="text-muted-foreground">Object</span>{" "}
        <span className="text-muted-foreground/80">({count})</span>
      </span>
    );

    return (
      <div style={padStyle}>
        <Collapsible label={label} defaultOpen={openByDefault}>
          <div className="space-y-1">
            <div style={{ paddingLeft: 14 }} className="text-muted-foreground">
              <span>{"{"}</span>
            </div>

            {entries.map(([k, v]) => (
              <Node
                key={k}
                value={v}
                name={k}
                level={level + 1}
                defaultOpenDepth={defaultOpenDepth}
              />
            ))}

            <div style={{ paddingLeft: 14 }} className="text-muted-foreground">
              <span>{"}"}</span>
            </div>
          </div>
        </Collapsible>
      </div>
    );
  }

  return null;
}

function normalizeToJson(value: unknown): Json {
  // Se vier string/erro/etc, embrulha para exibir de forma consistente
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeToJson(item));
  }
  if (typeof value === "object" && value !== null) {
    const obj: Record<string, Json> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      obj[k] = normalizeToJson(v);
    }
    return obj;
  }

  return { value: String(value) };
}

export default function JsonViewer({
  value,
  className,
  defaultOpenDepth = 2,
}: {
  value: unknown;
  className?: string;
  defaultOpenDepth?: number;
}) {
  const json = normalizeToJson(value);

  return (
    <div
      className={cn(
        "max-h-[520px] overflow-auto rounded-lg border border-border/70 bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground",
        className,
      )}
    >
      <Node value={json} level={0} defaultOpenDepth={defaultOpenDepth} />
    </div>
  );
}
