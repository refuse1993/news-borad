// app/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import NewsCard from '@/components/NewsCard';
import SearchBar from '@/components/SearchBar';
import NewsFilters from '@/components/NewsFilters';
import supabase from '@/lib/supabaseClient';
import { NewspaperIcon } from '@heroicons/react/24/outline';

// Define the type for a news article based on your database schema
interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  image_url?: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all');
  const [currentSort, setCurrentSort] = useState('latest');
  const [searchTerm, setSearchTerm] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 12;

  // 뉴스 데이터 가져오기
  const fetchNews = useCallback(async (pageNum = 0, isReset = false): Promise<void> => {
    if (isReset) {
      setInitialLoading(true);
    } else {
      setLoading(true);
    }

    try {
      let query = supabase
        .from('crawled_contents')
        .select('*');

      if (currentFilter !== 'all') {
        query = query.eq('source', currentFilter);
      }

      if (currentSort === 'latest') {
        query = query.order('published_at', { ascending: false });
      } else if (currentSort === 'oldest') {
        query = query.order('published_at', { ascending: true });
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%`);
      }

      const from = pageNum * pageSize;
      query = query.range(from, from + pageSize - 1);

      const { data, error } = await query as { data: NewsArticle[] | null, error: any };

      if (error) {
        console.error('Error fetching news:', error);
        setHasMore(false);
        return;
      }

      if (!data || data.length === 0) {
        setHasMore(false);
        if (isReset) setNews([]);
        return;
      }

      if (data.length < pageSize) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      setNews(prev => isReset ? data : [...prev, ...data]);

    } catch (error) {
      console.error('Failed to fetch news:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [currentFilter, currentSort, searchTerm, pageSize]);

  // 추가 뉴스 로딩
  const loadMoreNews = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNews(nextPage);
    }
  }, [loading, hasMore, page, fetchNews]);

  // 인피니티 스크롤을 위한 관찰자 설정
  const observer = useRef<IntersectionObserver | null>(null);

  const lastNewsElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreNews();
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMoreNews]);

  // 뉴스 데이터 초기화 및 재로딩
  const resetAndFetchNews = useCallback(() => {
    setNews([]);
    setPage(0);
    setHasMore(true);
    fetchNews(0, true);
  }, [fetchNews]);

  // 출처 리스트 가져오기
  const fetchSources = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('crawled_contents')
        .select('source')
        .not('source', 'is', null);

      if (error) {
        console.error('Error fetching sources:', error);
        return;
      }

      if (data) {
        const uniqueSources = [...new Set(data.map(item => item.source).filter(Boolean))] as string[];
        setSources(uniqueSources);
      }
    } catch (error) {
      console.error('Failed to fetch sources:', error);
    }
  }, []);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  useEffect(() => {
    resetAndFetchNews();
  }, [currentFilter, currentSort, searchTerm, resetAndFetchNews]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filter: string) => {
    setCurrentFilter(filter);
  };

  const handleSortChange = (sort: string) => {
    setCurrentSort(sort);
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="mb-4">
        <SearchBar onSearch={handleSearch} />
      </div>
      
      <NewsFilters
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        sources={sources}
      />

      {initialLoading ? (
        <div className="py-12">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          </div>
          <p className="text-center mt-4 text-gray-600">뉴스를 불러오는 중...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl shadow-sm">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <NewspaperIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">뉴스를 찾을 수 없습니다</h2>
          <p className="text-gray-500 text-center max-w-md">검색어나 필터를 변경하여 다시 시도해보세요.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 mb-6">
            {news.map((article, index) => {
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

          {loading && hasMore && (
            <div className="py-6 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
              <p className="mt-2 text-sm text-gray-500">더 많은 뉴스를 불러오는 중...</p>
            </div>
          )}

          {!loading && !hasMore && news.length > 0 && (
            <div className="text-center py-6 text-sm text-gray-400">
              모든 뉴스를 불러왔습니다.
            </div>
          )}
        </>
      )}
    </div>
  );
}