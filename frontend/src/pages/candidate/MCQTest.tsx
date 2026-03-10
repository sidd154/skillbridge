import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../../services/api";

export default function MCQTest() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get("session");

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [proctorWarning, setProctorWarning] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // WebSocket Reference
    const socketRef = useRef<WebSocket | null>(null);

    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) {
            setError("No test session found. Please upload a resume first.");
            setLoading(false);
            return;
        }

        const fetchQuestions = async () => {
            try {
                const response = await api.get(`/tests/${sessionId}`);
                setQuestions(response.data.questions);
            } catch (err: any) {
                setError(err.response?.data?.detail || "Failed to load test questions");
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [sessionId]);

    // Initialize WebSocket Connection for Proctoring
    useEffect(() => {
        if (!sessionId) return;

        const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
        const socket = new WebSocket(`${wsUrl}/proctoring/${sessionId}`);

        socket.onopen = () => {
            console.log("Proctoring WebSocket Connected");
        };

        socket.onerror = (error) => {
            console.error("Proctoring WebSocket Error:", error);
        };

        socketRef.current = socket;

        return () => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, [sessionId]);

    // Live Event Listeners
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setProctorWarning("⚠️ Tab switch detected! This violates proctoring rules.");

                // Transmit live event to LangGraph Agent 3
                if (socketRef.current?.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({
                        type: "tab_switch",
                        timestamp: new Date().toISOString()
                    }));
                }

                setTimeout(() => setProctorWarning(null), 5000);
            }
        };

        const handleCopyPaste = (e: ClipboardEvent) => {
            e.preventDefault();
            setProctorWarning("⚠️ Copy/Paste is disabled during proctored tests.");

            if (socketRef.current?.readyState === WebSocket.OPEN) {
                socketRef.current.send(JSON.stringify({
                    type: "clipboard_event",
                    timestamp: new Date().toISOString()
                }));
            }

            setTimeout(() => setProctorWarning(null), 5000);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        document.addEventListener("copy", handleCopyPaste);
        document.addEventListener("paste", handleCopyPaste);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            document.removeEventListener("copy", handleCopyPaste);
            document.removeEventListener("paste", handleCopyPaste);
        };
    }, []);

    const handleSelect = (option: string) => {
        setAnswers({ ...answers, [currentQuestion]: option });
    };

    const handleNext = async () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(curr => curr + 1);
        } else {
            setSubmitting(true);
            try {
                // Submit answers to be conceptually evaluated by the backend
                const response = await api.post(`/tests/${sessionId}/submit`, {
                    answers: answers
                });

                if (response.data.passport_issued) {
                    localStorage.setItem("hasPassport", "true");
                }
                navigate("/dashboard/candidate");
            } catch (err: any) {
                alert(err.response?.data?.detail || "Failed to submit test");
                setSubmitting(false);
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-muted">Loading AI-generated questions from your resume skills...</div>;
    if (error) return <div className="p-8 text-center text-error">{error}</div>;
    if (questions.length === 0) return <div className="p-8 text-center text-muted">No questions could be generated.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-8 relative">
            {/* Proctor Alert Overlay */}
            {proctorWarning && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-error text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-2 animate-in slide-in-from-top-4">
                    <span className="font-bold">Proctor Alert:</span> {proctorWarning}
                </div>
            )}

            <header className="flex justify-between items-center bg-surface/30 p-4 rounded-xl border border-white/5 backdrop-blur-md">
                <div>
                    <h1 className="text-xl font-bold text-white">Dynamic Skill Verification</h1>
                    <p className="text-muted text-sm mt-1">Generating from your resume...</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-error font-medium px-3 py-1.5 rounded-full border border-error/20 bg-error/10">
                        <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
                        Live Proctoring Active
                    </div>
                </div>
            </header>

            <motion.div
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-8 rounded-2xl"
            >
                <div className="text-sm text-primary-light font-medium mb-4 uppercase tracking-wider">
                    Question {currentQuestion + 1} of {questions.length}
                </div>
                <h2 className="text-2xl font-bold text-white mb-8 leading-relaxed">
                    {questions[currentQuestion].question || questions[currentQuestion].text}
                </h2>

                <div className="space-y-3">
                    {questions[currentQuestion].options.map((option: string, idx: number) => {
                        const isSelected = answers[currentQuestion] === option;
                        return (
                            <button
                                key={idx}
                                onClick={() => handleSelect(option)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${isSelected
                                    ? 'bg-primary/20 border-primary text-white scale-[1.01]'
                                    : 'bg-surface/50 border-white/5 text-muted hover:border-white/20 hover:bg-surface'
                                    }`}
                            >
                                <span className={`inline-block w-6 h-6 rounded-full border text-center text-sm leading-5 mr-3 ${isSelected ? 'border-primary bg-primary text-white' : 'border-white/20'}`}>
                                    {String.fromCharCode(65 + idx)}
                                </span>
                                {option}
                            </button>
                        )
                    })}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={submitting || !answers[currentQuestion]}
                        className="btn-primary px-8 py-3"
                    >
                        {submitting ? "Analyzing Results..." : (currentQuestion === questions.length - 1 ? "Submit Test" : "Next Question")}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
