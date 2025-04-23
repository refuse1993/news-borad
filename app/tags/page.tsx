'use client';

import { useState, useEffect, useCallback } from 'react';
import { TagIcon, ArrowsRightLeftIcon, ChartBarIcon, NewspaperIcon } from '@heroicons/react/24/outline';
import supabase from '@/lib/supabaseClient';
import TagSearchInput from '../../components/TagSearchInput';
import TagRelationshipGraph from '../../components/TagRelationshipGraph';
import TagTrendChart from '../../components/TagTrendChart';
import TagClusterView from '../../components/TagClusterView';
import TagRelatedArticles from '../../components/TagRelatedArticles';

// 기본 타입 정의
interface TagInfo {
  name: string;
  count: number;
}

interface TagRelation {
  source: string;
  target: string;
  strength: number;
}

interface TagTrend {
  date: string;
  tag: string;
  count: number;
}

export default function TagsPage() {
  const [allTags, setAllTags] = useState<TagInfo[]>([]);
  const [popularTags, setPopularTags] = useState<TagInfo[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [relatedTags, setRelatedTags] = useState<TagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'relations' | 'trends' | 'clusters'>('relations');
  const [tagRelations, setTagRelations] = useState<TagRelation[]>([]);
  const [tagTrends, setTagTrends] = useState<TagTrend[]>([]);

  // 모든 태그 로드
  const fetchAllTags = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crawled_contents')
        .select('tags')
        .not('tags', 'is', null);

      if (error) {
        console.error('태그 로딩 오류:', error);
        return;
      }

      // 태그 카운팅
      const tagCounts: Record<string, number> = {};
      data?.forEach(item => {
        if (Array.isArray(item.tags)) {
          item.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // 태그 정보 배열로 변환
      const tagInfoArray: TagInfo[] = Object.entries(tagCounts).map(([name, count]) => ({
        name,
        count
      }));

      // 인기 태그(상위 20개) 설정
      const sortedTags = [...tagInfoArray].sort((a, b) => b.count - a.count);
      setAllTags(tagInfoArray);
      setPopularTags(sortedTags.slice(0, 20));

      // 초기 선택 태그 설정 (가장 인기있는 태그)
      if (sortedTags.length > 0 && !selectedTag) {
        setSelectedTag(sortedTags[0].name);
      }
    } catch (error) {
      console.error('태그 데이터 처리 오류:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedTag]);

  // 태그 관계 데이터 로드
  const fetchTagRelations = useCallback(async (tagName: string) => {
    if (!tagName) return;
    
    try {
      // 선택된 태그가 포함된 기사 ID 가져오기
      const { data: articles, error: articlesError } = await supabase
        .from('crawled_contents')
        .select('id, tags')
        .contains('tags', [tagName])
        .not('tags', 'is', null);

      if (articlesError) {
        console.error('관련 기사 로딩 오류:', articlesError);
        return;
      }

      if (!articles || articles.length === 0) {
        setRelatedTags([]);
        setTagRelations([]);
        return;
      }

      // 관련 태그 카운팅
      const relatedTagCounts: Record<string, number> = {};
      articles.forEach(article => {
        if (Array.isArray(article.tags)) {
          article.tags.forEach(tag => {
            if (tag !== tagName) {
              relatedTagCounts[tag] = (relatedTagCounts[tag] || 0) + 1;
            }
          });
        }
      });

      // 관련 태그 정보 배열로 변환 및 정렬
      const relatedTagsArray: TagInfo[] = Object.entries(relatedTagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15); // 상위 15개만 표시

      setRelatedTags(relatedTagsArray);

      // 태그 관계 데이터 구성
      const relations: TagRelation[] = relatedTagsArray.map(tag => ({
        source: tagName,
        target: tag.name,
        strength: tag.count / articles.length // 기사 수 대비 동시 등장 비율
      }));

      setTagRelations(relations);

    } catch (error) {
      console.error('태그 관계 분석 오류:', error);
    }
  }, []);

  // 태그 트렌드 데이터 로드
  const fetchTagTrends = useCallback(async (tagName: string) => {
    if (!tagName) return;
    
    try {
      const { data, error } = await supabase
        .from('crawled_contents')
        .select('published_at, tags')
        .contains('tags', [tagName])
        .not('tags', 'is', null)
        .order('published_at', { ascending: true });

      if (error) {
        console.error('태그 트렌드 로딩 오류:', error);
        return;
      }

      if (!data || data.length === 0) {
        setTagTrends([]);
        return;
      }

      // 주 단위로 그룹화
      const weeklyTrends: Record<string, number> = {};
      data.forEach(item => {
        if (item.published_at) {
          // 주 단위로 날짜 포맷팅 (YYYY-WW)
          const date = new Date(item.published_at);
          const year = date.getFullYear();
          const weekNum = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
          const weekKey = `${year}-W${weekNum.toString().padStart(2, '0')}`;
          
          weeklyTrends[weekKey] = (weeklyTrends[weekKey] || 0) + 1;
        }
      });

      // 트렌드 데이터 변환
      const trendData: TagTrend[] = Object.entries(weeklyTrends).map(([date, count]) => ({
        date,
        tag: tagName,
        count
      }));

      setTagTrends(trendData);

    } catch (error) {
      console.error('태그 트렌드 분석 오류:', error);
    }
  }, []);

  // 선택된 태그 변경 시 관련 데이터 로드
  useEffect(() => {
    if (selectedTag) {
      fetchTagRelations(selectedTag);
      fetchTagTrends(selectedTag);
    }
  }, [selectedTag, fetchTagRelations, fetchTagTrends]);

  // 초기 데이터 로드
  useEffect(() => {
    fetchAllTags();
  }, [fetchAllTags]);

  // 태그 선택 핸들러
  const handleTagSelect = (tagName: string) => {
    setSelectedTag(tagName);
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-16">
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 sticky top-16 z-10 border border-gray-100">
        <h1 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <TagIcon className="h-5 w-5 mr-2 text-primary-600" />
          태그 분석
        </h1>
        
        {/* 태그 검색 */}
        <TagSearchInput 
          allTags={allTags} 
          onTagSelect={handleTagSelect}
          selectedTag={selectedTag}
        />
        
        {/* 인기 태그 */}
        <div className="mt-4">
          <div className="text-xs font-medium text-gray-500 mb-2">인기 태그:</div>
          <div className="flex flex-wrap gap-2">
            {popularTags.slice(0, 10).map(tag => (
              <button
                key={tag.name}
                onClick={() => handleTagSelect(tag.name)}
                className={`text-xs px-2 py-1 rounded-md transition-colors ${
                  selectedTag === tag.name
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag.name} <span className="text-gray-400">({tag.count})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 선택된 태그 정보 */}
      {selectedTag && (
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              <span className="text-primary-600">{selectedTag}</span> 분석
            </h2>
            
            {/* 뷰 전환 버튼 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveView('relations')}
                className={`px-3 py-1.5 text-xs rounded-md transition ${
                  activeView === 'relations' 
                    ? 'bg-white shadow-sm text-primary-700' 
                    : 'text-gray-600'
                }`}
              >
                <ArrowsRightLeftIcon className="h-4 w-4 inline mr-1" />
                연관성
              </button>
              <button
                onClick={() => setActiveView('trends')}
                className={`px-3 py-1.5 text-xs rounded-md transition ${
                  activeView === 'trends' 
                    ? 'bg-white shadow-sm text-primary-700' 
                    : 'text-gray-600'
                }`}
              >
                <ChartBarIcon className="h-4 w-4 inline mr-1" />
                트렌드
              </button>
              <button
                onClick={() => setActiveView('clusters')}
                className={`px-3 py-1.5 text-xs rounded-md transition ${
                  activeView === 'clusters' 
                    ? 'bg-white shadow-sm text-primary-700' 
                    : 'text-gray-600'
                }`}
              >
                <TagIcon className="h-4 w-4 inline mr-1" />
                클러스터
              </button>
            </div>
          </div>

          {/* 관련 태그 리스트 */}
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-500 mb-2">관련 태그:</div>
            <div className="flex flex-wrap gap-2">
              {relatedTags.slice(0, 10).map(tag => (
                <button
                  key={tag.name}
                  onClick={() => handleTagSelect(tag.name)}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {tag.name} <span className="text-gray-400">({tag.count})</span>
                </button>
              ))}
              {relatedTags.length === 0 && (
                <span className="text-xs text-gray-400">관련 태그가 없습니다.</span>
              )}
            </div>
          </div>

          {/* 데이터 시각화 영역 */}
          <div className="bg-gray-50 rounded-lg p-4 h-80 mt-4">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : (
              <>
                {activeView === 'relations' && (
                  <TagRelationshipGraph 
                    selectedTag={selectedTag} 
                    relations={tagRelations} 
                    onTagSelect={handleTagSelect}
                  />
                )}
                
                {activeView === 'trends' && (
                  <TagTrendChart 
                    trends={tagTrends}
                    tagName={selectedTag}
                  />
                )}
                
                {activeView === 'clusters' && (
                  <TagClusterView 
                    centerTag={selectedTag}
                    relatedTags={relatedTags}
                    onTagSelect={handleTagSelect}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 관련 기사 목록 */}
      {selectedTag && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <TagRelatedArticles tagName={selectedTag} limit={5} />
        </div>
      )}
    </div>
  );
}