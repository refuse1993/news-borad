// components/NewsFilters.js
'use client';
import { useState, useRef, useEffect } from 'react';
import { FunnelIcon, AdjustmentsHorizontalIcon, ChevronDownIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function NewsFilters({ onFilterChange, onSortChange, sources = [] }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSort, setActiveSort] = useState('latest');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [categorizedSources, setCategorizedSources] = useState({ 
    popular: [], 
    all: [] 
  });
  
  const dropdownRef = useRef(null);
  const filterRef = useRef(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 출처 카테고리화
  useEffect(() => {
    // 인기 출처 (예시 - 실제로는 사용 빈도 등에 따라 결정할 수 있음)
    const popularSourceList = [
      'Cisco Talos', 'Crowdstrike', 'Google Cloud (Mandiant)', 
      'Kaspersky', 'Microsoft Security Blog', 'Check Point Research',
      'ESET', 'Trend Micro', 'The Hacker News', 'Cloudflare'
    ];
    
    const popular = sources.filter(source => popularSourceList.includes(source));
    
    // 모든 출처 (검색어 필터링)
    const filteredSources = searchFilter 
      ? sources.filter(source => source.toLowerCase().includes(searchFilter.toLowerCase()))
      : sources;
    
    setCategorizedSources({
      popular,
      all: filteredSources
    });
  }, [sources, searchFilter]);

  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    onFilterChange(filterId);
    
    // 출처를 선택하면 필터 드롭다운 닫기
    if (filterId !== 'all') {
      setFiltersOpen(false);
    }
  };

  const handleSortChange = (sortId) => {
    setActiveSort(sortId);
    onSortChange(sortId);
    setDropdownOpen(false);
  };

  const handleSearchFilterChange = (e) => {
    setSearchFilter(e.target.value);
  };

  const clearSearchFilter = () => {
    setSearchFilter('');
  };

  return (
    <div className="sticky top-0 z-10 bg-white rounded-lg shadow-sm p-3 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`mr-2 p-2 rounded-full hover:bg-gray-100 text-gray-600 ${filtersOpen ? 'bg-gray-100' : ''}`}
            aria-label="필터 토글"
          >
            <FunnelIcon className="h-5 w-5" />
          </button>
          
          <h2 className="text-base font-medium text-gray-700 max-w-[180px] md:max-w-none truncate">
            {activeFilter === 'all' ? '모든 뉴스' : activeFilter}
          </h2>
          
          {activeFilter !== 'all' && (
            <button 
              onClick={() => handleFilterChange('all')}
              className="ml-2 text-xs text-gray-400 hover:text-gray-600"
            >
              초기화
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500 mr-1 hidden md:block">정렬:</div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center p-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100"
            >
              {activeSort === 'latest' ? '최신순' : '오래된순'}
              <ChevronDownIcon className="h-4 w-4 ml-1" />
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-lg z-50 py-1">
                <button
                  onClick={() => handleSortChange('latest')}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    activeSort === 'latest' ? 'bg-gray-100 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  최신순
                </button>
                <button
                  onClick={() => handleSortChange('oldest')}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    activeSort === 'oldest' ? 'bg-gray-100 text-primary-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  오래된순
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 확장 가능한 필터 영역 */}
      {filtersOpen && (
        <div className="mt-3 pt-3 border-t border-gray-100" ref={filterRef}>
          {/* 출처 검색창 */}
          <div className="mb-3 relative">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="출처 검색..."
                value={searchFilter}
                onChange={handleSearchFilterChange}
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              {searchFilter && (
                <button 
                  onClick={clearSearchFilter}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
          
          {/* 인기 출처 */}
          {categorizedSources.popular.length > 0 && !searchFilter && (
            <div className="mb-3">
              <h3 className="text-xs font-medium text-gray-500 mb-2">인기 출처</h3>
              <div className="flex flex-wrap gap-1.5">
                {categorizedSources.popular.map((source) => (
                  <button
                    key={source}
                    onClick={() => handleFilterChange(source)}
                    className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                      activeFilter === source
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* 모든 출처 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-medium text-gray-500">
                {searchFilter ? '검색 결과' : '모든 출처'}
              </h3>
              <span className="text-xs text-gray-400">
                {categorizedSources.all.length}개
              </span>
            </div>
            
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1 pb-1">
              <button
                onClick={() => handleFilterChange('all')}
                className={`px-2.5 py-1 text-xs rounded-full transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체
              </button>
              
              {categorizedSources.all.map((source) => (
                <button
                  key={source}
                  onClick={() => handleFilterChange(source)}
                  className={`px-2.5 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                    activeFilter === source
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {source}
                </button>
              ))}
              
              {categorizedSources.all.length === 0 && searchFilter && (
                <div className="w-full text-center py-2 text-sm text-gray-500">
                  검색 결과가 없습니다
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}