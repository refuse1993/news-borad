// components/NewsCard.js
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, ArrowRightIcon, NewspaperIcon } from '@heroicons/react/24/outline';

export default function NewsCard({ article }) {
  // 날짜 포맷팅
  const formattedDate = article.published_at 
    ? format(new Date(article.published_at), 'PPP', { locale: ko })
    : '날짜 없음';

  // 출처별 색상 정의 - 해시 함수를 사용하여 동적으로 색상 할당
  const getSourceColor = (source) => {
    // 보안 관련 출처들에 대한 대표적인 색상 매핑
    const colors = {
      'PoC Exploits': 'bg-red-100 text-red-800',
      'Exploit DB': 'bg-orange-100 text-orange-800',
      'Symantec': 'bg-yellow-100 text-yellow-800',
      'AhnLab': 'bg-amber-100 text-amber-800',
      'Packet Strom': 'bg-lime-100 text-lime-800',
      'Malware Traffic Analysis': 'bg-green-100 text-green-800',
      'Infostealers': 'bg-emerald-100 text-emerald-800',
      'ISC SANS': 'bg-teal-100 text-teal-800',
      'Avast': 'bg-cyan-100 text-cyan-800',
      'SOCRadar': 'bg-sky-100 text-sky-800',
      'Arxiv': 'bg-blue-100 text-blue-800',
      'Red Canary': 'bg-indigo-100 text-indigo-800',
      'Proofpoint': 'bg-violet-100 text-violet-800',
      'VirusTotal': 'bg-purple-100 text-purple-800',
      'DomainTools': 'bg-fuchsia-100 text-fuchsia-800',
      'WizHive Pro': 'bg-pink-100 text-pink-800',
      'Crowdstrike': 'bg-rose-100 text-rose-800',
      'Cisco Talos': 'bg-red-100 text-red-800',
      'Cybereason': 'bg-orange-100 text-orange-800',
      'Cyble': 'bg-yellow-100 text-yellow-800',
      'ReversingLabs': 'bg-lime-100 text-lime-800',
      'ESET': 'bg-green-100 text-green-800',
      'Recorded Future': 'bg-emerald-100 text-emerald-800',
      'Google Cloud (Mandiant)': 'bg-teal-100 text-teal-800',
      'Cloudflare': 'bg-cyan-100 text-cyan-800',
      'Reddit': 'bg-blue-100 text-blue-800',
      'Trend Micro': 'bg-indigo-100 text-indigo-800',
      'Sekoia': 'bg-violet-100 text-violet-800',
      'Fortinet': 'bg-purple-100 text-purple-800',
      'Lab52': 'bg-fuchsia-100 text-fuchsia-800',
      'Check Point Research': 'bg-pink-100 text-pink-800',
      'Citizenlab': 'bg-rose-100 text-rose-800',
      'Team Cymru': 'bg-amber-100 text-amber-800',
      'ANY.RUN': 'bg-lime-100 text-lime-800',
      'Recent Ransomware Victims': 'bg-red-100 text-red-800',
      'VMware Threat Analysis Unit (TAU)': 'bg-blue-100 text-blue-800',
      'Google Project Zero': 'bg-emerald-100 text-emerald-800',
      'The Hacker News': 'bg-cyan-100 text-cyan-800',
      'Kaspersky': 'bg-indigo-100 text-indigo-800',
      'Help Net Security': 'bg-violet-100 text-violet-800',
      'Securelist': 'bg-amber-100 text-amber-800',
      'Cyber Security News': 'bg-green-100 text-green-800',
      'darkreading': 'bg-purple-100 text-purple-800',
      '보안취약점 정보포털': 'bg-rose-100 text-rose-800',
      '데일리시큐 - 이슈': 'bg-sky-100 text-sky-800',
      'GBHackers Security': 'bg-teal-100 text-teal-800',
      'Unit 42': 'bg-orange-100 text-orange-800',
      'MSRC & MSTIC': 'bg-blue-100 text-blue-800',
      'Microsoft Security Blog': 'bg-indigo-100 text-indigo-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    
    // 매핑된 색상이 있으면 사용, 없으면 문자열 해시에 기반한 색상 생성
    if (colors[source]) {
      return colors[source];
    }
    
    // 간단한 해시 함수로 문자열을 숫자로 변환
    const hashCode = str => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return hash;
    };
    
    // 색상 배열 (기본 색상 10개)
    const colorOptions = [
      'bg-red-100 text-red-800',
      'bg-orange-100 text-orange-800',
      'bg-amber-100 text-amber-800',
      'bg-yellow-100 text-yellow-800',
      'bg-lime-100 text-lime-800',
      'bg-green-100 text-green-800',
      'bg-emerald-100 text-emerald-800',
      'bg-teal-100 text-teal-800',
      'bg-cyan-100 text-cyan-800',
      'bg-sky-100 text-sky-800',
      'bg-blue-100 text-blue-800',
      'bg-indigo-100 text-indigo-800',
      'bg-violet-100 text-violet-800',
      'bg-purple-100 text-purple-800',
      'bg-fuchsia-100 text-fuchsia-800',
      'bg-pink-100 text-pink-800',
      'bg-rose-100 text-rose-800'
    ];
    
    // 해시값에 따라 색상 선택
    const colorIndex = Math.abs(hashCode(source)) % colorOptions.length;
    return colorOptions[colorIndex];
  };

  const sourceColor = article.source ? getSourceColor(article.source) : getSourceColor('default');

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full">
      <div className="flex h-full">
        {/* 이미지 영역 - 왼쪽 배치 */}
        <div className="relative min-w-[100px] md:min-w-[140px] max-w-[100px] md:max-w-[140px]">
          {article.image_url ? (
            <Image
              src={article.image_url}
              alt={article.title || '뉴스 이미지'}
              fill
              sizes="(max-width: 768px) 100px, 140px"
              className="object-cover h-full"
              unoptimized={true}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <NewspaperIcon className="w-8 h-8 text-gray-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent mix-blend-overlay" />
        </div>
        
        {/* 컨텐츠 영역 */}
        <div className="flex-grow p-4 flex flex-col">
          {article.source && (
            <span className={`mb-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sourceColor}`}>
              <NewspaperIcon className="w-3 h-3 mr-1" />
              {article.source}
            </span>
          )}
          
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
          
          <div className="text-gray-400 text-xs mb-2 flex items-center">
            <CalendarIcon className="w-3.5 h-3.5 mr-1" />
            <span>{formattedDate}</span>
          </div>
          
          {article.summary && (
            <p className="text-gray-500 text-sm line-clamp-3 mb-3">
              {article.summary}
            </p>
          )}
          
          <div className="mt-auto pt-2">
            <Link 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary-600 text-sm font-medium hover:text-primary-700 inline-flex items-center"
            >
              <span>원문 보기</span>
              <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}