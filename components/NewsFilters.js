// components/NewsFilters.js
'use client';

import { useState } from 'react';

export default function NewsFilters({ onFilterChange, onSortChange }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('latest');

  const categories = [
    { id: 'all', name: '전체' },
    { id: 'politics', name: '정치' },
    { id: 'economy', name: '경제' },
    { id: 'society', name: '사회' },
    { id: 'culture', name: '문화' },
    { id: 'sports', name: '스포츠' },
    { id: 'international', name: '국제' },
    { id: 'tech', name: '기술' },
    { id: 'health', name: '건강' },
  ];

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
            onClick={() => handleSortChange('popular')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              activeSort === 'popular' 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            인기순
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 pb-2 overflow-x-auto scrollbar-hide">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => handleFilterChange(category.id)}
            className={`px-3 py-1.5 text-sm rounded-md whitespace-nowrap transition-colors ${
              activeFilter === category.id
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}