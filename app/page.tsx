// app/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import NewsCard from '@/components/NewsCard';
import SearchBar from '@/components/SearchBar';
import NewsFilters from '@/components/NewsFilters';
import supabase from '@/lib/supabaseClient';
import { NewspaperIcon, ArrowPathIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

// 뉴스 기사 인터페이스 정의 - 번역 및 태그 필드 추가
interface NewsArticle {
  id: number;
  title: string;
  summary: string;
  source: string;
  url: string;
  published_at: string;
  image_url?: string;
  translated_title?: string;
  translated_summary?: string;
  tags?: string[];
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
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [visibleTags, setVisibleTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
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
        query = query.or(`title.ilike.%${searchTerm}%,summary.ilike.%${searchTerm}%,translated_title.ilike.%${searchTerm}%,translated_summary.ilike.%${searchTerm}%`);
      }

      // 선택된 태그가 있으면 필터링
      if (selectedTags.length > 0) {
        selectedTags.forEach(tag => {
          query = query.contains('tags', [tag]);
        });
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
  }, [currentFilter, currentSort, searchTerm, selectedTags, pageSize]);

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

  // 인기 태그 가져오기
  const fetchPopularTags = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('crawled_contents')
        .select('tags')
        .not('tags', 'is', null);

      if (error) {
        console.error('Error fetching tags:', error);
        return;
      }

      if (data) {
        // 모든 태그 추출 및 카운트
        const allTags: { [key: string]: number } = {};
        
        data.forEach(item => {
          if (Array.isArray(item.tags)) {
            item.tags.forEach(tag => {
              allTags[tag] = (allTags[tag] || 0) + 1;
            });
          }
        });
        
        // 태그를 카운트 기준으로 정렬하고 상위 10개만 사용
        const popularTags = Object.entries(allTags)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([tag]) => tag);
          
        setVisibleTags(popularTags);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  }, []);

  // 스크롤 관련 로직
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 태그 선택 토글
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  useEffect(() => {
    fetchSources();
    fetchPopularTags();
  }, [fetchSources, fetchPopularTags]);

  useEffect(() => {
    resetAndFetchNews();
  }, [currentFilter, currentSort, searchTerm, selectedTags, resetAndFetchNews]);

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
    <div className="max-w-screen-xl mx-auto px-4 py-6">
      {/* 검색 및 필터 영역 */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 sticky top-0 z-10 border border-gray-100">
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} />
        </div>
        
        <NewsFilters
          onFilterChange={handleFilterChange}
          onSortChange={handleSortChange}
          sources={sources}
        />
        
        {/* 인기 태그 */}
        {visibleTags.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-medium text-gray-500">인기 태그:</span>
              {visibleTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2 py-1 rounded-md transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary-100 text-primary-700 font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 뉴스 목록 영역 */}
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
          {/* 선택된 태그 표시 */}
          {selectedTags.length > 0 && (
            <div className="flex items-center mb-4 py-2 px-4 bg-primary-50 rounded-lg">
              <span className="text-sm font-medium text-primary-700 mr-2">선택된 태그:</span>
              <div className="flex flex-wrap gap-2">
                {selectedTags.map(tag => (
                  <span 
                    key={tag}
                    className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-md flex items-center"
                  >
                    {tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="ml-1.5 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-primary-600 hover:text-primary-800 underline"
                >
                  모두 지우기
                </button>
              </div>
            </div>
          )}
        
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
      
      {/* 새로고침 버튼 */}
      <button
        onClick={resetAndFetchNews}
        className="fixed bottom-20 right-6 p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all z-20 text-primary-600 hover:text-primary-700 border border-gray-200"
        title="새로고침"
      >
        <ArrowPathIcon className="h-5 w-5" />
      </button>
      
      {/* 위로 스크롤 버튼 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-primary-500 rounded-full shadow-md hover:shadow-lg transition-all z-20 text-white hover:bg-primary-600"
          title="위로 이동"
        >
          <ChevronUpIcon className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}