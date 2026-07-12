import { useState, useEffect } from "react";
import { FiUser, FiLock } from "react-icons/fi";
import api from "../../services/api";
import "../settings/Settings.css";

const EMPTY_INFO = { firstName: "", lastName: "", email: "", username: "", role: "" };
const EMPTY_PASSWORD = { current: "", next: "", confirm: "" };

export default function Profile() {
  const [info, setInfo] = useState(EMPTY_INFO);
  const [loading, setLoading] = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoStatus, setInfoStatus] = useState(null);

  const [password, setPassword] = useState(EMPTY_PASSWORD);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState(null);

  useEffect(() => {
    api.get("accounts/profile/")
      .then((r) => {
        setInfo({
          firstName: r.data.first_name || "",
          lastName:  r.data.last_name || "",
          email:     r.data.email || "",
          username:  r.data.username || "",
          role:      r.data.role || "",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const setInfoField = (k) => (e) => setInfo((f) => ({ ...f, [k]: e.target.value }));
  const setPasswordField = (k) => (e) => setPassword((f) => ({ ...f, [k]: e.target.value }));

  const handleSaveInfo = () => {
    setSavingInfo(true);
    setInfoStatus(null);
    api.patch("accounts/profile/", {
      first_name: info.firstName,
      last_name:  info.lastName,
      email:      info.email,
    })
      .then(() => setInfoStatus({ type: "success", text: "Profile updated." }))
      .catch((err) => {
        const msg = err.response?.data?.email || "Failed to update profile.";
        setInfoStatus({ type: "error", text: msg });
      })
      .finally(() => setSavingInfo(false));
  };

  const handleSavePassword = () => {
    if (password.next !== password.confirm) {
      setPasswordStatus({ type: "error", text: "New passwords do not match." });
      return;
    }
    setSavingPassword(true);
    setPasswordStatus(null);
    api.post("accounts/profile/change-password/", {
      current_password: password.current,
      new_password:      password.next,
    })
      .then(() => {
        setPasswordStatus({ type: "success", text: "Password updated." });
        setPassword(EMPTY_PASSWORD);
      })
      .catch((err) => {
        const data = err.response?.data || {};
        const msg = data.current_password || data.new_password || "Failed to update password.";
        setPasswordStatus({ type: "error", text: msg });
      })
      .finally(() => setSavingPassword(false));
  };

  return (
    <div className="st-page" style={{ gridTemplateColumns: "1fr" }}>
      <div className="st-main" style={{ maxWidth: 640 }}>
        <div>
          <h1 className="st-page-title">My Profile</h1>
          <p className="st-page-sub">Manage your personal account details and password.</p>
        </div>

        {/* Personal Info */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title"><FiUser size={16} color="#2563eb" /> Personal Information</h2>
          </div>
          <div className="st-card-body">
            <div className="st-form-grid" style={{ marginBottom: 14 }}>
              <div className="st-field">
                <label>First Name</label>
                <input className="st-input" value={info.firstName} onChange={setInfoField("firstName")} disabled={loading} />
              </div>
              <div className="st-field">
                <label>Last Name</label>
                <input className="st-input" value={info.lastName} onChange={setInfoField("lastName")} disabled={loading} />
              </div>
            </div>
            <div className="st-field" style={{ marginBottom: 14 }}>
              <label>Email</label>
              <input className="st-input" value={info.email} onChange={setInfoField("email")} disabled={loading} />
            </div>
            <div className="st-form-grid">
              <div className="st-field">
                <label>Username</label>
                <input className="st-input" value={info.username} disabled />
              </div>
              <div className="st-field">
                <label>Role</label>
                <input className="st-input" value={info.role} disabled style={{ textTransform: "capitalize" }} />
              </div>
            </div>
            <div className="st-form-footer" style={{ alignItems: "center" }}>
              {infoStatus && (
                <span style={{ fontSize: 12, fontWeight: 600, marginRight: "auto", color: infoStatus.type === "success" ? "#16a34a" : "#dc2626" }}>
                  {infoStatus.text}
                </span>
              )}
              <button className="st-btn-primary" onClick={handleSaveInfo} disabled={loading || savingInfo}>
                {savingInfo ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="st-card">
          <div className="st-card-header">
            <h2 className="st-card-title"><FiLock size={16} color="#2563eb" /> Change Password</h2>
          </div>
          <div className="st-card-body">
            <div className="st-field" style={{ marginBottom: 14 }}>
              <label>Current Password</label>
              <input type="password" className="st-input" value={password.current} onChange={setPasswordField("current")} />
            </div>
            <div className="st-form-grid">
              <div className="st-field">
                <label>New Password</label>
                <input type="password" className="st-input" value={password.next} onChange={setPasswordField("next")} />
              </div>
              <div className="st-field">
                <label>Confirm New Password</label>
                <input type="password" className="st-input" value={password.confirm} onChange={setPasswordField("confirm")} />
              </div>
            </div>
            <div className="st-form-footer" style={{ alignItems: "center" }}>
              {passwordStatus && (
                <span style={{ fontSize: 12, fontWeight: 600, marginRight: "auto", color: passwordStatus.type === "success" ? "#16a34a" : "#dc2626" }}>
                  {passwordStatus.text}
                </span>
              )}
              <button
                className="st-btn-primary"
                onClick={handleSavePassword}
                disabled={savingPassword || !password.current || !password.next || !password.confirm}
              >
                {savingPassword ? "Updating…" : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
