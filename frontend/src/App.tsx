import { Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import RegisterCandidate from "./pages/RegisterCandidate";
import RegisterRecruiter from "./pages/RegisterRecruiter";
import MainLayout from "./components/MainLayout";
import CandidateHome from "./pages/candidate/Home";
import MCQTest from "./pages/candidate/MCQTest";
import RecruiterHome from "./pages/recruiter/Home";

// Missing pages will be filled iteratively. This establishes the spine.
function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register/candidate" element={<RegisterCandidate />} />
      <Route path="/register/recruiter" element={<RegisterRecruiter />} />

      {/* Protected Routes inside MainLayout */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard/candidate" element={<CandidateHome />} />
        <Route path="/dashboard/candidate/test" element={<MCQTest />} />

        <Route path="/dashboard/recruiter" element={<RecruiterHome />} />
        {/* <Route path="/dashboard/recruiter/post-job" element={<PostJob />} /> */}
      </Route>
    </Routes>
  );
}

export default App;
