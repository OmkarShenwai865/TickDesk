import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import Assets from "./pages/assets/Assets";
import AssetDetail from "./pages/assets/AssetDetail";
import Tickets from "./pages/tickets/Tickets";
import TicketDetail from "./pages/tickets/TicketDetail";

import ProtectedRoute from "./components/common/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import Users from "./pages/users/Users";
import Departments from "./pages/departments/Departments";
import Reports from "./pages/reports/Reports";
import KnowledgeBase from "./pages/knowledge-base/KnowledgeBase";
import Settings from "./pages/settings/Settings";
import General from "./pages/settings/General";
import AccessSecurity from "./pages/settings/AccessSecurity";
import Helpdesk from "./pages/settings/Helpdesk";
import Notifications from "./pages/settings/Notifications";
import SystemSettings from "./pages/settings/System";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/"      element={<Login />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/assets" element={<Assets />} />
                    <Route path="/assets/:id" element={<AssetDetail />} />
                    <Route path="/tickets" element={<Tickets />} />
                    <Route path="/tickets/:id" element={<TicketDetail />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/departments" element={<Departments />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/knowledge-base" element={<KnowledgeBase />} />
                    <Route path="/settings" element={<Settings />}>
                      <Route index              element={<Navigate to="/settings/general" replace />} />
                      <Route path="general"         element={<General />} />
                      <Route path="access-security" element={<AccessSecurity />} />
                      <Route path="helpdesk"        element={<Helpdesk />} />
                      <Route path="notifications"   element={<Notifications />} />
                      <Route path="system"          element={<SystemSettings />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;