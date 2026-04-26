import { createFileRoute } from "@tanstack/react-router";
import { DashboardProvider } from "@/lib/dashboard/context";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OperationScreen } from "@/components/dashboard/screens/OperationScreen";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <DashboardProvider>
      <DashboardShell>
        <OperationScreen />
      </DashboardShell>
    </DashboardProvider>
  );
}
