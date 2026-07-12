import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login          from "./pages/auth/Login";
import Register       from "./pages/auth/Register";
import AcceptInvite   from "./pages/auth/AcceptInvite";
import Landing        from "./pages/landing/Landing";
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
import Profile from "./pages/profile/Profile";
import Platform from "./pages/platform/Platform";
import PlatformDashboard from "./pages/platform/PlatformDashboard";
import CompanyDetail from "./pages/platform/CompanyDetail";
import Announcements from "./pages/platform/Announcements";
import PlatformReports from "./pages/platform/Reports";
import Settings from "./pages/settings/Settings";
import General from "./pages/settings/General";
import AccessSecurity from "./pages/settings/AccessSecurity";
// Hidden until these have real backend endpoints behind them:
// import Helpdesk from "./pages/settings/Helpdesk";
// import Notifications from "./pages/settings/Notifications";
// import SystemSettings from "./pages/settings/System";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/"         element={<Landing />} />
                <Route path="/login"    element={<Login />} />
                <Route path="/employee-login" element={<Login expectedRole="employee" title="Employee Login" />} />
                <Route path="/support-agent-login" element={<Login expectedRole="agent" title="Support Agent Login" />} />
                <Route path="/register" element={<Register />} />
                <Route path="/accept-invite/:token" element={<AcceptInvite />} />

                {/* Shared App Routes */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard"    element={<ProtectedRoute roles={["admin","agent"]}><Dashboard /></ProtectedRoute>} />
                    <Route path="/assets"       element={<ProtectedRoute roles={["admin","agent","employee"]}><Assets /></ProtectedRoute>} />
                    <Route path="/assets/:id"   element={<ProtectedRoute roles={["admin","agent","employee"]}><AssetDetail /></ProtectedRoute>} />
                    <Route path="/tickets"      element={<Tickets />} />
                    <Route path="/tickets/:id"  element={<TicketDetail />} />
                    <Route path="/users"        element={<ProtectedRoute roles={["admin"]}><Users /></ProtectedRoute>} />
                    <Route path="/departments"  element={<ProtectedRoute roles={["admin"]}><Departments /></ProtectedRoute>} />
                    <Route path="/reports"      element={<ProtectedRoute roles={["admin","agent"]}><Reports /></ProtectedRoute>} />
                    <Route path="/knowledge-base" element={<KnowledgeBase />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/platform" element={<ProtectedRoute roles={["superadmin"]}><PlatformDashboard /></ProtectedRoute>} />
                    <Route path="/platform/companies" element={<ProtectedRoute roles={["superadmin"]}><Platform /></ProtectedRoute>} />
                    <Route path="/platform/companies/:id" element={<ProtectedRoute roles={["superadmin"]}><CompanyDetail /></ProtectedRoute>} />
                    <Route path="/platform/announcements" element={<ProtectedRoute roles={["superadmin"]}><Announcements /></ProtectedRoute>} />
                    <Route path="/platform/reports" element={<ProtectedRoute roles={["superadmin"]}><PlatformReports /></ProtectedRoute>} />
                    <Route path="/settings"     element={<ProtectedRoute roles={["admin"]}><Settings /></ProtectedRoute>}>
                      <Route index              element={<Navigate to="/settings/general" replace />} />
                      <Route path="general"         element={<General />} />
                      <Route path="access-security" element={<AccessSecurity />} />
                      {/* Hidden until these have real backend endpoints behind them: */}
                      {/* <Route path="helpdesk"      element={<Helpdesk />} /> */}
                      {/* <Route path="notifications" element={<Notifications />} /> */}
                      {/* <Route path="system"        element={<SystemSettings />} /> */}
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
