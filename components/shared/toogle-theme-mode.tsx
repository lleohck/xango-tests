// components/toggle-theme-mode.tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // Evita mismatch na hidratação (next-themes resolve tema no client)
  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Alternar tema</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={setTheme}
        >
          {/* Fallback padrão */}
          <DropdownMenuRadioItem value="light">
            Light (fallback)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            Dark (fallback)
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator />

          {/* Temas da marca */}
          <DropdownMenuRadioItem value="serasa-light">
            Serasa Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="serasa-dark">
            Serasa Dark
          </DropdownMenuRadioItem>

          <DropdownMenuSeparator />

          <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
