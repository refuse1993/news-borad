// app/page.js
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import NewsCard from '@/components/NewsCard';
import SearchBar from '@/components/SearchBar';
import NewsFilters from '@/components/NewsFilters';
import supabase from '@/lib/supabaseClient';

export default function Home() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentSort, setCurrentSort] = useState('latest');
  const [searchTerm, setSearchTerm] = useState('');
  const [sources, setSources] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 12; // 한 번에 가져올 뉴스 수
  
  // 추가 뉴스 로딩
  const loadMoreNews = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNews(nextPage);
    }
  }, [loading, hasMore, page]);
  
  // 인피니티 스크롤을 위한 관찰자 설정
  const observer = useRef();
  const lastNewsElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreNews();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMoreNews]);

  // 뉴스 데이터 가져오기
  const fetchNews = async (pageNum = 0, isReset = false) => {
    if (isReset) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }
    
    try {
      // 기본 쿼리 설정
      let query = supabase
        .from('crawled_contents')
        .select('*');
      
      // 출처 필터 적용
      if (currentFilter !== 'all') {
        query = query.eq('source', currentFilter);
      }
      
      // 정렬 적용
      if (currentSort === 'latest') {
        query = query.order('published_at', { ascending: false });
      } else if (currentSort === 'oldest') {
        query = query.order('published_at', { ascending: true });
      }
      
      // 검색어 필터 적용 (title과 summary에서 검색)
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
      }
      
      // 페이지네이션 적용
      const from = pageNum * pageSize;
      query = query.range(from, from + pageSize - 1);
      
      // 쿼리 실행
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching news:', error);
        return;
      }

      // 더 가져올 데이터가 있는지 확인
      if (data.length < pageSize) {
        setHasMore(false);
      }

      // 이전 데이터와 합치기 (초기화하는 경우 제외)
      setNews(prev => isReset ? data : [...prev, ...data]);
    } catch (error) {
      console.error('Failed to fetch news:', error);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // 뉴스 데이터 초기화 및 재로딩
  const resetAndFetchNews = useCallback(() => {
    setNews([]);
    setPage(0);
    setHasMore(true);
    fetchNews(0, true);
  }, [currentFilter, currentSort, searchTerm]);

  // 출처 리스트 가져오기
  const fetchSources = async () => {
    try {
      const { data, error } = await supabase
        .from('crawled_contents')
        .select('source')
        .not('source', 'is', null);
      
      if (error) {
        console.error('Error fetching sources:', error);
        return;
      }

      // 중복 제거하고 출처 배열 생성
      const uniqueSources = [...new Set(data.map(item => item.source))].filter(Boolean);
      setSources(uniqueSources);
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    fetchSources();
    resetAndFetchNews();
  }, [resetAndFetchNews]);

  // 필터나 정렬, 검색어 변경 시 데이터 재로딩
  useEffect(() => {
    resetAndFetchNews();
  }, [currentFilter, currentSort, searchTerm, resetAndFetchNews]);

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
              {news.length}개의 뉴스
            </div>
          </div>
        </div>
        
        <NewsFilters 
          onFilterChange={handleFilterChange} 
          onSortChange={handleSortChange}
          sources={sources}
        />
      </div>
      
      {initialLoading ? (
        <div className="py-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">뉴스를 불러오는 중...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v10m2 2v-6m0 0V8m0 0h-6" />
          </svg>
          <h2 className="text-xl text-gray-700 mb-2">뉴스를 찾을 수 없습니다</h2>
          <p className="text-gray-500">검색어나 필터를 변경하여 다시 시도해보세요.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((article, index) => {
              // 마지막 요소에 ref 추가
              if (news.length === index + 1) {
                return (
                  <div ref={lastNewsElementRef} key={article.id}>
                    <NewsCard article={article} />
                  </div>
                );
              } else {
                return <NewsCard key={article.id} article={article} />;
              }
            })}
          </div>
          
          {loading && (
            <div className="py-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              <p className="mt-2 text-gray-600">더 많은 뉴스를 불러오는 중...</p>
            </div>
          )}
          
          {!hasMore && news.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              모든 뉴스를 불러왔습니다.
            </div>
          )}
        </>
      )}
    </div>
  );
}