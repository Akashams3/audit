const colors = {
  APPROVED: { bg: "#d1fae5", color: "#065f46" },
  REJECTED: { bg: "#fee2e2", color: "#991b1b" },
  SUBMITTED: { bg: "#dbeafe", color: "#1e40af" },
  PENDING: { bg: "#fef3c7", color: "#92400e" },
  DRAFT: { bg: "#f3f4f6", color: "#374151" },
  ACTIVE: { bg: "#d1fae5", color: "#065f46" },
  INACTIVE: { bg: "#fee2e2", color: "#991b1b" },
};

export function StatusBadge({ status }) {
  const s = status?.toUpperCase();
  const style = colors[s] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <span
      style={{
        background: style.bg,
        color: style.color,
        padding: "2px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        display: "inline-block",
      }}
    >
      {status}
    </span>
  );
}

export function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, type = "button" }) {
  const styles = {
    primary: { background: "#1a3a5c", color: "#fff" },
    danger: { background: "#dc2626", color: "#fff" },
    success: { background: "#16a34a", color: "#fff" },
    warning: { background: "#d97706", color: "#fff" },
    outline: { background: "#fff", color: "#1a3a5c", border: "1px solid #1a3a5c" },
    ghost: { background: "transparent", color: "#6b7280" },
  };
  const sizes = { sm: { padding: "4px 10px", fontSize: 12 }, md: { padding: "7px 16px", fontSize: 14 }, lg: { padding: "10px 22px", fontSize: 15 } };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styles[variant],
        ...sizes[size],
        border: styles[variant].border || "none",
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: 500,
        opacity: disabled ? 0.6 : 1,
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </button>
  );
}

export function Input({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 }}>{label}</label>}
      <input
        {...props}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          fontSize: 14,
          outline: "none",
          boxSizing: "border-box",
          ...props.style,
        }}
      />
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 4 }}>{label}</label>}
      <select
        {...props}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #d1d5db",
          borderRadius: 6,
          fontSize: 14,
          outline: "none",
          background: "#fff",
          boxSizing: "border-box",
          ...props.style,
        }}
      >
        {children}
      </select>
    </div>
  );
}

export function Card({ title, value, icon, color = "#1a3a5c" }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        padding: "20px 24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        borderLeft: `4px solid ${color}`,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 32 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: 13, color: "#6b7280" }}>{title}</div>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
      <div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1a3a5c" }}>{title}</h2>
        {subtitle && <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Table({ columns, data, actions }) {
  if (!data?.length)
    return (
      <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af", fontSize: 14 }}>
        No records found.
      </div>
    );
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  padding: "10px 14px",
                  textAlign: "left",
                  fontWeight: 600,
                  color: "#374151",
                  borderBottom: "2px solid #e5e7eb",
                  whiteSpace: "nowrap",
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 600, color: "#374151", borderBottom: "2px solid #e5e7eb" }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: "10px 14px", color: "#374151" }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                </td>
              ))}
              {actions && <td style={{ padding: "10px 14px", textAlign: "right" }}>{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
      <div
        style={{
          width: 36,
          height: 36,
          border: "3px solid #e5e7eb",
          borderTop: "3px solid #1a3a5c",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Alert({ type = "error", message, onClose }) {
  const styles = {
    error: { bg: "#fee2e2", color: "#991b1b", border: "#fca5a5" },
    success: { bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
    info: { bg: "#dbeafe", color: "#1e40af", border: "#93c5fd" },
  };
  const s = styles[type];
  return (
    <div
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        borderRadius: 6,
        padding: "10px 14px",
        marginBottom: 16,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: 14,
      }}
    >
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: s.color, fontSize: 16 }}>
          ×
        </button>
      )}
    </div>
  );
}
