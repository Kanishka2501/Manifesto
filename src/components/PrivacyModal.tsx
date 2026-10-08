import React from 'react';

interface PrivacyModalProps {
  onClose: () => void;
  onClearData: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose, onClearData }) => {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Privacy & Data Transparency">
      <div className="modal-content in" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}>🔒 Privacy & Data Transparency</h2>
          <button className="btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p className="small" style={{ marginBottom: 14 }}>
          We believe in complete, radical honesty about your sacred personal thoughts and how they are processed.
        </p>

        <div className="card" style={{ padding: '16px', margin: '10px 0' }}>
          <h3 style={{ margin: '0 0 6px' }}>📱 1. Local Data (On Your Device)</h3>
          <p className="small" style={{ margin: 0 }}>
            • <b>Saved manifestations, custom names, and edits</b> are stored directly in your browser's private localStorage.
            <br />• <b>Personal journal entries, reflections, and tags</b> stay locally on this device.
            <br />• <b>Vision boards, custom themes, streak dates, and challenge notes</b> never leave your device unless you choose to export them.
          </p>
        </div>

        <div className="card" style={{ padding: '16px', margin: '10px 0' }}>
          <h3 style={{ margin: '0 0 6px' }}>🌐 2. AI-Processed Data (In Flight)</h3>
          <p className="small" style={{ margin: 0 }}>
            • When you click <b>"Create My Manifestation"</b>, the specific wish, tone, and category you submitted are sent securely through our private backend server to the Google Gemini AI API to compose your kit.
            <br />• When you use the <b>Affirmation Rewriter</b> or <b>Journal AI Actions</b>, only the specific text block you choose to analyze is transmitted.
            <br />• <b>Your AI API keys are protected on the secure server</b> and are never exposed in browser scripts or network tabs.
          </p>
        </div>

        <div className="card" style={{ padding: '16px', margin: '10px 0' }}>
          <h3 style={{ margin: '0 0 6px' }}>🗄️ 3. Server Data (Backend Retention)</h3>
          <p className="small" style={{ margin: 0 }}>
            • Our backend server <b>does NOT persistently store or sell your manifestation texts or journal entries</b>.
            <br />• Rate-limiting counts and aggregate operational request counters are maintained in transient server memory to prevent abuse.
            <br />• Optional feedback messages you submit are stored privately to improve feature reliability.
          </p>
        </div>

        <div className="card" style={{ padding: '16px', margin: '10px 0' }}>
          <h3 style={{ margin: '0 0 6px' }}>🗑️ 4. Full Control & Deletion</h3>
          <p className="small" style={{ margin: '0 0 10px' }}>
            You can export your complete personal sanctuary as a JSON file or wipe all local data at any second.
          </p>
          <div className="acts">
            <button
              className="btn"
              style={{ color: '#ff4fa3', borderColor: '#ff4fa3' }}
              onClick={() => {
                if (confirm('Permanently delete all saved manifestations, journals, and progress on this device?')) {
                  onClearData();
                  onClose();
                }
              }}
            >
              🗑️ Delete All Local Data Now
            </button>
          </div>
        </div>

        <div className="acts" style={{ justifyContent: 'flex-end', marginTop: 14 }}>
          <button className="btn p" onClick={onClose}>Understood</button>
        </div>
      </div>
    </div>
  );
};
