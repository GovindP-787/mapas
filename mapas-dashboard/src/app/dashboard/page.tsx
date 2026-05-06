import { MissionOverviewCard, AIStatusCard } from "@/components/DashboardCards";
import { TelemetryPanel } from "@/components/TelemetryGrid";
import { AlertsPanel } from "@/components/AlertsPanel";

export default function Home() {
  return (
    <div className="h-full flex flex-col gap-6 relative">
      {/* Background gradient ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Top Row: Mission & AI Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        <div className="col-span-1 lg:col-span-2">
          <MissionOverviewCard />
        </div>
        <div className="col-span-1">
          <AIStatusCard />
        </div>
      </div>

      {/* Bottom Row: Telemetry & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 relative z-10 pb-6">
        <div className="col-span-1 lg:col-span-2">
          <TelemetryPanel />
        </div>
        <div className="col-span-1">
          <AlertsPanel />
        </div>
      </div>
    </div>
  );
}
