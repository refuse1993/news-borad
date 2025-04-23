'use client';

import { useState, useEffect } from 'react';
import { NewspaperIcon, CalendarIcon, ClockIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import supabase from '@/lib/supabaseClient';
import NewsCard from './NewsCard';

interface Article {
  id: string;
  title: string;
  translated_title?: string;
  summary?: string;
  translated_summary?: string;
  source: string;
  url: string;
  published_at: string;
  tags: string[];
}

interface TagRelatedArticlesProps {
  tagName: string;
  limit?: number;
}

export default function TagRelatedArticles({ tagName, limit = 5 }: TagRelatedArticlesProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = limit;

  // 태그 관련 기사 로드
  const fetchArticles = async (page = 1) => {
    if (!tagName) return;
    
    setLoading(true);
    try {
      // 전체 기사 수 조회
      const { count, error: countError } = await supabase
        .from('crawled_contents')
        .select('id', { count: 'exact' })
        .contains('tags', [tagName]);
      
      if (!countError) {
        setTotalCount(count || 0);
      }

      // 기사 페이지 조회
      const { data, error } = await supabase
        .from('crawled_contents')
        .select('id, title, translated_title, summary, translated_summary, source, url, published_at, tags')
        .contains('tags', [tagName])
        .order('published_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) {
        console.error('기사 로딩 오류:', error);
        return;
      }

      setArticles(data || []);
    } catch (error) {
      console.error('기사 데이터 처리 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles(page);
  }, [tagName, page]);

  // 소스 이름 간소화
  const simplifySource = (source: string) => {
    // URL에서 도메인만 추출
    if (source.startsWith('http')) {
      try {
        const url = new URL(source);
        return url.hostname.replace('www.', '');
      } catch (e) {
        return source;
      }
    }
    return source;
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('ko-KR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 flex items-center">
          <NewspaperIcon className="h-4 w-4 mr-1 text-primary-600" />
          <span className="text-primary-600">{tagName} </span> 관련 기사 
          {totalCount > 0 && <span className="text-gray-500 ml-1">({totalCount})</span>}
        </h3>
        
        {/* 페이지네이션 */}
        {totalCount > pageSize && (
          <div className="flex space-x-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className={`px-2 py-1 text-xs rounded ${
                page === 1 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              이전
            </button>
            <span className="px-2 py-1 text-xs text-gray-500">
              {page} / {Math.ceil(totalCount / pageSize)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(totalCount / pageSize)}
              className={`px-2 py-1 text-xs rounded ${
                page >= Math.ceil(totalCount / pageSize)
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              다음
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <>
          {articles.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500 text-sm">
              <NewspaperIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>관련 기사가 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}