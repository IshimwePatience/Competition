import { useState } from 'react';
import { api } from '../../api/client';

export default function AdminAIPage() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  const ask = async () => {
    if (!question.trim()) return;
    setError('');
    setLoading(true);
    try {
      const res = await api.adminAiQuery(question.trim());
      setAnswer(res.data.answer);
    } catch (err) {
      setError(err.message || 'Could not get an answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Platform Insights</h2>
        <p className="mt-1 text-sm text-gray-500">
          Ask about pharmacy medicine stock across the network and how many patients used the public symptoms or medicine search page.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-brand-peach bg-white shadow-card">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything... e.g. Which pharmacies have Paracetamol? How many patients used the public page this week?"
          rows={4}
          className="w-full resize-none border-0 bg-transparent px-5 py-4 text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
        />
        <div className="flex items-center justify-end gap-4 border-t border-brand-peach/50 px-4 py-3">
          {error && <span className="mr-auto text-xs text-red-500">{error}</span>}
          <span className="text-[14px] text-gray-400">Admin only</span>
          <button
            type="button"
            onClick={ask}
            disabled={loading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {answer && (
        <div className="rounded-xl border border-gray-100 bg-orange-50 px-4 py-4 text-sm text-gray-800 whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
