// components/NewsFilters.js
'use client';
import { useState } from 'react';

/**
 * @param {{
 *   onFilterChange: (filter: string) => void,
 *   onSortChange: (sort: string) => void,
 *   sources: string[],
 * }} props
 */
export default function NewsFilters({ onFilterChange, onSortChange, sources = [] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('latest');

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    onFilterChange(filterId);
  };

  const handleSortChange = (sortId) => {
    setActiveSort(sortId);
    onSortChange(sortId);
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">최신 뉴스</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleSortChange('latest')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeSort === 'latest'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            최신순
          </button>
          <button
            onClick={() => handleSortChange('oldest')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeSort === 'oldest'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            오래된순
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
            activeFilter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
          }`}
        >
          전체
        </button>

        {sources.map((source) => (
          <button
            key={source}
            onClick={() => handleFilterChange(source)}
            className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
              activeFilter === source
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {source}
          </button>
        ))}
      </div>
    </div>
  );
}