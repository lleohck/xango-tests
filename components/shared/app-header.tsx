"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, LogOut, Moon, Sun, User as UserIcon } from "lucide-react";

import { capitalizeWords, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useTheme } from "next-themes";

type NavItem = { label: string; href: string };

export default function AppHeader({
  logoHref = "/",
  logoSrc = "/logo.png",
  appName = "MyApp",
  menus = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Operações", href: "/operacoes" },
  ],
}: {
  logoHref?: string;
  logoSrc?: string;
  appName?: string;
  menus?: [NavItem, NavItem];
}) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();

  const userName = session?.user?.name ?? "Usuário";
  const userEmail = session?.user?.email ?? "";
  const avatarUrl = (session?.user as any)?.image as string | undefined;

  const initials = useMemo(() => {
    const base = (userName || "U").trim().split(".");
    return base
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("");
  }, [userName]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
        <Link href={logoHref} className="flex items-center gap-2">
          <Image
            src={logoSrc}
            alt={`${appName} logo`}
            width={100}
            height={30}
            priority
          />
          <span className="hidden text-xl font-semibold sm:inline">
            {appName}
          </span>
        </Link>

        <nav className="flex flex-1 items-center justify-center gap-1">
          {menus.map((item) => {
            const active = isActive(item.href);
            return (
              <Button
                key={item.href}
                variant={active ? "secondary" : "ghost"}
                asChild
                className={cn(
                  "h-9 px-3",
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <div className="text-sm font-medium leading-none">
              {status === "loading"
                ? "Carregando..."
                : capitalizeWords(userName.replace(".", " "))}
            </div>
            {userEmail ? (
              <div className="text-xs text-muted-foreground">{userEmail}</div>
            ) : null}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 gap-2 px-2"
                aria-label="Abrir menu do usuário"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="space-y-1">
                <div className="text-sm font-medium leading-none">
                  {userName}
                </div>
                {userEmail ? (
                  <div className="text-xs font-normal text-muted-foreground">
                    {userEmail}
                  </div>
                ) : null}
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun /> : <Moon />}
                {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
