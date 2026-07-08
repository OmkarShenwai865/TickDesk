import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi";
import api from "../../services/api";
import logoIcon from "../../assets/logo-icon.png";
import "../../styles/Register.css";

export default function AcceptInvite() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [invite, setInvite] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        password: "",
        confirm: "",
    });

    useEffect(() => {
        api.get(`accounts/users/invite/${token}/accept/`)
            .then(r => setInvite(r.data))
            .catch(err => setErrors({ general: err.response?.data?.detail || "This invite is invalid or expired." }))
            .finally(() => setLoading(false));
    }, [token]);

    const set = field => e => {
        setForm(f => ({ ...f, [field]: e.target.value }));
        setErrors(prev => ({ ...prev, [field]: undefined, general: undefined }));
    };

    const handleSubmit = async () => {
        const errs = {};
        if (!form.first_name.trim()) errs.first_name = "First name is required.";
        if (!form.password) errs.password = "Password is required.";
        if (form.password && form.password !== form.confirm) errs.confirm = "Passwords do not match.";
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSubmitting(true);
        try {
            await api.post(`accounts/users/invite/${token}/accept/`, {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                password: form.password,
            });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 2200);
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === "object") setErrors(data.detail ? { general: data.detail } : data);
            else setErrors({ general: "Could not accept invite. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    if (success) {
        return (
            <div className="rg-page">
                <div className="rg-card">
                    <div className="rg-card-header">
                        <div className="rg-logo-wrap">
                            <img src={logoIcon} alt="TickDesk" className="rg-logo-img" />
                        </div>
                        <p className="rg-logo">TickDesk</p>
                        <p className="rg-logo-sub">IT Helpdesk & Asset Management</p>
                    </div>
                    <div className="rg-success">
                        <div className="rg-success-icon">
                            <FiCheckCircle size={28} color="#16a34a" />
                        </div>
                        <p className="rg-success-title">Account Ready</p>
                        <p className="rg-success-sub">Redirecting to login...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rg-page">
            <div className="rg-card">
                <div className="rg-card-header">
                    <div className="rg-logo-wrap">
                        <img src={logoIcon} alt="TickDesk" className="rg-logo-img" />
                    </div>
                    <p className="rg-logo">TickDesk</p>
                    <p className="rg-logo-sub">Complete your invited account</p>
                </div>

                <div className="rg-card-body">
                    {errors.general && <div className="rg-err-banner">{errors.general}</div>}

                    {loading ? (
                        <p className="rg-success-sub">Checking invite...</p>
                    ) : invite ? (
                        <>
                            <p className="rg-section-title">Invite</p>
                            <div className="rg-invite-box">
                                <span>Email</span><strong>{invite.email}</strong>
                                <span>Role</span><strong>{invite.role_display}</strong>
                            </div>

                            <div className="rg-divider" />
                            <p className="rg-section-title">Account Setup</p>

                            <div className="rg-row-2">
                                <div className="rg-field">
                                    <label className="rg-label">First Name <span className="rg-required">*</span></label>
                                    <input className="rg-input" placeholder="John" value={form.first_name} onChange={set("first_name")} />
                                    {errors.first_name && <span className="rg-field-err">{errors.first_name}</span>}
                                </div>
                                <div className="rg-field">
                                    <label className="rg-label">Last Name</label>
                                    <input className="rg-input" placeholder="Doe" value={form.last_name} onChange={set("last_name")} />
                                </div>
                            </div>

                            <div className="rg-row-2">
                                <div className="rg-field">
                                    <label className="rg-label">Password <span className="rg-required">*</span></label>
                                    <div className="rg-pw-wrap">
                                        <input className="rg-input" type={showPassword ? "text" : "password"} placeholder="Min. 8 chars" value={form.password} onChange={set("password")} />
                                        <span className="rg-pw-toggle" onClick={() => setShowPassword(p => !p)}>
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </div>
                                    {errors.password && <span className="rg-field-err">{errors.password}</span>}
                                </div>
                                <div className="rg-field">
                                    <label className="rg-label">Confirm Password <span className="rg-required">*</span></label>
                                    <div className="rg-pw-wrap">
                                        <input className="rg-input" type={showConfirm ? "text" : "password"} placeholder="Re-enter" value={form.confirm} onChange={set("confirm")} />
                                        <span className="rg-pw-toggle" onClick={() => setShowConfirm(p => !p)}>
                                            {showConfirm ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                    </div>
                                    {errors.confirm && <span className="rg-field-err">{errors.confirm}</span>}
                                </div>
                            </div>

                            <button className="rg-submit-btn" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? "Creating account..." : "Accept Invite"}
                            </button>
                        </>
                    ) : null}
                </div>

                <div className="rg-card-footer">
                    Already set up? <Link to="/login" className="rg-link">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
