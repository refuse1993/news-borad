// components/TagSearchInput.tsx
import { useState, useEffect, useRef } from 'react';
import { TagIcon, MagnifyingGlassIcon as SearchIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface TagInfo {
  name: string;
  count: number;
}

interface TagSearchInputProps {
  allTags: TagInfo[];
  selectedTag: string | null;
  onTagSelect: (tagName: string) => void;
}

export default function TagSearchInput({ allTags, selectedTag, onTagSelect }: TagSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [filteredTags, setFilteredTags] = useState<TagInfo[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // 검색어에 따라 태그 필터링
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTags([]);
      return;
    }

    const lowercaseQuery = searchQuery.toLowerCase();
    const filtered = allTags
      .filter(tag => tag.name.toLowerCase().includes(lowercaseQuery))
      .sort((a, b) => b.count - a.count) // 인기순 정렬
      .slice(0, 15); // 최대 15개까지만 표시

    setFilteredTags(filtered);
  }, [searchQuery, allTags]);

  // 외부 클릭 감지 후 결과창 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 태그 선택 핸들러
  const handleTagClick = (tagName: string) => {
    onTagSelect(tagName);
    setSearchQuery('');
    setShowResults(false);
  };

  // 검색창 포커스 핸들러
  const handleFocus = () => {
    if (searchQuery.trim() !== '') {
      setShowResults(true);
    }
  };

  // 검색어 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowResults(value.trim() !== '');
  };

  // 검색창 초기화 핸들러
  const handleClearSearch = () => {
    setSearchQuery('');
    setShowResults(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-4 w-4 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder="태그 검색..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        
        {searchQuery && (
          <button 
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      
      {/* 검색 결과 드롭다운 */}
      {showResults && filteredTags.length > 0 && (
        <div 
          ref={resultsRef}
          className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
        >
          <ul className="py-1">
            {filteredTags.map(tag => (
              <li key={tag.name}>
                <button
                  onClick={() => handleTagClick(tag.name)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className={selectedTag === tag.name ? "font-medium text-primary-600" : ""}>{tag.name}</span>
                  </div>
                  <span className="text-gray-400 text-xs">{tag.count}건</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {showResults && searchQuery && filteredTags.length === 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200">
          <div className="py-3 px-4 text-sm text-gray-500">
            "{searchQuery}"와 일치하는 태그가 없습니다.
          </div>
        </div>
      )}
    </div>
  );
}