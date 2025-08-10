import React from "react";

// ArchitectureDiagram — visual overview of a refactor for ClientConnect
// - Uses Tailwind classes for layout and spacing (no imports needed in this canvas preview)
// - This is a presentational component you can drop into a React app (e.g., the project's `client`)
// - Boxes represent services; arrows are simple SVG paths showing data flow

export default function ArchitectureDiagram() {
  return (
    <div className="p-6 bg-slate-50 min-h-screen font-sans text-slate-800">
      <h1 className="text-2xl font-semibold mb-4">ClientConnect — Refactored Architecture</h1>

      <div className="grid grid-cols-12 gap-6">
        {/* Frontend column */}
        <div className="col-span-4">
          <div className="rounded-2xl shadow p-4 bg-white">
            <h2 className="text-lg font-medium">Frontend</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>React 18 + Vite + TypeScript</li>
              <li>TanStack Query for data fetching</li>
              <li>Zod + React Hook Form for validation</li>
              <li>Route: /dashboard, /client/:token, /auth</li>
            </ul>

            <div className="mt-4 border-t pt-3">
              <div className="text-xs font-semibold mb-2">Client UI</div>
              <div className="flex flex-col gap-2">
                <div className="p-3 rounded bg-slate-100">Branded Portal (lazy-loaded)</div>
                <div className="p-3 rounded bg-slate-100">File Viewer / Download</div>
                <div className="p-3 rounded bg-slate-100">Messaging / Feedback</div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle column - API / Gateway */}
        <div className="col-span-4">
          <div className="rounded-2xl shadow p-4 bg-white flex flex-col">
            <h2 className="text-lg font-medium">API / Backend</h2>
            <p className="text-sm mt-2">Thin API gateway delegating to services</p>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded bg-slate-100">Auth Service (Passport / JWT)</div>
              <div className="p-3 rounded bg-slate-100">Project Service (Drizzle)</div>
              <div className="p-3 rounded bg-slate-100">File Service (Signed URLs)</div>
              <div className="p-3 rounded bg-slate-100">Message Service (Queue-backed)</div>
            </div>

            <div className="mt-4 text-xs">
              <div className="font-semibold">Middleware</div>
              <ul className="mt-2 text-sm space-y-1">
                <li>Validation (Zod), Rate limiting, Error handler</li>
                <li>Request logging & tracing</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right column - Infra */}
        <div className="col-span-4">
          <div className="rounded-2xl shadow p-4 bg-white">
            <h2 className="text-lg font-medium">Storage & Infra</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>PostgreSQL (Neon / managed) — primary data</li>
              <li>Object Storage (S3 / Supabase Storage) — files</li>
              <li>Redis — job queue + caching</li>
              <li>BullMQ / Background Worker — thumbnails, virus scan</li>
              <li>CI/CD: GitHub Actions — migrations, tests, deploy</li>
              <li>Monitoring: Sentry + Prometheus + Loki</li>
            </ul>

            <div className="mt-4 border-t pt-3 text-sm">
              <div className="font-semibold">Security</div>
              <ul className="mt-2 space-y-1">
                <li>Signed short-lived URLs for file access</li>
                <li>HttpOnly cookies for sessions or short-lived JWT</li>
                <li>Rate limits and IP-based protections</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Flow arrows (simple SVG) */}
      <div className="mt-8 p-4">
        <svg className="w-full h-48" viewBox="0 0 1200 200" preserveAspectRatio="none">
          {/* Frontend -> API */}
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L9,3 z" fill="#334155" />
            </marker>
          </defs>

          <path d="M180 50 C 300 20, 480 20, 540 50" stroke="#334155" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
          <text x="360" y="18" fontSize="12" fill="#475569">HTTPS / REST / JSON</text>

          {/* API -> DB */}
          <path d="M560 80 C 700 110, 820 110, 960 80" stroke="#334155" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
          <text x="750" y="135" fontSize="12" fill="#475569">SQL (Drizzle ORM)</text>

          {/* API -> Object Storage */}
          <path d="M560 40 L 960 40" stroke="#334155" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
          <text x="760" y="30" fontSize="12" fill="#475569">Signed URLs / Presigned Uploads</text>

          {/* Message flow to queue */}
          <path d="M420 140 C 560 160, 700 160, 840 140" stroke="#334155" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
          <text x="610" y="175" fontSize="12" fill="#475569">Jobs: Thumbnailing / Scanning</text>
        </svg>
      </div>

      <div className="mt-6 text-sm text-slate-600">
        <strong>Notes:</strong> This diagram emphasizes separation of concerns — thin API gateway with dedicated services, cloud object storage for files, a job queue for heavy tasks, and managed DB for reliable scaling.
      </div>
    </div>
  );
}
