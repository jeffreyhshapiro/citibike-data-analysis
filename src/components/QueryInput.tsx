'use client';

import { useState } from 'react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  loading?: boolean;
}

export default function QueryInput({ onSubmit, loading = false }: QueryInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl">
      <div className="flex flex-col gap-2">
        <label htmlFor="query" className="text-sm font-semibold text-black">
          Ask a question about Citibike data
        </label>
        <div className="flex gap-2">
          <input
            id="query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g., Show monthly ridership growth for 2023"
            className="flex-1 p-4 border-2 border-black rounded-lg focus:ring-2 focus:ring-black focus:border-black bg-white text-black placeholder-gray-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-8 py-4 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold transition-colors border-2 border-black"
          >
            {loading ? 'Analyzing...' : 'Ask'}
          </button>
        </div>
      </div>

      {/* Example queries */}
      <div className="mt-4">
        <p className="text-xs text-black font-medium mb-2">Try these examples:</p>
        <div className="flex flex-wrap gap-2">
          {[
            'Show monthly ridership for 2023',
            'Compare e-bike vs classic bike usage',
            'What were the peak hours in summer?',
            'Most popular stations in June',
            'Busiest stations in the afternoon of April 1',
            'Average trip duration by hour on February 10'
          ].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuery(example)}
              disabled={loading}
              className="text-xs px-3 py-1 bg-white border-2 border-black hover:bg-gray-100 rounded-full text-black disabled:opacity-50 transition-colors font-medium"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
