// components/NewsCard.js
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function NewsCard({ article }) {
  // 날짜 포맷팅
  const formattedDate = article.published_at 
    ? format(new Date(article.published_at), 'PPP', { locale: ko })
    : '날짜 없음';

  // 출처별 색상 정의 (동적으로 생성)
  const getSourceColor = (source) => {
    const colors = {
      '경향신문': 'bg-red-100 text-red-800',
      '국민일보': 'bg-blue-100 text-blue-800',
      '동아일보': 'bg-yellow-100 text-yellow-800',
      '매일경제': 'bg-green-100 text-green-800',
      '서울신문': 'bg-purple-100 text-purple-800',
      '조선일보': 'bg-indigo-100 text-indigo-800',
      '중앙일보': 'bg-pink-100 text-pink-800',
      '한겨레': 'bg-cyan-100 text-cyan-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    
    return colors[source] || colors.default;
  };

  const sourceColor = article.source ? getSourceColor(article.source) : getSourceColor('default');

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <div className="relative aspect-video w-full overflow-hidden">
        {article.image_url ? (
          <Image
            src={article.image_url}
            alt={article.title || '뉴스 이미지'}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 hover:scale-105"
            unoptimized={true}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400 text-sm">이미지 없음</span>
          </div>
        )}
        
        {article.source && (
          <span className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-medium ${sourceColor}`}>
            {article.source}
          </span>
        )}
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <Link 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group"
        >
          <h2 className="text-lg font-semibold mb-2 line-clamp-2 text-gray-800 group-hover:text-primary-600 transition-colors">
            {article.title || '제목 없음'}
          </h2>
        </Link>
        
        <p className="text-gray-500 text-xs mb-3 flex items-center">
          <span className="inline-block mr-2">{formattedDate}</span>
        </p>
        
        {article.summary && (
          <p className="text-gray-600 text-sm line-clamp-3 mb-4">
            {article.summary}
          </p>
        )}
        
        <div className="mt-auto">
          <Link 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary-600 text-sm hover:underline inline-flex items-center group"
          >
            <span>원문 보기</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}