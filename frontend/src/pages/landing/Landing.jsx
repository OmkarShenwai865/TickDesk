import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    FiMoon,
    FiSun,
    FiShield,
    FiZap,
    FiLayers,
    FiBarChart2,
    FiMessageSquare,
    FiCpu,
    FiCheckCircle,
    FiClock,
    FiUsers,
} from "react-icons/fi";
import logoIcon from "../../assets/logo-icon.png";
import "./Landing.css";

const TRUST_LOGOS = ["HelioOps", "NorthGrid", "AtlasWare", "KiteStack", "Meridian", "Oakline"];

const FEATURES = [
    {
        title: "Ticket orchestration",
        text: "Route, prioritize, and resolve requests with a workspace built for fast triage.",
        icon: FiZap,
        tone: "blue",
    },
    {
        title: "Asset visibility",
        text: "Keep hardware, accessories, and ownership history visible across the company.",
        icon: FiLayers,
        tone: "violet",
    },
    {
        title: "Operational reporting",
        text: "Track response times, backlog movement, and team output from one surface.",
        icon: FiBarChart2,
        tone: "green",
    },
    {
        title: "Knowledge capture",
        text: "Turn recurring fixes into reusable articles your team can actually find.",
        icon: FiMessageSquare,
        tone: "amber",
    },
    {
        title: "Role-based access",
        text: "Separate admin control from agent and employee workflows without fragmenting the UI.",
        icon: FiShield,
        tone: "red",
    },
    {
        title: "Automation ready",
        text: "Standardize repetitive IT tasks so the desk spends more time resolving and less time clicking.",
        icon: FiCpu,
        tone: "cyan",
    },
];

const STEPS = [
    { no: "01", title: "Create your workspace", text: "Set up your company, admin account, and operating structure in a few minutes." },
    { no: "02", title: "Invite your team", text: "Bring in support agents and employees with role-based sign-in paths and controlled access." },
    { no: "03", title: "Run support in one place", text: "Manage tickets, assets, and shared knowledge without bouncing between tools." },
];

const TESTIMONIALS = [
    { quote: "We finally have one view of requests, assignments, and assets instead of five overlapping spreadsheets.", name: "Priya Nair", role: "IT Lead, NorthGrid" },
    { quote: "The interface feels clear enough for employees and still deep enough for the support desk.", name: "Marcus Lee", role: "Operations Manager, HelioOps" },
    { quote: "Our agents stopped asking where things live. That alone paid for the rollout effort.", name: "Sana Brooks", role: "Support Manager, AtlasWare" },
];

const STATS = [
    { id: "s1", value: 1200, suffix: "+", label: "Tickets tracked monthly" },
    { id: "s2", value: 32, suffix: "%", label: "Faster triage workflow" },
    { id: "s3", value: 98, suffix: "%", label: "Asset visibility coverage" },
    { id: "s4", value: 24, suffix: "/7", label: "Support continuity" },
];

function defaultPathForRole(role) {
    return role === "admin" ? "/dashboard" : "/tickets";
}

function animateValue(target, setter, suffix) {
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * eased);
        setter(`${current}${suffix}`);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

export default function Landing() {
    const navigate = useNavigate();
    const [theme, setTheme] = useState(() => localStorage.getItem("td-theme") || "dark");
    const [navScrolled, setNavScrolled] = useState(false);
    const [counts, setCounts] = useState(() =>
        Object.fromEntries(STATS.map((stat) => [stat.id, `0${stat.suffix}`]))
    );

    useEffect(() => {
        const token = localStorage.getItem("access");
        const role = localStorage.getItem("role");
        if (token && role) {
            navigate(defaultPathForRole(role), { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("td-theme", theme);
    }, [theme]);

    useEffect(() => {
        const onScroll = () => setNavScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        const revealNodes = document.querySelectorAll(".reveal");
        const statsNode = document.querySelector(".stats-section");
        let statsAnimated = false;

        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        }, { threshold: 0.12 });

        revealNodes.forEach((node) => revealObserver.observe(node));

        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !statsAnimated) {
                    statsAnimated = true;
                    STATS.forEach((stat) => {
                        animateValue(stat.value, (value) => {
                            setCounts((prev) => ({ ...prev, [stat.id]: value }));
                        }, stat.suffix);
                    });
                }
            });
        }, { threshold: 0.3 });

        if (statsNode) statsObserver.observe(statsNode);

        return () => {
            revealObserver.disconnect();
            statsObserver.disconnect();
        };
    }, []);

    return (
        <div className="lp-page">
            <nav className={`lp-nav${navScrolled ? " scrolled" : ""}`}>
                <Link to="/" className="lp-brand">
                    <img src={logoIcon} alt="TickDesk" className="lp-brand-icon" />
                    <div>
                        <strong>TickDesk</strong>
                        <span>IT Helpdesk & Asset Management</span>
                    </div>
                </Link>

                <div className="lp-nav-links">
                    <a href="#features">Features</a>
                    <a href="#workflow">How it works</a>
                    <a href="#stats">Stats</a>
                    <a href="#testimonials">Reviews</a>
                </div>

                <div className="lp-nav-actions">
                    <button
                        id="themeToggle"
                        className="lp-theme-btn"
                        type="button"
                        onClick={() => setTheme((prev) => prev === "dark" ? "light" : "dark")}
                        aria-label="Toggle theme"
                    >
                        {theme === "dark" ? <FiSun size={16} /> : <FiMoon size={16} />}
                    </button>
                    <div className="role-login-group nav-role-logins">
                        <Link to="/employee-login" className="btn-ghost">Employee Login</Link>
                        <Link to="/support-agent-login" className="btn-ghost">Agent Login</Link>
                        <Link to="/login" className="btn-primary">Admin Login</Link>
                    </div>
                </div>
            </nav>

            <header className="hero-section">
                <div className="hero-copy reveal visible">
                    <div className="hero-eyebrow">
                        <span className="eyebrow-dot" />
                        Built for IT teams that need clarity fast
                    </div>
                    <h1>Support tickets, assets, and team workflows in one deliberate workspace.</h1>
                    <p>
                        TickDesk gives admins, support agents, and employees a cleaner way to run internal IT
                        without splitting the experience into separate tools.
                    </p>
                    <div className="hero-actions role-login-group">
                        <Link to="/employee-login" className="btn-outline-large">
                            Employee Login
                        </Link>
                        <Link to="/support-agent-login" className="btn-outline-large">
                            Agent Login
                        </Link>
                        <Link to="/login" className="btn-large">
                            Admin Login
                        </Link>
                    </div>
                </div>

                <div className="hero-visual reveal visible">
                    <div className="hero-mockup">
                        <div className="mockup-top">
                            <div>
                                <p className="mockup-label">Live operations</p>
                                <h3>Support overview</h3>
                            </div>
                            <span className="mockup-pill">12 agents online</span>
                        </div>

                        <div className="mockup-grid">
                            <div className="mock-stat">
                                <span>Open</span>
                                <strong>28</strong>
                            </div>
                            <div className="mock-stat">
                                <span>In progress</span>
                                <strong>14</strong>
                            </div>
                            <div className="mock-stat">
                                <span>Resolved today</span>
                                <strong>39</strong>
                            </div>
                        </div>

                        <div className="ticket-list">
                            <div className="ticket-row">
                                <div>
                                    <strong>VPN access issue</strong>
                                    <span>Finance team request</span>
                                </div>
                                <span className="t-status open">Open</span>
                            </div>
                            <div className="ticket-row">
                                <div>
                                    <strong>Laptop reassignment</strong>
                                    <span>Asset transfer in review</span>
                                </div>
                                <span className="t-status prog">In progress</span>
                            </div>
                            <div className="ticket-row">
                                <div>
                                    <strong>Email sync restored</strong>
                                    <span>Knowledge article attached</span>
                                </div>
                                <span className="t-status done">Resolved</span>
                            </div>
                        </div>
                    </div>

                    <div className="floating-badge badge-left">
                        <FiClock size={15} />
                        Avg. first response 11m
                    </div>
                    <div className="floating-badge badge-right">
                        <FiUsers size={15} />
                        3 role-specific sign-ins
                    </div>
                    <div className="floating-badge badge-bottom">
                        <FiCheckCircle size={15} />
                        Asset history attached to tickets
                    </div>
                </div>
            </header>

            <section className="trust-strip reveal">
                {TRUST_LOGOS.map((name) => (
                    <div key={name} className="trust-logo">{name}</div>
                ))}
            </section>

            <section id="features" className="lp-section">
                <div className="section-head center reveal">
                    <span className="section-label">Features</span>
                    <h2>Everything the desk needs without the usual clutter.</h2>
                    <p className="section-sub">
                        The experience stays cohesive across admins, agents, and employees while keeping permissions clear.
                    </p>
                </div>
                <div className="features-grid">
                    {FEATURES.map(({ title, text, icon: Icon, tone }) => (
                        <article key={title} className="feat-card reveal">
                            <div className={`feat-icon ${tone}`}>
                                <Icon size={18} />
                            </div>
                            <h3>{title}</h3>
                            <p>{text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="workflow" className="lp-section workflow-section">
                <div className="section-head center reveal">
                    <span className="section-label">How it works</span>
                    <h2>From setup to daily support in three clear steps.</h2>
                </div>
                <div className="steps-grid">
                    {STEPS.map((step) => (
                        <article key={step.no} className="step-card reveal">
                            <span className="step-no">{step.no}</span>
                            <h3>{step.title}</h3>
                            <p>{step.text}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section id="stats" className="lp-section stats-section">
                <div className="stats-grid">
                    {STATS.map((stat) => (
                        <div key={stat.id} className="stat-card reveal">
                            <strong>{counts[stat.id]}</strong>
                            <span>{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section id="testimonials" className="lp-section">
                <div className="section-head center reveal">
                    <span className="section-label">Testimonials</span>
                    <h2>Teams adopt it quickly because the workflow feels obvious.</h2>
                </div>
                <div className="testimonials-grid">
                    {TESTIMONIALS.map((item) => (
                        <article key={item.name} className="quote-card reveal">
                            <p>"{item.quote}"</p>
                            <strong>{item.name}</strong>
                            <span>{item.role}</span>
                        </article>
                    ))}
                </div>
            </section>

            <section className="lp-section">
                <div className="cta-card reveal">
                    <div>
                        <span className="section-label">Start now</span>
                        <h2>Launch your helpdesk with a cleaner front door.</h2>
                        <p>
                            Start with admin signup, then route employees and support agents through their own login entry points.
                        </p>
                    </div>
                    <div className="cta-actions">
                        <Link to="/register" className="btn-large">Create Workspace</Link>
                        <Link to="/login" className="btn-outline-large">Go to Login</Link>
                    </div>
                </div>
            </section>

            <footer className="lp-footer">
                <div className="footer-grid">
                    <div>
                        <div className="lp-brand footer-brand">
                            <img src={logoIcon} alt="TickDesk" className="lp-brand-icon" />
                            <div>
                                <strong>TickDesk</strong>
                                <span>Support operations made visible</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4>Product</h4>
                        <Link to="/register">Start Free</Link>
                        <a href="#features">Features</a>
                        <a href="#workflow">Workflow</a>
                    </div>
                    <div>
                        <h4>Access</h4>
                        <Link to="/login">Admin Login</Link>
                        <Link to="/support-agent-login">Support Agent Login</Link>
                        <Link to="/employee-login">Employee Login</Link>
                    </div>
                    <div>
                        <h4>Company</h4>
                        <a href="#testimonials">Customers</a>
                        <a href="#stats">Stats</a>
                        <Link to="/register">Create Workspace</Link>
                    </div>
                </div>
                <div className="footer-bottom">
                    <span>TickDesk</span>
                    <span>Built for internal IT support teams</span>
                </div>
            </footer>
        </div>
    );
}
