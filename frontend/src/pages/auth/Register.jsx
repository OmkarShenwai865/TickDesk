import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { FiCheckCircle } from "react-icons/fi";
import api from "../../services/api";
import logoIcon from "../../assets/logo-icon.png";
import "../../styles/Register.css";

export default function Register() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        company_name: "",
        first_name:   "",
        last_name:    "",
        email:        "",
        password:     "",
        confirm:      "",
    });
    const [errors,       setErrors]       = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm,  setShowConfirm]  = useState(false);
    const [success,      setSuccess]      = useState(false);
    const [submitting,   setSubmitting]   = useState(false);

    const set = field => e => {
        setForm(f => ({ ...f, [field]: e.target.value }));
        setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async () => {
        setErrors({});
        const errs = {};
        if (!form.company_name.trim()) errs.company_name = "Company name is required.";
        if (!form.first_name.trim())   errs.first_name   = "First name is required.";
        if (!form.email.trim())        errs.email        = "Email is required.";
        if (!form.password)            errs.password     = "Password is required.";
        if (form.password && form.password !== form.confirm)
            errs.confirm = "Passwords do not match.";
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSubmitting(true);
        try {
            await api.post("accounts/register/", {
                company_name: form.company_name.trim(),
                first_name:   form.first_name.trim(),
                last_name:    form.last_name.trim(),
                email:        form.email.trim(),
                password:     form.password,
            });
            setSuccess(true);
            setTimeout(() => navigate("/login"), 2500);
        } catch (err) {
            const data = err.response?.data;
            if (data && typeof data === "object") setErrors(data);
            else setErrors({ general: "Registration failed. Please try again." });
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
                        <p className="rg-success-title">Company Registered!</p>
                        <p className="rg-success-sub">Your account is ready. Redirecting to login…</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rg-page">
            <div className="rg-card">

                {/* Header */}
                <div className="rg-card-header">
                    <div className="rg-logo-wrap">
                        <img src={logoIcon} alt="TickDesk" className="rg-logo-img" />
                    </div>
                    <p className="rg-logo">TickDesk</p>
                    <p className="rg-logo-sub">IT Helpdesk & Asset Management</p>
                </div>

                {/* Body */}
                <div className="rg-card-body">

                    {errors.general && <div className="rg-err-banner">{errors.general}</div>}

                    {/* Company */}
                    <p className="rg-section-title">Company</p>

                    <div className="rg-field">
                        <label className="rg-label">Company Name <span className="rg-required">*</span></label>
                        <input
                            className="rg-input"
                            placeholder="e.g. Acme Corp"
                            value={form.company_name}
                            onChange={set("company_name")}
                        />
                        {errors.company_name && <span className="rg-field-err">{errors.company_name}</span>}
                    </div>

                    <div className="rg-divider" />

                    {/* Admin account */}
                    <p className="rg-section-title">Admin Account</p>

                    <div className="rg-row-2">
                        <div className="rg-field">
                            <label className="rg-label">First Name <span className="rg-required">*</span></label>
                            <input
                                className="rg-input"
                                placeholder="John"
                                value={form.first_name}
                                onChange={set("first_name")}
                            />
                            {errors.first_name && <span className="rg-field-err">{errors.first_name}</span>}
                        </div>
                        <div className="rg-field">
                            <label className="rg-label">Last Name</label>
                            <input
                                className="rg-input"
                                placeholder="Doe"
                                value={form.last_name}
                                onChange={set("last_name")}
                            />
                        </div>
                    </div>

                    <div className="rg-field">
                        <label className="rg-label">Email Address <span className="rg-required">*</span></label>
                        <input
                            className="rg-input"
                            type="email"
                            placeholder="admin@company.com"
                            value={form.email}
                            onChange={set("email")}
                        />
                        {errors.email && <span className="rg-field-err">{errors.email}</span>}
                    </div>

                    <div className="rg-row-2">
                        <div className="rg-field">
                            <label className="rg-label">Password <span className="rg-required">*</span></label>
                            <div className="rg-pw-wrap">
                                <input
                                    className="rg-input"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 8 chars"
                                    value={form.password}
                                    onChange={set("password")}
                                />
                                <span className="rg-pw-toggle" onClick={() => setShowPassword(p => !p)}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            {errors.password && <span className="rg-field-err">{errors.password}</span>}
                        </div>

                        <div className="rg-field">
                            <label className="rg-label">Confirm Password <span className="rg-required">*</span></label>
                            <div className="rg-pw-wrap">
                                <input
                                    className="rg-input"
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="Re-enter"
                                    value={form.confirm}
                                    onChange={set("confirm")}
                                />
                                <span className="rg-pw-toggle" onClick={() => setShowConfirm(p => !p)}>
                                    {showConfirm ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            {errors.confirm && <span className="rg-field-err">{errors.confirm}</span>}
                        </div>
                    </div>

                    <button className="rg-submit-btn" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? "Creating account…" : "Create Account"}
                    </button>
                </div>

                {/* Footer */}
                <div className="rg-card-footer">
                    <div className="rg-footer-links">
                        <Link to="/" className="rg-link">Back to Home</Link>
                    </div>
                    <p className="rg-footer-copy">
                        Already have an account?{" "}
                        <Link to="/login" className="rg-link">Sign in</Link>
                    </p>
                </div>

            </div>
        </div>
    );
}
