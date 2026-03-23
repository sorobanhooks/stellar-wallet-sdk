import { sharedStyles } from "../constants/styles";

interface AssetSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flexShrink: 0, color: "#8b949e" }}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

export function AssetSearchInput({
  value,
  onChange,
  placeholder = "Search by asset code or contract ID",
}: AssetSearchInputProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
        padding: "10px 14px",
        background: "#0d1117",
        border: "1px solid #30363d",
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          ...sharedStyles.input,
          outline: 'none',
          borderRadius: 0,
          marginBottom: 0,
          flex: 1,
          padding: 0,
          border: "none",
          background: "transparent",
        }}
      />
      <SearchIcon />
    </div>
  );
}
