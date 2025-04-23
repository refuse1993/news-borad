import { Inter } from 'next/font/google'
import './globals.css'
import { ReactNode } from 'react'
import { NewspaperIcon } from '@heroicons/react/24/outline'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: '뉴스 모음',
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
              <h1 className="text-xl font-semibold text-gray-800">뉴스 모음</h1>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
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
                <span className="text-gray-500 font-medium">뉴스 모음</span>
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