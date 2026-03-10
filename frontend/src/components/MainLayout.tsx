import { Outlet, useLocation } from "react-router-dom";

export default function MainLayout() {
    const location = useLocation();
    // Mock auth check until Supabase hook is wired
    const isAuthenticated = false;

    if (!isAuthenticated && location.pathname !== "/") {
        // return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar Mock */}
            <aside className="w-64 border-r border-white/10 bg-surface/30 backdrop-blur-md hidden md:flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-2 mb-8">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-accent" />
                        <span className="font-bold">SkillBridge</span>
                    </div>
                    <nav className="space-y-2">
                        {/* Nav links injected based on role later */}
                        <div className="px-3 py-2 rounded-md bg-white/5 text-sm font-medium text-white">Dashboard</div>
                        <div className="px-3 py-2 rounded-md text-sm font-medium text-muted hover:bg-white/5 hover:text-white transition-colors cursor-pointer">Profile</div>
                    </nav>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <header className="h-16 border-b border-white/10 bg-surface/30 backdrop-blur-md flex items-center justify-between px-6 z-10 relative">
                    <h2 className="text-sm font-medium text-muted">Workspace</h2>
                    <button className="text-sm text-muted hover:text-white">Sign Out</button>
                </header>
                <div className="flex-1 overflow-y-auto p-6 relative">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
