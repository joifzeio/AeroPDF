interface LoaderProps {
  title?: string;
  subtitle?: string;
}

export function Loader({
  title = 'Processing Document...',
  subtitle = 'Performing operation 100% locally in your browser. Your files never leave your device.'
}: LoaderProps) {
  return (
    <div className="loader-overlay">
      <div className="loader-card">
        <div className="loader-spinner"></div>
        <h3 className="loader-title">{title}</h3>
        <p className="loader-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}
