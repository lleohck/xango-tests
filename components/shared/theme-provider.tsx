// components/theme-provider.tsx
"use client";

import * as React from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme,
} from "next-themes";

type SerasaTheme = "serasa-light" | "serasa-dark";

function normalizeTheme(theme?: string): SerasaTheme {
  return theme === "serasa-dark" || theme === "dark"
    ? "serasa-dark"
    : "serasa-light";
}

function ThemeNormalizer() {
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    if (!theme) return;
    const normalizedTheme = normalizeTheme(theme);
    if (theme !== normalizedTheme) {
      setTheme(normalizedTheme);
    }
  }, [theme, setTheme]);

  return null;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      {...props}
      attribute="class"
      defaultTheme="serasa-light"
      enableSystem={false}
      themes={["serasa-light", "serasa-dark"]}
    >
      <ThemeNormalizer />
      {children}
    </NextThemesProvider>
  );
}
