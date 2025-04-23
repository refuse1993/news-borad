// layout.tsx 파일을 수정해 네비게이션 메뉴에 태그 분석 링크 추가
import { Inter } from 'next/font/google'
import './globals.css'
import { ReactNode } from 'react'
import { NewspaperIcon, RssIcon, TagIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CEA News',
  description: '크롤링된 최신 뉴스 모음',
}

export default function RootLayout({ 
  children 
}: { 
  children: ReactNode 
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-gray-50`}>
        <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <NewspaperIcon className="h-7 w-7 text-primary-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-800">CEA News</h1>
            </div>
            
            <nav className="flex items-center">
              <Link 
                href="/" 
                className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-md transition text-sm sm:text-base"
              >
                뉴스 목록
              </Link>
              <Link 
                href="/daily-news" 
                className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-md transition text-sm sm:text-base"
              >
                일간 뉴스 정리
              </Link>
              <Link 
                href="/tags" 
                className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-md transition text-sm sm:text-base"
              >
                <TagIcon className="h-4 w-4 inline mr-1" />
                태그 분석
              </Link>
              <Link 
                href="/feeds" 
                className="px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-md transition text-sm sm:text-base"
              >
                피드 관리
              </Link>
            </nav>
          </div>
        </header>
        
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
        
        <footer className="bg-white border-t py-6 mt-auto">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center mb-4 md:mb-0">
                <NewspaperIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-gray-500 font-medium">CEA News</span>
              </div>
              <p className="text-sm text-gray-400">
                © {new Date().getFullYear()} 뉴스 모음 플랫폼. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}