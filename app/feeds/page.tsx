'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  RssIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  FunnelIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import FeedForm from '@/components/FeedForm';

interface RssFeed {
  id: string;
  name: string;
  url: string;
  source: string;
  category: string | null;
  description: string | null;
  enabled: boolean;
  last_crawled: string | null;
  crawl_frequency: string;
  error_count: number;
  last_error: string | null;
}

export default function FeedsPage() {
  // 상태 관리
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [filteredFeeds, setFilteredFeeds] = useState<RssFeed[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedIds, setSelectedFeedIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentFeed, setCurrentFeed] = useState<RssFeed | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [expandedFeedId, setExpandedFeedId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(true);
  
  // 필터 상태
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // 배치 작업 상태
  const [showBatchMenu, setShowBatchMenu] = useState(false);
  const [crawlingFeedId, setCrawlingFeedId] = useState<string | null>(null);

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 피드 가져오기
  const fetchFeeds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rss_feeds')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching feeds:', error);
        return;
      }

      setFeeds(data || []);
      applyFilters(data || []);
      
      // 고유 출처 목록 추출
      const uniqueSources = [...new Set((data || []).map(feed => feed.source))];
      setSources(uniqueSources);
    } catch (error) {
      console.error('Failed to fetch feeds:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터 적용
  const applyFilters = (feedData: RssFeed[]) => {
    let result = [...feedData];
    
    // 검색어 필터
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(feed => 
        feed.name.toLowerCase().includes(lowerQuery) || 
        feed.url.toLowerCase().includes(lowerQuery) ||
        feed.source.toLowerCase().includes(lowerQuery)
      );
    }
    
    // 출처 필터
    if (sourceFilter !== 'all') {
      result = result.filter(feed => feed.source === sourceFilter);
    }
    
    // 상태 필터
    if (statusFilter !== 'all') {
      result = result.filter(feed => 
        statusFilter === 'active' ? feed.enabled : !feed.enabled
      );
    }
    
    setFilteredFeeds(result);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchFeeds();
  }, []);

  // 필터 변경 시 적용
  useEffect(() => {
    applyFilters(feeds);
  }, [feeds, searchQuery, sourceFilter, statusFilter]);

  // 필터 리셋
  const resetFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setStatusFilter('all');
    setShowFilters(false);
  };

  // 피드 추가 모드 시작
  const handleAddFeed = () => {
    setCurrentFeed(null);
    setIsEditing(false);
    setShowForm(true);
  };

  // 피드 수정 모드 시작
  const handleEditFeed = (feed: RssFeed) => {
    setCurrentFeed(feed);
    setIsEditing(true);
    setShowForm(true);
  };

  // 피드 삭제
  const handleDeleteFeed = async (id: string) => {
    if (!window.confirm('정말 이 피드를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rss_feeds')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting feed:', error);
        alert('피드 삭제 중 오류가 발생했습니다.');
        return;
      }

      fetchFeeds();
    } catch (error) {
      console.error('Failed to delete feed:', error);
      alert('피드 삭제 중 오류가 발생했습니다.');
    }
  };

  // 피드 활성화 상태 토글
  const handleToggleStatus = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('rss_feeds')
        .update({ enabled: !enabled })
        .eq('id', id);

      if (error) {
        console.error('Error updating feed status:', error);
        alert('피드 상태 변경 중 오류가 발생했습니다.');
        return;
      }

      fetchFeeds();
    } catch (error) {
      console.error('Failed to update feed status:', error);
      alert('피드 상태 변경 중 오류가 발생했습니다.');
    }
  };

  // 폼 제출 처리
  const handleFormSubmit = async (feedData: Partial<RssFeed>) => {
    try {
      if (isEditing && currentFeed) {
        // 피드 업데이트
        const { error } = await supabase
          .from('rss_feeds')
          .update(feedData)
          .eq('id', currentFeed.id);

        if (error) {
          console.error('Error updating feed:', error);
          alert('피드 업데이트 중 오류가 발생했습니다.');
          return;
        }
      } else {
        // 새 피드 추가
        const { error } = await supabase
          .from('rss_feeds')
          .insert([feedData]);

        if (error) {
          console.error('Error adding feed:', error);
          alert('피드 추가 중 오류가 발생했습니다.');
          return;
        }
      }

      setShowForm(false);
      fetchFeeds();
    } catch (error) {
      console.error('Failed to submit feed:', error);
      alert('피드 저장 중 오류가 발생했습니다.');
    }
  };

  // 폼 취소
  const handleFormCancel = () => {
    setShowForm(false);
  };

  // 체크박스 선택 처리
  const handleSelectFeed = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedFeedIds(prev => [...prev, id]);
    } else {
      setSelectedFeedIds(prev => prev.filter(feedId => feedId !== id));
    }
  };
  
  // 모든 피드 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFeedIds(filteredFeeds.map(feed => feed.id));
    } else {
      setSelectedFeedIds([]);
    }
  };
  
  // 피드 상세 정보 토글
  const toggleFeedDetails = (id: string) => {
    if (expandedFeedId === id) {
      setExpandedFeedId(null);
    } else {
      setExpandedFeedId(id);
    }
  };

  // 수동 크롤링 실행
  const handleCrawlFeed = async (id: string) => {
    setCrawlingFeedId(id);
    
    try {
      const response = await fetch(`/api/feeds/${id}/crawl`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '크롤링 중 오류가 발생했습니다.');
      }
      
      // 크롤링 성공 처리
      fetchFeeds();
    } catch (error) {
      console.error('크롤링 실패:', error);
      alert('피드 크롤링 중 오류가 발생했습니다.');
    } finally {
      setCrawlingFeedId(null);
    }
  };

  // 배치 작업 처리
  const handleBatchAction = async (action: 'enable' | 'disable' | 'delete' | 'crawl') => {
    if (selectedFeedIds.length === 0) return;
    
    setShowBatchMenu(false);
    
    if (action === 'delete' && !window.confirm(`선택한 ${selectedFeedIds.length}개 피드를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('rss_feeds')
          .delete()
          .in('id', selectedFeedIds);
          
        if (error) throw new Error(error.message);
      } 
      else if (action === 'enable' || action === 'disable') {
        const { error } = await supabase
          .from('rss_feeds')
          .update({ enabled: action === 'enable' })
          .in('id', selectedFeedIds);
          
        if (error) throw new Error(error.message);
      }
      else if (action === 'crawl') {
        // 각 피드에 대해 크롤링 API 호출
        await Promise.all(selectedFeedIds.map(id => 
          fetch(`/api/feeds/${id}/crawl`, { method: 'POST' })
        ));
      }
      
      fetchFeeds();
      setSelectedFeedIds([]);
    } catch (error) {
      console.error(`배치 작업(${action}) 실패:`, error);
      alert('배치 작업 중 오류가 발생했습니다.');
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '없음';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-screen-xl mx-auto pb-20 md:pb-0">
      {/* 헤더 영역 */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center">
          <RssIcon className="h-5 w-5 md:h-6 md:w-6 mr-2 text-primary-600" />
          RSS 피드 관리
        </h1>
        <button
          onClick={handleAddFeed}
          className="bg-primary-600 hover:bg-primary-700 text-white py-1.5 px-3 md:py-2 md:px-4 text-sm rounded-md flex items-center transition"
        >
          <PlusIcon className="h-4 w-4 md:h-5 md:w-5 mr-1" />
          <span className="hidden sm:inline">새 피드 추가</span>
          <span className="sm:hidden">추가</span>
        </button>
      </div>

      {/* 검색 및 필터 영역 */}
      <div className="bg-white rounded-lg shadow-sm mb-4 overflow-hidden">
        <div className="p-3 md:p-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-grow">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="피드 검색..."
                className="w-full pl-9 pr-3 py-2 text-sm md:text-base border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RssIcon className="h-4 w-4 text-gray-400" />
              </div>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-2 p-2 text-gray-500 hover:text-primary-600 rounded-md border border-gray-300 flex items-center"
            >
              <FunnelIcon className="h-5 w-5" />
              {showFilters ? (
                <ChevronUpIcon className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">출처</label>
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">모든 출처</option>
                    {sources.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">모든 상태</option>
                    <option value="active">활성화</option>
                    <option value="inactive">비활성화</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end mt-3">
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  필터 초기화
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 폼 */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <FeedForm
                      feed={currentFeed}
                      isEditing={isEditing}
                      onSubmit={handleFormSubmit}
                      onCancel={handleFormCancel}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 피드 목록 */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg shadow">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-500">피드 불러오는 중...</p>
        </div>
      ) : filteredFeeds.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="flex justify-center">
            <RssIcon className="h-12 w-12 text-gray-400 mb-4" />
          </div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">
            {searchQuery || sourceFilter !== 'all' || statusFilter !== 'all' 
              ? '검색 결과가 없습니다' 
              : '등록된 RSS 피드가 없습니다'}
          </h2>
          <p className="text-gray-500 mb-6">
            {searchQuery || sourceFilter !== 'all' || statusFilter !== 'all' 
              ? '다른 검색어나 필터를 시도해보세요' 
              : '새로운 피드를 추가하고 뉴스를 수집해보세요'}
          </p>
          {searchQuery || sourceFilter !== 'all' || statusFilter !== 'all' ? (
            <button
              onClick={resetFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              필터 초기화
            </button>
          ) : (
            <button
              onClick={handleAddFeed}
              className="bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-md flex items-center mx-auto transition"
            >
              <PlusIcon className="h-5 w-5 mr-1" />
              새 피드 추가
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* 선택 정보 및 일괄 작업 */}
          {selectedFeedIds.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {selectedFeedIds.length}개 선택됨
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBatchAction('enable')}
                  className="bg-green-600 hover:bg-green-700 text-white py-1 px-2 text-xs font-medium rounded"
                >
                  활성화
                </button>
                <button
                  onClick={() => handleBatchAction('disable')}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white py-1 px-2 text-xs font-medium rounded"
                >
                  비활성화
                </button>
                <button
                  onClick={() => handleBatchAction('crawl')}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 text-xs font-medium rounded"
                >
                  크롤링
                </button>
                <button
                  onClick={() => handleBatchAction('delete')}
                  className="bg-red-600 hover:bg-red-700 text-white py-1 px-2 text-xs font-medium rounded"
                >
                  삭제
                </button>
              </div>
            </div>
          )}
          
          {/* 선택 전체/해제 */}
          <div className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedFeedIds.length === filteredFeeds.length && filteredFeeds.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">전체 선택</span>
            </div>
            <span className="text-sm text-gray-500">{filteredFeeds.length}개의 피드</span>
          </div>
          
          {/* 피드 카드 목록 */}
          <div className="space-y-3">
            {filteredFeeds.map((feed) => (
              <div 
                key={feed.id} 
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200"
              >
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={selectedFeedIds.includes(feed.id)}
                          onChange={(e) => handleSelectFeed(feed.id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <h3 
                          className="font-medium text-gray-900 cursor-pointer"
                          onClick={() => toggleFeedDetails(feed.id)}
                        >
                          {feed.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{feed.source}</p>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => handleToggleStatus(feed.id, feed.enabled)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          feed.enabled
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {feed.enabled ? '활성화' : '비활성화'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                    <p>
                      <span className="font-medium">카테고리:</span> {feed.category || '미분류'}
                    </p>
                    <p>
                      <span className="font-medium">마지막 수집:</span> {formatDate(feed.last_crawled).split(' ').slice(0, 3).join(' ')}
                    </p>
                    {feed.error_count > 0 && (
                      <p className="text-red-600">
                        <span className="font-medium">오류:</span> {feed.error_count}회
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-3 flex justify-between items-center">
                    <button
                      onClick={() => toggleFeedDetails(feed.id)}
                      className="text-xs text-primary-600 flex items-center"
                    >
                      {expandedFeedId === feed.id ? (
                        <>
                          <ChevronUpIcon className="h-3 w-3 mr-1" />
                          세부정보 닫기
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="h-3 w-3 mr-1" />
                          세부정보 보기
                        </>
                      )}
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleCrawlFeed(feed.id)}
                        disabled={crawlingFeedId === feed.id}
                        className={`p-1.5 rounded-full text-gray-600 hover:text-primary-600 hover:bg-gray-100 
                          ${crawlingFeedId === feed.id ? 'opacity-50' : ''}`}
                      >
                        <ArrowPathIcon className={`h-4 w-4 ${crawlingFeedId === feed.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleEditFeed(feed)}
                        className="p-1.5 rounded-full text-indigo-600 hover:text-indigo-900 hover:bg-gray-100"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteFeed(feed.id)}
                        className="p-1.5 rounded-full text-red-600 hover:text-red-900 hover:bg-gray-100"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* 확장된 상세 정보 */}
                {expandedFeedId === feed.id && (
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-sm">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">RSS URL</p>
                        <a 
                          href={feed.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 text-xs break-all hover:underline"
                        >
                          {feed.url}
                        </a>
                      </div>
                      
                      {feed.description && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">설명</p>
                          <p className="text-xs text-gray-900">{feed.description}</p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">크롤링 주기</p>
                          <p className="text-xs text-gray-900">
                            {feed.crawl_frequency === 'hourly' ? '매시간' : 
                             feed.crawl_frequency === 'daily' ? '매일' : '매주'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-gray-500 font-medium">마지막 수집</p>
                          <p className="text-xs text-gray-900">{formatDate(feed.last_crawled)}</p>
                        </div>
                      </div>
                      
                      {feed.last_error && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium">마지막 오류</p>
                          <p className="text-xs text-red-600">{feed.last_error}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}