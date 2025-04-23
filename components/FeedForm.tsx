'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

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

interface FeedFormProps {
  feed: RssFeed | null;
  isEditing: boolean;
  onSubmit: (feedData: Partial<RssFeed>) => void;
  onCancel: () => void;
}

export default function FeedForm({ feed, isEditing, onSubmit, onCancel }: FeedFormProps) {
  const [formData, setFormData] = useState<Partial<RssFeed>>({
    name: '',
    url: '',
    source: '',
    category: '',
    description: '',
    enabled: true,
    crawl_frequency: 'daily',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 모바일 화면 감지
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isEditing && feed) {
      setFormData({
        name: feed.name,
        url: feed.url,
        source: feed.source,
        category: feed.category || '',
        description: feed.description || '',
        enabled: feed.enabled,
        crawl_frequency: feed.crawl_frequency,
      });
    }
  }, [isEditing, feed]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = '피드 이름을 입력해주세요.';
    }

    if (!formData.url?.trim()) {
      newErrors.url = 'RSS URL을 입력해주세요.';
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = '유효한 URL 형식이 아닙니다.';
    }

    if (!formData.source?.trim()) {
      newErrors.source = '출처를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
        <h2 className="text-lg md:text-xl font-bold text-gray-800">
          {isEditing ? '피드 수정' : '새 피드 추가'}
        </h2>
        <button 
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-800 p-1"
          aria-label="닫기"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            피드 이름 *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 
              ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="피드 이름"
          />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            출처 *
          </label>
          <input
            type="text"
            name="source"
            value={formData.source}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 
              ${errors.source ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="출처 (예: 한국경제, IT동아)"
          />
          {errors.source && <p className="mt-1 text-xs text-red-600">{errors.source}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            RSS URL *
          </label>
          <input
            type="text"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 
              ${errors.url ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="https://example.com/rss"
          />
          {errors.url && <p className="mt-1 text-xs text-red-600">{errors.url}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              카테고리
            </label>
            <input
              type="text"
              name="category"
              value={formData.category || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="카테고리 (예: 경제, IT, 과학)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              크롤링 주기
            </label>
            <select
              name="crawl_frequency"
              value={formData.crawl_frequency}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="hourly">매시간</option>
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="피드에 대한 설명 (선택사항)"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            name="enabled"
            checked={formData.enabled}
            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
            피드 활성화
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1 -mb-2">
          비활성화하면 크롤링이 일시 중지됩니다.
        </p>

        <div className="pt-4 mt-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            취소
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {isEditing ? '수정하기' : '추가하기'}
          </button>
        </div>
      </form>
    </div>
  );
}