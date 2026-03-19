import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border bg-background p-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Xango Test</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A autenticação foi desativada nesta instância.
        </p>
        <Button asChild className="mt-6 w-full">
          <Link href="/">Ir para a página inicial</Link>
        </Button>
      </div>
    </div>
  );
}
