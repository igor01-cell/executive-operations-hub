import { createFileRoute } from "@tanstack/react-router";
import { DashboardProvider } from "@/lib/dashboard/context";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProductivityScreen } from "@/components/dashboard/screens/ProductivityScreen";

export const Route = createFileRoute("/produtividade")({
  component: ProductivityPage,
  head: () => ({
    meta: [
      { title: "Produtividade · Shopee RTS Dashboard" },
      {
        name: "description",
        content:
          "Análise de produtividade diária — volume por turno, tendência e heatmap.",
      },
    ],
  }),
});

function ProductivityPage() {
  return (
    <DashboardProvider>
      <DashboardShell>
        <ProductivityScreen />
      </DashboardShell>
    </DashboardProvider>
  );
}
