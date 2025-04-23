// app/not-found.js
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-600 mb-6">페이지를 찾을 수 없습니다</h2>
      <p className="text-gray-500 mb-8 max-w-md">
        찾으시는 페이지가 삭제되었거나, 이름이 변경되었거나, 일시적으로 사용이 불가능할 수 있습니다.
      </p>
      <Link 
        href="/"
        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}