import { Navigate, Route, Routes } from "react-router-dom";
import { AdminIngestionPage } from "../features/admin-ingestion/AdminIngestionPage";
import { ApplicationsPage } from "../features/applications/ApplicationsPage";
import { AdminRoute, ProtectedRoute } from "../features/auth/ProtectedRoute";
import { LoginPage } from "../features/auth/LoginPage";
import { SignupPage } from "../features/auth/SignupPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { FreshersHubPage } from "../features/freshers/FreshersHubPage";
import { JobDetailsPage } from "../features/jobs/JobDetailsPage";
import { JobsPage } from "../features/jobs/JobsPage";
import { ProfilePage } from "../features/profile/ProfilePage";
import { RecommendedJobsPage } from "../features/recommendations/RecommendedJobsPage";
import { ResumePage } from "../features/resume/ResumePage";
import { SavedJobsPage } from "../features/saved-jobs/SavedJobsPage";
import { AppLayout } from "./layout/AppLayout";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="freshers" element={<FreshersHubPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:id" element={<JobDetailsPage />} />
        <Route path="recommended" element={<RecommendedJobsPage />} />
        <Route path="resume" element={<ResumePage />} />
        <Route path="saved" element={<SavedJobsPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AppLayout />
          </AdminRoute>
        }
      >
        <Route path="ingestion" element={<AdminIngestionPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  );
}
