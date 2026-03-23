import { sharedStyles } from "../constants/styles";

export function AssetWarning() {
  return (
    <div
      style={{
        padding: 12,
        marginBottom: 16,
        background: "#21262d",
        borderRadius: 8,
        border: "1px solid #30363d",
        fontSize: 13,
        color: "#e6edf3",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span style={{ color: "#58a6ff" }}>i</span>
        <div>
          <strong>Multiple assets</strong>
          <p style={{ margin: "4px 0 0", color: "#8b949e" }}>
            Multiple assets have a similar code, please check the domain before adding. Learn more
            about assets domains.
          </p>
        </div>
      </div>
    </div>
  );
}
