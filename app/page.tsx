import Link from "next/link";
import { ArrowRight, Layers, Scan } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AppHeader from "@/components/shared/app-header";

const cards = [
  {
    title: "Consulta Unica",
    href: "/unique",
    icon: Scan,
  },
  {
    title: "Processamento em Lote",
    href: "/batch",
    icon: Layers,
  },
];

export default function Home() {
  return (
    <div>
      <AppHeader
        appName="Xango API Testing"
        logoSrc="/serasa-logo.svg"
        menus={[
          { label: "Consulta Unica", href: "/unique" },
          { label: "Processamento em Lote", href: "/batch" },
        ]}
      />

      <div className="flex min-h-[calc(100svh-5rem)] items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.href}
                href={card.href}
                className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card className="group h-full min-h-[200px] border-border/70 transition-colors hover:border-primary/60 hover:bg-accent/40">
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-muted/60 text-foreground/80 transition-colors group-hover:border-primary/50 group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-xl md:text-2xl">
                      {card.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                      Acessar
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
