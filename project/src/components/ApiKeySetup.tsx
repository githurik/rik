import { useState } from 'react';
import { Key, Eye, EyeOff, ExternalLink, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { saveApiKey, clearApiKey, hasApiKey, getStoredApiKey } from '../lib/ai';

interface ApiKeySetupProps {
  onClose?: () => void;
  inline?: boolean; // render as inline card instead of modal
}

export function ApiKeySetup({ onClose, inline = false }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);
  const [testError, setTestError] = useState('');
  const existing = hasApiKey();
  const maskedKey = existing ? getStoredApiKey().slice(0, 8) + '•••••••••••••••••••••' : '';

  async function handleSave() {
    if (!apiKey.trim()) return;
    saveApiKey(apiKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose?.();
    }, 1000);
  }

  async function handleTest() {
    const key = apiKey.trim() || getStoredApiKey();
    if (!key) return;
    setTesting(true);
    setTestResult(null);
    setTestError('');
    try {
      const res = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      });
      if (res.ok) {
        setTestResult('ok');
      } else {
        const d = await res.json().catch(() => ({}));
        setTestError((d as any)?.error?.message || `Status ${res.status}`);
        setTestResult('fail');
      }
    } catch (e: any) {
      setTestError(e?.message || 'Network error');
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  }

  function handleClear() {
    if (!confirm('Remove the saved API key?')) return;
    clearApiKey();
    setApiKey('');
    setTestResult(null);
    setSaved(false);
  }

  const content = (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-blue-100 rounded-lg flex-shrink-0">
          <Key className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-base">Anthropic API Key</h3>
          <p className="text-sm text-slate-600 mt-0.5">
            Required for real AI analysis — detects licence plates, counts occupants, and identifies violations.
          </p>
        </div>
      </div>

      {existing && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800">API key saved</p>
            <p className="text-xs text-green-700 font-mono truncate">{maskedKey}</p>
          </div>
          <button
            onClick={handleClear}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
            title="Remove key"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {existing ? 'Replace with new key' : 'Enter your API key'}
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setTestResult(null); }}
            placeholder="sk-ant-api03-..."
            className="w-full px-4 py-2.5 pr-10 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {testResult === 'ok' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
          API key is valid and working.
        </div>
      )}
      {testResult === 'fail' && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <div><span className="font-medium">Test failed:</span> {testError}</div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleTest}
          disabled={testing || (!apiKey.trim() && !existing)}
          className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium disabled:opacity-40"
        >
          {testing ? 'Testing...' : 'Test Key'}
        </button>
        <button
          onClick={handleSave}
          disabled={!apiKey.trim() || saved}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors text-sm font-medium"
        >
          {saved ? 'Saved!' : 'Save Key'}
        </button>
      </div>

      <div className="text-xs text-slate-500 space-y-1 pt-1 border-t border-slate-100">
        <p>
          Get your key at{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
          >
            console.anthropic.com <ExternalLink className="w-3 h-3" />
          </a>
        </p>
        <p>Your key is stored only in your browser (localStorage) and never sent to any server other than Anthropic.</p>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {content}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full mt-3 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
