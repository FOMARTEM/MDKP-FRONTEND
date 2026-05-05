export default function InlineError(props: { error: unknown }) {
  if (!props.error) return null;
  const message =
    typeof props.error === "string"
      ? props.error
      : props.error instanceof Error
        ? props.error.message
        : "Ошибка";
  return <div className="card" style={{ border: "1px solid var(--danger)" }}>{message}</div>;
}

