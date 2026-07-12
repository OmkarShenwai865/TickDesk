import Card from "./Card";
import Sparkline from "./Sparkline";
import "./SummaryCard.css";

function SummaryCard({
    icon,
    title,
    value,
    change,
    positive = true,
    iconColor = "#2563eb",
    iconBg = "#eff6ff",
    trend,
}) {
    return (
        <Card className="summary-card">

            <div className="summary-icon" style={{ background: iconBg, color: iconColor }}>
                {icon}
            </div>

            <div className="summary-content">

                <p>{title}</p>

                <h2>{value}</h2>

                <span
                    className={
                        positive
                            ? "positive"
                            : "negative"
                    }
                >
                    {change}
                </span>

                {trend?.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                        <Sparkline points={trend} color={iconColor} />
                    </div>
                )}

            </div>

        </Card>
    );
}

export default SummaryCard;