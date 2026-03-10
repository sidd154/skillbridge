import { motion } from "framer-motion";

export default function RecruiterHome() {
    // Mock data for UI scaffolding
    const stats = [
        { label: "Active Jobs", value: 3 },
        { label: "Total Applicants", value: 124 },
        { label: "Interviews Completed", value: 12 },
        { label: "Pending Reviews", value: 5 },
    ];

    const recentJobs = [
        { id: "1", title: "Senior React Developer", applicants: 45, pipeline: { applied: 20, tested: 15, interviewing: 8, reviewed: 2 } },
        { id: "2", title: "Python Backend Engineer", applicants: 32, pipeline: { applied: 10, tested: 12, interviewing: 8, reviewed: 2 } },
        { id: "3", title: "Full Stack Developer", applicants: 47, pipeline: { applied: 25, tested: 10, interviewing: 10, reviewed: 2 } },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Recruiter Dashboard</h1>
                    <p className="text-muted mt-1">Manage jobs, view verified talent, and review AI interviews.</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-outline px-4 py-2 text-sm bg-surface/50">Search Talent</button>
                    <button className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Post New Job
                    </button>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass p-5 rounded-xl border border-white/5"
                    >
                        <p className="text-sm text-muted font-medium mb-1">{stat.label}</p>
                        <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
                    </motion.div>
                ))}
            </div>

            {/* Active Jobs Pipeline */}
            <div className="mt-8 space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Active Postings</h2>

                {recentJobs.map((job, i) => (
                    <motion.div
                        key={job.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.3 }}
                        className="glass p-6 rounded-xl border border-white/5 hover:border-primary/30 transition-colors cursor-pointer block"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="min-w-[200px]">
                                <h3 className="text-lg font-bold text-white">{job.title}</h3>
                                <p className="text-sm text-muted mt-1">{job.applicants} total applicants</p>
                            </div>

                            {/* Pipeline Visual */}
                            <div className="flex-1 flex items-center gap-2 w-full max-w-2xl bg-surface/30 p-3 rounded-lg">
                                <div className="flex-1 text-center">
                                    <div className="text-lg font-bold text-white">{job.pipeline.applied}</div>
                                    <div className="text-[10px] text-muted uppercase tracking-wider mt-1">Applied</div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex-1 text-center">
                                    <div className="text-lg font-bold text-white">{job.pipeline.tested}</div>
                                    <div className="text-[10px] text-muted uppercase tracking-wider mt-1">MCQ Done</div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex-1 text-center">
                                    <div className="text-lg font-bold text-white">{job.pipeline.interviewing}</div>
                                    <div className="text-[10px] text-muted uppercase tracking-wider mt-1">In Bot Interview</div>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex-1 text-center relative group">
                                    <div className="absolute top-0 right-1/4 w-2 h-2 rounded-full bg-error animate-pulse" />
                                    <div className="text-lg font-bold text-accent">{job.pipeline.reviewed}</div>
                                    <div className="text-[10px] text-accent uppercase tracking-wider mt-1">Review Ready</div>
                                </div>
                            </div>

                            <div className="flex justify-end min-w-[100px]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="m9 18 6-6-6-6" /></svg>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
