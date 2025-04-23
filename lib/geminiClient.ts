// lib/geminiClient.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// API 키는 환경변수로 설정
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

if (!API_KEY) {
  console.error("GEMINI API KEY is not set!");
}

// Gemini API 인스턴스 생성
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generateNewsDigest(newsItems: any[], dateString?: string): Promise<string> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const prompt = `
      ${dateString || '오늘'}의 주요 뉴스를 아래 기사 목록을 기반으로 세련된 HTML 다이제스트 페이지로 생성해주세요.

오늘의 주요 뉴스를 아래 기사 목록을 기반으로 HTML 다이제스트 페이지로 생성해주세요.

## 기술 스택:
1. Tailwind CSS (CDN)

## 핵심 요구사항:
0. html 외 불필요한 설명 등은 제외
1. 모던하고 화려한 디자인으로 시각적 요소가 풍부한 레이아웃
2. 한눈에 중요 정보와 특이사항을 파악할 수 있는 구조
3. 적당히 작은 글자와 요소 크기와 한국어 친화적 디자인
4. 다양한 색상을 활용한 카테고리별 강조 효과
5. 모바일에 최적화된 반응형 디자인 (작고 컴팩트한 레이아웃)
6. 모든 제목 및 요약은 한국어로 번역하여 작성

## 중요: 토큰 한계를 고려하여
1. 모든 뉴스를 하나하나 나열하지 말고 주요 10-15개 뉴스만 선별하여 다이제스트에 포함할 것
2. 나머지 뉴스는 카테고리별로 묶어서 제목만 간단히 나열
3. 불필요한 반복이나 장황한 설명은 모두 제거

## 디자인 요소:
1. 상단에 전체 요약 내용 및 주요 키워드 표현
2. 주요 헤드라인 하이라이트 섹션 (작게)
3. 카테고리별 색상 코드 시스템 (위협 도메인 요소 별 다른 색)
4. 각 뉴스 카드에 카테고리 태그, 제목, 간결한 요약(한국어로 번역), 원본 링크 포함
5. 시각적 요소:
   - 카테고리 필터 버튼/탭으로 빠른 카테고리 접근
   - 색상 그라데이션과 그림자 효과로 시각적 깊이감 부여
   - 카테고리별 뉴스 개수를 직관적인 숫자 배지로 표시
   - 중요도에 따라 크기가 다른 뉴스 카드 디자인
6. 다양한 섹션 구분을 위한 색상/그림자 효과

## 기술 요구사항:
1. Tailwind CSS 클래스만 사용
2. 시맨틱 HTML 구조 활용
3. 부드러운 색상 전환과 미세한 애니메이션 (hover 효과 등)
4. 모바일 우선 설계 (작은 화면에서도 작은 폰트 및 요소로 가독성 유지)
5. 최소한의 스크롤로 주요 정보 접근 가능한 레이아웃

## 세부 레이아웃:
0. 모든 뉴스 기반 해당일 뉴스 전체 요약 (특이사항 공유 등)
1. 주요 키워드 및 주요 뉴스 하이라이트 섹션 (10개 이내)
2. 카테고리별 뉴스 목록 (제목 및 출처 간략히, 링크 포함)
3. 푸터: 색상만 깔끔하게

## 핵심 명령:
- 순수 HTML과 Tailwind CSS만으로 구현할 수 있는 요소에 집중하세요
- 실제 JavaScript 기능은 필요하지 않으며, 시각적 디자인에만 집중하세요
- Tailwind의 다양한 색상, 그림자, 크기 클래스를 활용하여 시각적으로 풍부한 디자인을 만드세요

뉴스 목록은 제공된 데이터를 활용하며, 시각적 효과는 데이터의 특성과 중요도에 따라 강조해주세요.
      
      날짜: ${dateString || '오늘'}
  
  뉴스 목록:
  ${newsItems.map((item, index) => (
    `${index + 1}. 제목: ${item.title}\n   요약: ${item.summary || '요약 없음'}\n   URL: ${item.url}\n   출처: ${item.source || '알 수 없음'}\n   발행일: ${new Date(item.published_at).toLocaleDateString('ko-KR')}\n`
  )).join('\n')}`;
  
      // 로깅 추가: 프롬프트 요청 시작
      console.log(`[${new Date().toISOString()}] 🚀 Gemini API 요청 시작`);
      console.log(`뉴스 항목 수: ${newsItems.length}, 날짜: ${dateString || '오늘'}`);
      
      const startTime = Date.now();
      const result = await model.generateContent(prompt);
      const endTime = Date.now();
      
      // 로깅 추가: 응답 시간
      console.log(`[${new Date().toISOString()}] ✅ Gemini API 응답 완료 (${(endTime - startTime) / 1000}초 소요)`);
      
      const response = await result.response;
      const text = response.text();
      
      // 응답 텍스트 일부 로깅 (너무 길 수 있으므로 일부만)
      console.log(`응답 텍스트 미리보기 (처음 200자): 
  ${text.substring(0, 200)}...`);
      
      // HTML 내용 유효성 검사 및 보정
      if (!text.includes('<html') && !text.includes('<body')) {
        console.log('완전한 HTML 구조가 아닙니다. 기본 HTML 템플릿으로 래핑합니다.');
        
        // 기본 HTML 구조로 래핑
        return `
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dateString || '오늘'}의 뉴스 다이제스트</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8">
      ${text}
    </div>
  </body>
  </html>`;
      }
      
      let cleanedHtml = text;
      if (text.startsWith('```html')) {
        cleanedHtml = text.replace(/^```html\n/, '').replace(/```$/, '');
      } else if (text.includes('<html') || text.includes('<body') || text.includes('<div')) {
        // 이미 HTML 형식이면 그대로 사용
        cleanedHtml = text;
      }
      
      return cleanedHtml;
    
    } catch (error) {
      // 오류 로깅 개선
      console.error(`[${new Date().toISOString()}] ❌ Gemini API 오류 발생:`, error);
      return `<div class="p-4 bg-red-100 text-red-800 rounded">
        <h2 class="font-bold mb-2">뉴스 다이제스트 생성 중 오류가 발생했습니다</h2>
        <p class="text-sm">오류 메시지: ${(error as Error).message || '알 수 없는 오류'}</p>
      </div>`;
    }
  }