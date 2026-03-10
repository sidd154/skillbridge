import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";

export default function RecruiterHome() {
    const [jobs, setJobs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState([
        { label: "Active Jobs", value: 0 },
        { label: "Total Applicants", value: 0 },
        { label: "Interviews Completed", value: 0 },
        { label: "Pending Reviews", value: 0 },
    ]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get("/recruiters/jobs");
                const fetchedJobs = response.data.jobs || [];
                setJobs(fetchedJobs);

                // Update basic stats from the fetched jobs
                setStats([
                    { label: "Active Jobs", value: fetchedJobs.length },
                    { label: "Total Applicants", value: "Real-time" }, // Placeholder for complex count
                    { label: "Interviews Completed", value: "Ready" },
                    { label: "Pending Reviews", value: "Checking" },
                ]);
            } catch (err) {
                console.error("Failed to fetch recruiter jobs", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in relative">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Recruiter Dashboard</h1>
                    <p className="text-muted mt-1">Manage jobs, view verified talent, and review AI interviews.</p>
                </div>
                <div className="flex gap-3">
                    <button className="btn-outline px-4 py-2 text-sm bg-surface/50">Search Talent</button>
                    <Link to="/dashboard/recruiter/post-job" className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Post New Job
                    </Link>
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

                {loading ? (
                    <div className="text-muted text-center py-12">Loading your active job postings...</div>
                ) : jobs.length === 0 ? (
                    <div className="glass p-12 rounded-xl text-center">
                        <p className="text-muted mb-4">You haven't posted any jobs yet.</p>
                        <button className="btn-primary px-6 py-2">Create Your First Job Posting</button>
                    </div>
                ) : (
                    jobs.map((job, i) => (
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
                                    <p className="text-sm text-muted mt-1">{job.job_type} • {job.location}</p>
                                </div>

                                {/* Pipeline Visual — Realistically these would be aggregations from the 'applications' table */}
                                <div className="flex-1 flex items-center gap-2 w-full max-w-2xl bg-surface/30 p-3 rounded-lg">
                                    <div className="flex-1 text-center">
                                        <div className="text-lg font-bold text-white">Live</div>
                                        <div className="text-[10px] text-muted uppercase tracking-wider mt-1">Status</div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex-1 text-center">
                                        <div className="text-lg font-bold text-white">-</div>
                                        <div className="text-[10px] text-muted uppercase tracking-wider mt-1">Applicants</div>
                                    </div>
                                    <div className="w-px h-8 bg-white/10" />
                                    <div className="flex-1 text-center">
                                        <div className="text-lg font-bold text-white">AI</div>
                                        <div className="text-[10px] text-muted uppercase tracking-wider mt-1">Screening</div>
                                    </div>
                                </div>

                                <div className="flex justify-end min-w-[100px]">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="m9 18 6-6-6-6" /></svg>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
