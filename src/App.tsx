import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./state/auth";
import { PrefsProvider } from "./state/prefs";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import SidebarLayout from "./components/SidebarLayout";
import HomeRedirect from "./components/HomeRedirect";
import LoginPage from "./pages/LoginPage";
import AboutPage from "./pages/AboutPage";
import HelpPage from "./pages/HelpPage";
import AccountPage from "./pages/AccountPage";
import UsersPage from "./pages/UsersPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import TasksPage from "./pages/TasksPage";
import TaskCreatePage from "./pages/TaskCreatePage";
import TaskPage from "./pages/TaskPage";
import VersionPage from "./pages/VersionPage";
import EditPage from "./pages/EditPage";
import NotFoundPage from "./pages/NotFoundPage";
import { isAdmin } from "./lib/roles";

export default function App() {
  return (
    <PrefsProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <SidebarLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<HomeRedirect />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route
              path="users"
              element={
                <RoleRoute allow={isAdmin}>
                  <UsersPage />
                </RoleRoute>
              }
            />
            <Route
              path="activity"
              element={
                <RoleRoute allow={isAdmin}>
                  <ActivityLogPage />
                </RoleRoute>
              }
            />
            <Route
              path="tasks"
              element={
                <RoleRoute allow={(role) => !isAdmin(role)}>
                  <TasksPage />
                </RoleRoute>
              }
            />
            <Route
              path="tasks/new"
              element={
                <RoleRoute allow={(role) => !isAdmin(role)}>
                  <TaskCreatePage />
                </RoleRoute>
              }
            />
            <Route
              path="tasks/:id"
              element={
                <RoleRoute allow={(role) => !isAdmin(role)}>
                  <TaskPage />
                </RoleRoute>
              }
            />
            <Route
              path="versions/:id"
              element={
                <RoleRoute allow={(role) => !isAdmin(role)}>
                  <VersionPage />
                </RoleRoute>
              }
            />
            <Route
              path="edits/:id"
              element={
                <RoleRoute allow={(role) => !isAdmin(role)}>
                  <EditPage />
                </RoleRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </PrefsProvider>
  );
}
