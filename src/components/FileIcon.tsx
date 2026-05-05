const MAP: Record<string, { label: string; color: string }> = {
  pdf: { label: "PDF", color: "#b91c1c" },
  doc: { label: "DOC", color: "#1d4ed8" },
  docx: { label: "DOCX", color: "#1d4ed8" },
  xls: { label: "XLS", color: "#166534" },
  xlsx: { label: "XLSX", color: "#166534" },
  ppt: { label: "PPT", color: "#9a3412" },
  pptx: { label: "PPTX", color: "#9a3412" },
  png: { label: "PNG", color: "#6d28d9" },
  jpg: { label: "JPG", color: "#6d28d9" },
  jpeg: { label: "JPEG", color: "#6d28d9" },
  gif: { label: "GIF", color: "#6d28d9" },
  txt: { label: "TXT", color: "#334155" },
  zip: { label: "ZIP", color: "#7c2d12" },
  rar: { label: "RAR", color: "#7c2d12" }
};

export default function FileIcon(props: { ext?: string | null }) {
  const key = (props.ext ?? "").trim().toLowerCase();
  const cfg = MAP[key] ?? { label: (key || "FILE").slice(0, 5).toUpperCase(), color: "#334155" };
  return (
    <span
      className="file-icon"
      style={{
        background: cfg.color
      }}
      title={key}
    >
      {cfg.label}
    </span>
  );
}

