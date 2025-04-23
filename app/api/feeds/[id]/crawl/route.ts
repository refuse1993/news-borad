import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { XMLParser } from 'fast-xml-parser';

// 피드 항목 타입 정의
interface FeedItem {
  title: string;
  url: string;
  summary: string | null;
  published_at: string;
  source: string;
  image_url: string | null;
  guid: string;
  extracted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const feedId = params.id;
  let feed: any = null;

  try {
    // 1. 피드 정보 가져오기
    const { data: feedData, error: feedError } = await supabase
      .from('rss_feeds')
      .select('*')
      .eq('id', feedId)
      .single();

    if (feedError || !feedData) {
      return NextResponse.json(
        { error: '피드를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    feed = feedData;

    // 2. RSS 피드 가져오기
    const response = await fetch(feed.url, {
      headers: {
        'User-Agent': 'RSS Feed Crawler (NodeJS)',
      },
    });

    if (!response.ok) {
      throw new Error(`피드 가져오기 실패: HTTP ${response.status}`);
    }

    const xmlContent = await response.text();
    
    // 3. XML 파싱
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });
    
    const parsedData = parser.parse(xmlContent);
    
    // 4. 피드 형식에 따라 항목 추출 (RSS 또는 Atom)
    const feedItems: FeedItem[] = [];
    
    // RSS 형식 처리
    if (parsedData.rss && parsedData.rss.channel) {
      const channel = parsedData.rss.channel;
      const items = Array.isArray(channel.item) ? channel.item : [channel.item];
      
      feedItems.push(...items.map((item: any) => ({
        title: item.title,
        url: item.link,
        summary: item.description,
        published_at: item.pubDate || item.pubdate,
        source: feed.source,
        image_url: extractImageUrl(item),
        guid: item.guid ? (item.guid['#text'] || item.guid) : item.link
      })));
    } 
    // Atom 형식 처리
    else if (parsedData.feed && parsedData.feed.entry) {
      const entries = Array.isArray(parsedData.feed.entry) ? 
        parsedData.feed.entry : [parsedData.feed.entry];
      
      feedItems.push(...entries.map((entry: any) => ({
        title: entry.title && (entry.title['#text'] || entry.title),
        url: entry.link ? (entry.link['@_href'] || entry.link) : null,
        summary: entry.summary || (entry.content ? entry.content['#text'] || entry.content : null),
        published_at: entry.published || entry.updated,
        source: feed.source,
        image_url: extractImageUrl(entry),
        guid: entry.id || (entry.link ? (entry.link['@_href'] || entry.link) : null)
      })));
    } else {
      throw new Error('지원되지 않는 피드 형식입니다.');
    }
    
    // 유효한 항목만 필터링 (제목과 URL이 있고 날짜가 유효한 항목)
    const validItems = feedItems.filter(item => 
      item.title && item.url && isValidDate(item.published_at)
    ).map(item => ({
      ...item,
      published_at: new Date(item.published_at).toISOString(),
      extracted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    if (validItems.length === 0) {
      throw new Error('유효한 피드 항목이 없습니다.');
    }
    
    // 5. 데이터베이스에 저장 (crawled_contents 테이블)
    // URL을 기준으로 중복 확인
    const savedItems = [];
    const skippedUrls = [];
    
    for (const item of validItems) {
      // 기존 항목 확인
      const { data: existingItem, error } = await supabase
        .from('crawled_contents')
        .select('id, url')
        .eq('url', item.url)
        .maybeSingle();
      
      if (existingItem) {
        // 이미 존재하는 항목은 건너뜀
        skippedUrls.push(item.url);
        continue;
      }
      
      // 새 항목 추가
      const { data: insertedItem, error: insertError } = await supabase
        .from('crawled_contents')
        .insert([{
          title: item.title,
          url: item.url,
          summary: item.summary,
          source: item.source,
          image_url: item.image_url,
          published_at: item.published_at,
          extracted_at: item.extracted_at
        }])
        .select()
        .single();
      
      if (insertError) {
        console.error('항목 저장 오류:', insertError);
      } else if (insertedItem) {
        // 저장된 항목의 필수 정보만 응답에 포함
        savedItems.push({
          id: insertedItem.id,
          title: insertedItem.title,
          url: insertedItem.url,
          source: insertedItem.source,
          published_at: insertedItem.published_at,
          has_image: !!insertedItem.image_url
        });
      }
    }
    
    // 6. 피드 정보 업데이트
    const now = new Date().toISOString();
    
    const { error: updateError } = await supabase
      .from('rss_feeds')
      .update({
        last_crawled: now,
        error_count: 0,
        last_error: null
      })
      .eq('id', feedId);

    if (updateError) {
      throw new Error('피드 업데이트 실패');
    }

    return NextResponse.json({
      success: true,
      message: `${savedItems.length}개의 새 항목이 저장되었습니다.`,
      timestamp: now,
      feed: {
        id: feed.id,
        name: feed.name,
        source: feed.source
      },
      stats: {
        processed: validItems.length,
        saved: savedItems.length,
        skipped: skippedUrls.length
      },
      saved_items: savedItems
    }, { status: 200 });

  } catch (error) {
    console.error('피드 크롤링 중 오류 발생:', error);
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    
    // 오류 발생 시 피드의 오류 카운트를 증가
    if (feed) {
      try {
        await supabase
          .from('rss_feeds')
          .update({
            error_count: feed.error_count + 1,
            last_error: errorMessage
          })
          .eq('id', feedId);
      } catch (updateError) {
        console.error('오류 상태 업데이트 실패:', updateError);
      }
    }

    return NextResponse.json(
      { 
        error: `피드 크롤링 중 오류가 발생했습니다: ${errorMessage}`,
        feed_id: feedId
      },
      { status: 500 }
    );
  }
}

// 이미지 URL 추출 함수 - 타입 지정
function extractImageUrl(item: Record<string, any>): string | null {
  // 1. 미디어 콘텐츠 확인
  if (item['media:content'] && item['media:content']['@_url']) {
    return item['media:content']['@_url'];
  }
  
  // 2. 미디어 썸네일 확인
  if (item['media:thumbnail'] && item['media:thumbnail']['@_url']) {
    return item['media:thumbnail']['@_url'];
  }
  
  // 3. 인클로저 확인
  if (item.enclosure && item.enclosure['@_type'] && 
      item.enclosure['@_type'].startsWith('image/') && 
      item.enclosure['@_url']) {
    return item.enclosure['@_url'];
  }
  
  // 4. 설명에서 이미지 태그 추출
  if (item.description || item.summary || item.content) {
    const content = item.description || item.summary || 
                   (item.content ? item.content['#text'] || item.content : '');
    
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
  }
  
  return null;
}

// 날짜 유효성 검사 함수
function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}