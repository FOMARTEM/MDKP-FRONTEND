export default function FullscreenLoader(props: { show: boolean }) {
  if (!props.show) return null;
  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-label="Загрузка">
      <div className="loading-box">
        <div className="spinner" />
        <div className="muted" style={{ marginTop: 10 }}>
          Загрузка...
        </div>
      </div>
    </div>
  );
}

