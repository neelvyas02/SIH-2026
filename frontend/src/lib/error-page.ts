export function renderErrorPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Application Error</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .box { text-align: center; max-width: 500px; padding: 2rem; border-radius: 8px; background: #1e293b; border: 1px solid #334155; }
    h1 { color: #ef4444; }
    a { color: #38bdf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="box">
    <h1>System Error</h1>
    <p>An unexpected error occurred. Please refresh or return to the operations center.</p>
    <a href="/">Return Home</a>
  </div>
</body>
</html>`;
}
