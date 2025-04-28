// app/daily-news/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ArrowPathIcon, ListBulletIcon, Squares2X2Icon  } from '@heroicons/react/24/outline';

export default function DailyNewsPage() {
  const [newsHtml, setNewsHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list'); // 뷰 모드 상태 추가


  // 뉴스 다이제스트 가져오기
  const fetchNewsDigest = async (selectedDate: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/daily-news?date=${selectedDate}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '뉴스를 불러오는데 실패했습니다.');
      }
      
      if (data.success && data.data.html_content) {
        setNewsHtml(data.data.html_content);
      } else {
        setError('뉴스 콘텐츠를 찾을 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Error fetching news digest:', err);
      setError(err.message || '뉴스를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 뉴스 다이제스트 재생성
  const regenerateNewsDigest = async () => {
    setRegenerating(true);
    
    try {
      const response = await fetch('/api/daily-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '뉴스 재생성에 실패했습니다.');
      }
      
      if (data.success && data.data.html_content) {
        setNewsHtml(data.data.html_content);
      } else {
        setError('뉴스 콘텐츠를 생성할 수 없습니다.');
      }
    } catch (err: any) {
      console.error('Error regenerating news digest:', err);
      setError(err.message || '뉴스 재생성에 실패했습니다.');
    } finally {
      setRegenerating(false);
    }
  };

  // 날짜 변경 핸들러
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDate(newDate);
    fetchNewsDigest(newDate);
  };

  // 초기 로딩
  useEffect(() => {
    fetchNewsDigest(date);
  }, []);

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-gray-800">일간 뉴스</h1>
          <span className="text-xs text-gray-500">by Gemini AI</span>
        </div>
        
        <div className="flex items-center gap-2">
                    {/* 뷰 모드 토글 버튼 추가 */}
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 py-1 text-xs flex items-center gap-1 transition
                ${viewMode === 'list' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <ListBulletIcon className="h-3 w-3" />
              리스트
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2 py-1 text-xs flex items-center gap-1 transition border-l border-gray-300
                ${viewMode === 'grid' 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <Squares2X2Icon className="h-3 w-3" />
              그리드
            </button>
          </div>
          <input 
            type="date" 
            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={date}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
          />
          
          <button
            onClick={regenerateNewsDigest}
            disabled={regenerating}
            className="flex items-center gap-1 bg-primary-500 hover:bg-primary-600 text-white px-2 py-1 rounded text-xs transition disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-3 w-3 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? '생성 중' : '재생성'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-600">뉴스 다이제스트를 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-medium mb-2">오류가 발생했습니다</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => fetchNewsDigest(date)}
              className="mt-3 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded transition"
            >
              다시 시도
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div dangerouslySetInnerHTML={{ __html: newsHtml }} />
        </div>
      )}
    </div>
  );
}