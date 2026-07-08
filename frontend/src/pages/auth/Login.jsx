import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../../services/api";
import logoIcon from "../../assets/logo-icon.png";
import "../../styles/Login.css";

function defaultPathForRole(role) {
    return role === "admin" ? "/dashboard" : "/tickets";
}

export default function Login({ expectedRole = null, title = "Login" }) {
    const navigate = useNavigate();

    const [email,        setEmail]        = useState("");
    const [password,     setPassword]     = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message,      setMessage]      = useState("");
    const [messageType,  setMessageType]  = useState("");

    useEffect(() => {
        const token = localStorage.getItem("access");
        if (!token) return;
        const role = localStorage.getItem("role");
        navigate(defaultPathForRole(role), { replace: true });
    }, [navigate]);

    const handleLogin = async () => {
        setMessage("");
        try {
            const response = await api.post("accounts/login/", {
                username: email,
                password: password,
            });
            const role = response.data.user?.role;
            if (expectedRole && role !== expectedRole) {
                setMessage(`Please use the ${role === "agent" ? "support agent" : role} login form.`);
                setMessageType("error");
                return;
            }

            localStorage.setItem("access",  response.data.access);
            localStorage.setItem("refresh", response.data.refresh);
            localStorage.setItem("role",    role ?? "employee");
            localStorage.setItem("user_id", response.data.user?.id ?? "");

            setMessage("Login successful!");
            setMessageType("success");

            setTimeout(() => navigate(defaultPathForRole(role)), 900);
        } catch {
            setMessage("Invalid email or password.");
            setMessageType("error");
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <div className="login-page">
            <div className="login-card">

                {/* Blue header */}
                <div className="login-card-header">
                    <div className="login-logo-wrap">
                        <img src={logoIcon} alt="TickDesk" className="login-logo-img" />
                    </div>
                    <p className="login-logo">TickDesk</p>
                    <p className="login-logo-sub">IT Helpdesk & Asset Management</p>
                </div>

                {/* Body */}
                <div className="login-card-body">
                    <p className="login-form-title">{title}</p>

                    {message && (
                        <div className={`login-banner ${messageType === "success" ? "login-banner-success" : "login-banner-error"}`}>
                            {message}
                        </div>
                    )}

                    <div className="login-field">
                        <label className="login-label">
                            Email <span className="login-required">*</span>
                        </label>
                        <input
                            className="login-input"
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="login-field">
                        <label className="login-label">
                            Password <span className="login-required">*</span>
                        </label>
                        <div className="login-pw-wrap">
                            <input
                                className="login-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                            <span className="login-pw-toggle" onClick={() => setShowPassword(p => !p)}>
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>

                    <button className="login-btn" onClick={handleLogin}>
                        Login
                    </button>
                </div>

                {/* Footer */}
                <div className="login-card-footer">
                    <div className="login-footer-links">
                        <Link to="/" className="login-link">Back to Home</Link>
                    </div>
                    {!expectedRole && (
                        <p className="login-footer-copy">
                            Don't have an account?{" "}
                            <Link to="/register" className="login-link">Sign up</Link>
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}
