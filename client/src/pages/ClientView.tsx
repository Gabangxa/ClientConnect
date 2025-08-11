/**
 * ClientView.tsx
 * - Example client-facing page for a share link token
 * - Minimal UI with call-to-actions to download/upload files and message
 */

import Card from "../components/Card";
import { useRoute } from "wouter";

export default function ClientView() {
  const [match, params] = useRoute("/client/:token");
  const token = params?.token;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Project Portal</h2>
          <p className="mt-2 text-gray-500">Access shared files and communicate with your freelancer.</p>
          {token && <p className="text-xs text-gray-400 mt-1">Token: {token}</p>}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card title="Files">
          <div className="space-y-3">
            <div className="text-sm text-gray-500">Files shared with you</div>
            <ul className="space-y-2">
              <li className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div className="text-sm">Proposal.pdf</div>
                <div className="text-xs text-gray-400">2.1MB</div>
              </li>
              <li className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div className="text-sm">Design_mockups.zip</div>
                <div className="text-xs text-gray-400">15.3MB</div>
              </li>
            </ul>
            <div className="mt-4">
              <button className="px-3 py-2 rounded-lg bg-brand-500 text-white">Download All</button>
            </div>
          </div>
        </Card>

        <Card title="Messages">
          <div className="space-y-3">
            <div className="text-sm text-gray-500">Send a message to your freelancer</div>
            <textarea 
              className="w-full rounded p-3 border resize-none focus:outline-none focus:ring-2 focus:ring-brand-500" 
              rows={4} 
              placeholder="Type your message here..."
            />
            <div className="text-right">
              <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Send</button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}