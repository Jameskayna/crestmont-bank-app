import React from "react";
import ReactDOM from "react-dom/client";

/**
 * Placeholder entrypoint. This repo becomes the real, API-connected
 * Crestmont Reserve Bank app — user dashboard, login/register/2FA,
 * KYC upload, loans, notifications, and (as a separate protected route
 * or subdomain) the staff admin console.
 *
 * The visual design is already settled — see the HTML mockups from the
 * design phase (dashboard, admin console, profile settings) for the
 * layout, color system, and component behavior to rebuild here in React,
 * wired to the real backend API instead of local mock state.
 *
 * Nothing to build here yet until crestmont-bank-backend's Stage 3
 * (accounts/transfers API) exists for this to call.
 */
function App() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 40 }}>
      <h1>Crestmont Reserve Bank — App</h1>
      <p>Placeholder. See CLAUDE.md for what gets built here and in what order.</p>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
