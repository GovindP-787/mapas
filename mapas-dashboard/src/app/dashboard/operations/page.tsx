import { PublicAnnouncementPanel } from "@/components/PublicAnnouncementPanel"

export default function OperationsPage() {
    return (
        <div className="flex flex-col gap-6 h-full overflow-hidden">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-slate-100">Operations Control</h1>
                <p className="text-slate-400 mt-2">Manage drone operations and public announcements</p>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                <PublicAnnouncementPanel />
            </div>
        </div>
    )
}
