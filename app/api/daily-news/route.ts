// app/api/daily-news/route.ts
import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabaseClient';
import { generateNewsDigest } from '@/lib/geminiClient';

// GET 요청 처리
export async function GET(request: NextRequest) {
  try {
    // URL에서 date 매개변수 가져오기
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const today = dateParam || new Date().toISOString().split('T')[0];
    
    // 오늘 날짜의 다이제스트가 이미 있는지 확인
    const { data: existingDigest } = await supabase
      .from('daily_news_digest')
      .select('*')
      .eq('date', today)
      .single();
      
    if (existingDigest) {
      return NextResponse.json({ success: true, data: existingDigest });
    }
    
    // 오늘의 최신 뉴스 가져오기 (최근 24시간)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const dayBeforeYesterday = new Date(yesterday);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 1);
    
    const { data: newsItems, error } = await supabase
      .from('crawled_contents')
      .select('title, url, summary, source, published_at')
      .gte('published_at', dayBeforeYesterday.toISOString())
      .lt('published_at', yesterday.toISOString())
      .order('published_at', { ascending: false });
      
    if (error || !newsItems || newsItems.length === 0) {
      return NextResponse.json(
        { success: false, error: '뉴스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // Gemini를 사용하여 HTML 생성
    const htmlContent = await generateNewsDigest(newsItems, today);
    
    // 생성된 HTML 저장
    const { data: newDigest, error: insertError } = await supabase
      .from('daily_news_digest')
      .insert({
        date: today,
        html_content: htmlContent
      })
      .select()
      .single();
      
    if (insertError) {
      return NextResponse.json(
        { success: false, error: '다이제스트 저장 실패' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: newDigest });
  } catch (error: any) {
    console.error('Error generating daily news:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST 요청 처리
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date } = body;
    
    if (!date) {
      return NextResponse.json(
        { success: false, error: '날짜가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 특정 날짜의 뉴스 가져오기
    const targetDate = new Date(date);
    const previousDay = new Date(targetDate);
    previousDay.setDate(previousDay.getDate() - 1);
    const twoDaysAgo = new Date(previousDay);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);
    
    const { data: newsItems, error } = await supabase
      .from('crawled_contents')
      .select('title, url, summary, source, published_at')
      .gte('published_at', twoDaysAgo.toISOString())
      .lt('published_at', previousDay.toISOString())
      .order('published_at', { ascending: false });
    
      
    if (error || !newsItems || newsItems.length === 0) {
      return NextResponse.json(
        { success: false, error: '해당 날짜에 뉴스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    // Gemini를 사용하여 HTML 생성
    const htmlContent = await generateNewsDigest(newsItems, date);
    
    // 기존 다이제스트 확인 및 업데이트/생성
    const { data: existingDigest } = await supabase
      .from('daily_news_digest')
      .select('id')
      .eq('date', date)
      .single();
      
    let result;
    
    if (existingDigest) {
      // 업데이트
      result = await supabase
        .from('daily_news_digest')
        .update({ html_content: htmlContent })
        .eq('id', existingDigest.id)
        .select()
        .single();
    } else {
      // 생성
      result = await supabase
        .from('daily_news_digest')
        .insert({
          date: date,
          html_content: htmlContent
        })
        .select()
        .single();
    }
    
    if (result.error) {
      return NextResponse.json(
        { success: false, error: '다이제스트 저장 실패' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('Error generating daily news:', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}