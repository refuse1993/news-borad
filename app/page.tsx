// app/page.js
'use client';

import { useState, useEffect } from 'react';
import NewsCard from '@/components/NewsCard';
import SearchBar from '@/components/SearchBar';
import NewsFilters from '@/components/NewsFilters';
import supabase from '@/lib/supabaseClient';

// 메인 페이지
export default function Home() {
  const [news, setNews] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentSort, setCurrentSort] = useState('latest');
  const [searchTerm, setSearchTerm] = useState('');

  // 뉴스 데이터 가져오기
  useEffect(() => {
    async function fetchNews() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('crawled_contents')
          .select('*')
          .order('published_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Error fetching news:', error);
          return;
        }

        setNews(data || []);
        setFilteredNews(data || []);
      } catch (error) {
        console.error('Failed to fetch news:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, []);

  // 필터 적용
  useEffect(() => {
    let result = [...news];
    
    // 카테고리 필터
    if (currentFilter !== 'all') {
      result = result.filter(item => 
        item.category && 
        item.category.toLowerCase() === currentFilter.toLowerCase()
      );
    }
    
    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.title && item.title.toLowerCase().includes(term)) || 
        (item.summary && item.summary.toLowerCase().includes(term))
      );
    }
    
    // 정렬
    if (currentSort === 'latest') {
      result.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    } else if (currentSort === 'popular') {
      result.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    
    setFilteredNews(result);
  }, [news, currentFilter, currentSort, searchTerm]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
  };

  const handleSortChange = (sort) => {
    setCurrentSort(sort);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="md:flex-1">
            <SearchBar onSearch={handleSearch} />
          </div>
          <div className="flex justify-end">
            <div className="text-sm text-gray-500">
              {filteredNews.length}개의 뉴스
            </div>
          </div>
        </div>
        
        <NewsFilters 
          onFilterChange={handleFilterChange} 
          onSortChange={handleSortChange}
        />
      </div>
      
      {loading ? (
        <div className="py-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">뉴스를 불러오는 중...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v10m2 2v-6m0 0V8m0 0h-6" />
          </svg>
          <h2 className="text-xl text-gray-700 mb-2">뉴스를 찾을 수 없습니다</h2>
          <p className="text-gray-500">검색어나 필터를 변경하여 다시 시도해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNews.map(article => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}