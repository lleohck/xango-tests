import AppHeader from "@/components/shared/app-header";

export default function BatchTest() {
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
      <h1>Processamento em Lote</h1>
    </div>
  );
}
