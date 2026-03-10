import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function MCQTest() {
    const navigate = useNavigate();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [proctorWarning, setProctorWarning] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const questions = [
        { id: 1, text: "Which hook is used to manage local component state in React?", options: ["useEffect", "useState", "useContext", "useReducer"] },
        { id: 2, text: "In Python, which built-in data structure is unordered and contains unique elements?", options: ["List", "Dictionary", "Set", "Tuple"] },
        { id: 3, text: "What does the 'A' in ACID properties of databases stand for?", options: ["Atomicity", "Availability", "Automation", "Architecture"] }
    ];

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setProctorWarning("⚠️ Tab switch detected! This violates proctoring rules.");
                setTimeout(() => setProctorWarning(null), 5000);
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    const handleSelect = (option: string) => {
        setAnswers({ ...answers, [currentQuestion]: option });
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(curr => curr + 1);
        } else {
            setSubmitting(true);
            setTimeout(() => {
                localStorage.setItem("hasPassport", "true");
                navigate("/dashboard/candidate");
            }, 2000);
        }
    };

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
                    {questions[currentQuestion].text}
                </h2>

                <div className="space-y-3">
                    {questions[currentQuestion].options.map((option, idx) => {
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
