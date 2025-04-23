// app/news/[id]/page.js
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import supabase from '@/lib/supabaseClient';

// 동적 메타데이터
export async function generateMetadata({ params }) {
  const article = await getArticle(params.id);
  
  if (!article) {
    return {
      title: '뉴스를 찾을 수 없음',
    };
  }
  
  return {
    title: `${article.title || '뉴스'} | 뉴스 모음`,
    description: article.summary || '뉴스 상세 내용',
    openGraph: {
      title: article.title,
      description: article.summary,
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

// 특정 뉴스 가져오기
async function getArticle(id) {
  const { data, error } = await supabase
    .from('crawled_contents')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching article:', error);
    return null;
  }
  
  return data;
}

// 추출된 콘텐츠 가져오기
async function getExtractedContent(articleId) {
  const { data, error } = await supabase
    .from('extracted_contents')
    .select('content, plain_text')
    .eq('source_id', articleId)
    .single();
  
  if (error) {
    console.error('Error fetching extracted content:', error);
    return null;
  }
  
  return data;
}

// 뉴스 콘텐츠 렌더링
function renderContent(extractedContent) {
  if (!extractedContent) {
    return <p className="text-gray-600">추출된 콘텐츠가 없습니다.</p>;
  }
  
  try {
    // JSON 형식으로 저장된 구조화된 콘텐츠 처리
    if (extractedContent.content) {
      const contentData = typeof extractedContent.content === 'string' 
        ? JSON.parse(extractedContent.content) 
        : extractedContent.content;
      
      // Google Cloud Blog 스타일 콘텐츠 구조 처리
      if (contentData.sections) {
        return (
          <div className="space-y-6">
            {contentData.sections.map((section, index) => (
              <div key={index} className="mb-8">
                {section.heading && (
                  <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
                )}
                <div 
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: section.content
                      .replace(/\n\n/g, '<br><br>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
                  }} 
                />
              </div>
            ))}
          </div>
        );
      }
    }
    
    // 일반 텍스트 처리
    if (extractedContent.plain_text) {
      return (
        <div className="prose prose-gray max-w-none whitespace-pre-line">
          {extractedContent.plain_text}
        </div>
      );
    }
    
    // JSON 형식으로 저장된 콘텐츠 구조를 이해할 수 없는 경우
    return <pre className="bg-gray-100 p-4 overflow-auto rounded">{JSON.stringify(extractedContent.content, null, 2)}</pre>;
    
  } catch (error) {
    console.error('Error rendering content:', error);
    return <p className="text-red-500">콘텐츠를 표시하는 중 오류가 발생했습니다.</p>;
  }
}

// 뉴스 상세 페이지 컴포넌트
export default async function ArticlePage({ params }) {
  const article = await getArticle(params.id);
  
  if (!article) {
    notFound();
  }
  
  const extractedContent = await getExtractedContent(article.id);
  
  // 날짜 포맷팅
  const formattedDate = article.published_at 
    ? format(new Date(article.published_at), 'PPP', { locale: ko })
    : '날짜 없음';
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* 뒤로가기 링크 */}
      <Link href="/" className="inline-flex items-center mb-6 text-blue-600 hover:underline">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        뉴스 목록으로
      </Link>
      
      {/* 헤더 */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
        
        <div className="flex items-center text-gray-600 mb-4">
          <span>{formattedDate}</span>
          <span className="mx-2">•</span>
          <span>{article.source || '출처 미상'}</span>
        </div>
        
        {article.summary && (
          <div className="bg-gray-50 border-l-4 border-gray-200 p-4 italic mb-6">
            {article.summary}
          </div>
        )}
      </header>
      
      {/* 이미지 */}
      {article.image_url && (
        <div className="relative h-64 md:h-96 w-full mb-8 rounded-lg overflow-hidden">
          <Image
            src={article.image_url}
            alt={article.title || '뉴스 이미지'}
            fill
            className="object-cover"
            unoptimized={true}
          />
        </div>
      )}
      
      {/* 원문 링크 */}
      <div className="mb-8">
        <Link 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          원문 사이트에서 보기
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>
      </div>
      
      {/* 콘텐츠 */}
      <article className="bg-white rounded-lg shadow-sm p-6 mb-8">
        {renderContent(extractedContent)}
      </article>
      
      {/* 하단 공유 버튼 등 (추후 구현 가능) */}
      <div className="border-t border-gray-200 pt-6 mt-6 text-gray-600">
        <p>콘텐츠 업데이트 시간: {article.updated_at ? format(new Date(article.updated_at), 'PPP p', { locale: ko }) : '정보 없음'}</p>
      </div>
    </div>
  );
}