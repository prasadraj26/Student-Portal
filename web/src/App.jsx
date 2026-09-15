import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login          from "./pages/Login";
import Dashboard      from "./pages/Dashboard";
import Students       from "./pages/Students";
import Classes        from "./pages/Classes";
import Subjects       from "./pages/Subjects";
import Exams          from "./pages/Exams";
import ExamCreate     from "./pages/ExamCreate";
import ExamDetail     from "./pages/ExamDetail";
import ExamQuestions  from "./pages/ExamQuestions";
import Results        from "./pages/Results";
import ResultDetail   from "./pages/ResultDetail";
import Reports        from "./pages/Reports";
import StudentReport  from "./pages/StudentReport";

/* Simple Settings stub */
function Settings() {
  const { currentUser } = useAuth();
  return (
    <div>
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      <div className="card" style={{ maxWidth: 480 }}>
        <div className="card-header"><h3>Account</h3></div>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "var(--text-muted)" }}>Email</span>
            <strong>{currentUser?.email}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
            <span style={{ color: "var(--text-muted)" }}>Role</span>
            <span className="badge badge-primary">Teacher</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"      element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        {/* Protected — all inside Layout (sidebar + header) */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard"                         element={<Dashboard />} />
          <Route path="/students"                          element={<Students />} />
          <Route path="/classes"                           element={<Classes />} />
          <Route path="/subjects"                          element={<Subjects />} />
          <Route path="/exams"                             element={<Exams />} />
          <Route path="/exams/create"                      element={<ExamCreate />} />
          <Route path="/exams/:id"                         element={<ExamDetail />} />
          <Route path="/exams/:id/edit"                    element={<ExamCreate />} />
          <Route path="/exams/:id/questions"               element={<ExamQuestions />} />
          <Route path="/results"                           element={<Results />} />
          <Route path="/results/:examId"                   element={<ResultDetail />} />
          <Route path="/reports"                           element={<Reports />} />
          <Route path="/reports/student/:studentId"        element={<StudentReport />} />
          <Route path="/settings"                          element={<Settings />} />

          {/* Fallback within protected area */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;