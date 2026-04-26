import { createFileRoute } from "@tanstack/react-router";
import { DashboardProvider } from "@/lib/dashboard/context";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SalvadosScreen } from "@/components/dashboard/screens/SalvadosScreen";

export const Route = createFileRoute("/salvados")({
  component: SalvadosPage,
  head: () => ({
    meta: [
      { title: "Salvados · Shopee RTS Dashboard" },
      {
        name: "description",
        content: "Buffer de Salvados — KPIs, distribuição por perfil e categoria.",
      },
    ],
  }),
});

function SalvadosPage() {
  return (
    <DashboardProvider>
      <DashboardShell>
        <SalvadosScreen />
      </DashboardShell>
    </DashboardProvider>
  );
}
