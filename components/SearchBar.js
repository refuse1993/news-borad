// components/SearchBar.js
'use client';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function SearchBar({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  const handleSearch = (value) => {
    setSearchTerm(value);
    
    // 디바운싱 - 타이핑 멈추면 검색 실행
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      onSearch(value);
    }, 500);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearch('');
    inputRef.current.focus();
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative group transition-all duration-200 rounded-lg ${
      isFocused ? 'ring-2 ring-primary-200 bg-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100'
    }`}>
      <div className="flex items-center">
        <div className="pl-3 flex items-center text-gray-400">
          <MagnifyingGlassIcon className="h-5 w-5" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          placeholder="뉴스 검색..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full py-2.5 px-3 bg-transparent border-none focus:outline-none text-gray-700 placeholder-gray-400"
        />
        
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="pr-3 text-gray-400 hover:text-gray-600"
            aria-label="검색어 지우기"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}