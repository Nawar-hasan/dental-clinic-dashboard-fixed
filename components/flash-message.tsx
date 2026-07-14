export function FlashMessage({ error, success }: { error?: string; success?: string }) {
  return <>{error ? <div className="alert error">{error}</div> : null}{success ? <div className="alert success">{success}</div> : null}</>;
}
