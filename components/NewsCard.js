// components/NewsCard.js
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, ArrowRightIcon, NewspaperIcon, TagIcon, LanguageIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function NewsCard({ article, viewMode = 'list' }) {
  const [showTranslation, setShowTranslation] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [expandedTags, setExpandedTags] = useState(false);
  
  // 날짜 포맷팅 (간결하게)
  const formattedDate = article.published_at 
    ? format(new Date(article.published_at), 'yy.MM.dd', { locale: ko })
    : '-';

  // 출처 색상 - 더 간결한 해시 함수 사용
  const getSourceColor = (source) => {
    if (!source) return 'bg-gray-100 text-gray-700';
    
    // 해시 함수
    const hashCode = str => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    };
    
    const colors = [
      'bg-red-100 text-red-700', 'bg-amber-100 text-amber-700', 
      'bg-green-100 text-green-700', 'bg-teal-100 text-teal-700',
      'bg-sky-100 text-sky-700', 'bg-blue-100 text-blue-700', 
      'bg-indigo-100 text-indigo-700', 'bg-purple-100 text-purple-700'
    ];
    
    return colors[Math.abs(hashCode(source)) % colors.length];
  };

  // 태그 색상
  const getTagColor = (tag) => {
    if (!tag) return 'bg-gray-100 text-gray-700';
    
    const hashCode = str => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    };
    
    const colors = [
      'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700', 'bg-indigo-100 text-indigo-700',
      'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700'
    ];
    
    return colors[Math.abs(hashCode(tag)) % colors.length];
  };

  // 커스텀 ID 생성 (article.id가 없을 경우를 대비)
  const cardId = article.id || `news-${article.title?.substring(0, 10) || Math.random().toString(36).substring(7)}`;
  
  const hasTranslation = article.translated_title || article.translated_summary;
  const sourceColor = getSourceColor(article.source);
  
  // 태그/요약 외부 클릭 감지 이벤트 리스너
  useEffect(() => {
    // 태그가 확장된 상태일 때만 이벤트 리스너 추가
    if (expandedTags) {
      const handleClickOutside = (event) => {
        const tagContainer = document.getElementById(`tag-container-${cardId}`);
        if (tagContainer && !tagContainer.contains(event.target)) {
          setExpandedTags(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [expandedTags, cardId]);

  useEffect(() => {
    // 요약이 확장된 상태일 때만 이벤트 리스너 추가
    if (expanded) {
      const handleClickOutside = (event) => {
        const summaryContainer = document.getElementById(`summary-container-${cardId}`);
        if (summaryContainer && !summaryContainer.contains(event.target)) {
          setExpanded(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [expanded, cardId]);
  
  return (
    <div className={`group bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow transition-all duration-200 h-full ${
      viewMode === 'grid' ? 'flex-col' : ''
    }`}>
      <div className={`flex ${viewMode === 'grid' ? 'flex-col h-full' : 'h-full'}`}>
          {/* 썸네일 영역 (그리드 뷰일 때는 더 크게) */}
          <div className={`relative ${
              viewMode === 'grid' 
                ? 'w-full h-32' 
                : 'min-w-[60px] max-w-[60px]'
            }`}>
              {article.image_url ? (
                <Image
                  src={article.image_url}
                  alt={article.title || '뉴스 이미지'}
                  fill
                  sizes={viewMode === 'grid' ? "100%" : "60px"}
                  className={`object-cover ${
                    viewMode === 'grid' 
                      ? 'rounded-t-lg' 
                      : 'h-full rounded-l-lg'
                  }`}
                  unoptimized={true}
                />
              ) : (
                <div className={`w-full h-full bg-gray-100 flex items-center justify-center ${
                  viewMode === 'grid' 
                    ? 'rounded-t-lg' 
                    : 'rounded-l-lg'
                }`}>
                  <NewspaperIcon className={`${
                    viewMode === 'grid' 
                      ? 'w-12 h-12' 
                      : 'w-4 h-4'
                  } text-gray-400`} />
                </div>
              )}
            </div>
        
        {/* 컨텐츠 영역 */}
        <div className={`flex-1 p-2.5 flex flex-col overflow-hidden ${
          viewMode === 'grid' ? 'p-4' : ''
        }`}>
          {/* 상단 메타 정보 (출처, 날짜) */}
          <div className={`flex items-center justify-between mb-1.5 text-xs gap-1 ${
            viewMode === 'grid' ? 'mb-2' : ''
          }`}>
            {article.source && (
              <span 
                className={`inline-flex items-center px-1.5 py-0.5 rounded-full ${sourceColor} max-w-[120px] truncate`}
                title={article.source}
              >
                <span className="truncate">{article.source}</span>
              </span>
            )}
            
            <span className="text-gray-400 flex items-center flex-shrink-0">
              <CalendarIcon className="w-3 h-3 mr-0.5" />
              {formattedDate}
            </span>
          </div>
          
          {/* 제목 (그리드 뷰일 때는 더 크게) */}
          <Link 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="group"
          >
            <h2 className={`${
              viewMode === 'grid' 
                ? 'text-base font-semibold mb-2' 
                : 'text-sm font-medium mb-1'
            } line-clamp-2 text-gray-800 group-hover:text-blue-600 transition-colors`}>
              {showTranslation && article.translated_title ? article.translated_title : article.title || '제목 없음'}
            </h2>
          </Link>
          
          {/* 요약 (그리드 뷰일 때는 더 많은 텍스트 표시) */}
          {(article.summary || article.translated_summary) && (
            <div className={`mb-1.5 text-xs text-gray-500 ${
              viewMode === 'grid' ? 'text-sm mb-3' : ''
            }`} id={`summary-container-${cardId}`}>
              <div className={expanded ? '' : (viewMode === 'grid' ? 'line-clamp-3' : 'line-clamp-1')}>
                {showTranslation && article.translated_summary ? article.translated_summary : article.summary}
              </div>
              {((article.summary && article.summary.length > 60) || 
                (article.translated_summary && article.translated_summary.length > 60)) && (
                <button 
                  onClick={() => setExpanded(!expanded)} 
                  className="mt-0.5 inline-flex items-center text-blue-500 hover:text-blue-600 group"
                  aria-label={expanded ? "접기" : "펼치기"}
                >
                  <ChevronDownIcon className={`w-3 h-3 mr-0.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  <span className="text-xs">{expanded ? "접기" : "더보기"}</span>
                </button>
              )}
            </div>
          )}
          
          {/* 태그 (펼치기 기능 포함) */}
          {article.tags && article.tags.length > 0 && (
            <div className={`mb-1.5 ${viewMode === 'grid' ? 'mb-3' : ''}`} id={`tag-container-${cardId}`}>
              <div className="flex flex-wrap gap-1">
                {(expandedTags ? article.tags : article.tags.slice(0, viewMode === 'grid' ? 3 : 2)).map((tag, index) => (
                  <span 
                    key={index}
                    className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${getTagColor(tag)}`}
                  >
                    <TagIcon className="w-2 h-2 mr-0.5" />
                    <span className="truncate max-w-[80px]">{tag}</span>
                  </span>
                ))}
                {!expandedTags && article.tags.length > (viewMode === 'grid' ? 3 : 2) && (
                  <button 
                    onClick={() => setExpandedTags(true)}
                    className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    aria-label="태그 더 보기"
                  >
                    <span>+{article.tags.length - (viewMode === 'grid' ? 3 : 2)}</span>
                    <ChevronDownIcon className="w-2.5 h-2.5 ml-0.5" />
                  </button>
                )}
              </div>
              {expandedTags && (
                <button 
                  onClick={() => setExpandedTags(false)} 
                  className="text-xs text-blue-500 hover:text-blue-600 mt-1 inline-flex items-center group"
                  aria-label="태그 접기"
                >
                  <ChevronDownIcon className="w-3 h-3 mr-0.5 rotate-180" />
                  <span>접기</span>
                </button>
              )}
            </div>
          )}
          
          {/* 하단 액션 영역 */}
          <div className={`mt-auto flex items-center justify-between text-xs ${
            viewMode === 'grid' ? 'text-sm' : ''
          }`}>
            {/* 번역 토글 */}
            {hasTranslation && (
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`flex items-center ${showTranslation ? 'text-blue-600' : 'text-gray-500'}`}
              >
                <LanguageIcon className={`${viewMode === 'grid' ? 'w-4 h-4' : 'w-3 h-3'} mr-0.5`} />
                {showTranslation ? '원문' : '번역'}
              </button>
            )}
            
            {/* 원문 링크 */}
            <Link 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 flex items-center ml-auto"
            >
              <span>원문</span>
              <ArrowRightIcon className={`${viewMode === 'grid' ? 'h-4 w-4' : 'h-3 w-3'} ml-0.5 group-hover:translate-x-0.5 transition-transform`} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}