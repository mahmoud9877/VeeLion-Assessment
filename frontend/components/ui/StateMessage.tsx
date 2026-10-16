type StateMessageProps = {
  variant: "loading" | "error" | "empty";
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StateMessage({ variant, title, message, actionLabel, onAction }: StateMessageProps) {
  return (
    <div className={`card state state--${variant}`} role={variant === "error" ? "alert" : "status"}>
      {variant === "loading" ? <span className="spinner" aria-hidden="true" /> : null}
      <div className="state__body">
        {title ? <p className="state__title">{title}</p> : null}
        <p className="state__message">{message}</p>
      </div>
      {actionLabel && onAction ? (
        <button type="button" className="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
