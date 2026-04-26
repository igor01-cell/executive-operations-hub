import { createFileRoute } from "@tanstack/react-router";
import { DashboardProvider } from "@/lib/dashboard/context";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MapScreen } from "@/components/dashboard/screens/MapScreen";

export const Route = createFileRoute("/mapa")({
  component: MapPage,
  head: () => ({
    meta: [
      { title: "Mapa Visual · Shopee RTS Dashboard" },
      {
        name: "description",
        content:
          "Mapa físico do buffer 10×7 — posições ocupadas, status de risco e detalhes de cada gaiola.",
      },
    ],
  }),
});

function MapPage() {
  return (
    <DashboardProvider>
      <DashboardShell>
        <MapScreen />
      </DashboardShell>
    </DashboardProvider>
  );
}
