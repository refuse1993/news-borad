// app/layout.js
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata = {
  title: '뉴스 모음',
  description: '크롤링된 최신 뉴스 모음',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-primary-600">뉴스 모음</h1>
            <nav>
              <ul className="flex space-x-4">
                <li><a href="/" className="text-gray-600 hover:text-primary-600 transition-colors">홈</a></li>
                <li><a href="/categories" className="text-gray-600 hover:text-primary-600 transition-colors">카테고리</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 flex-grow">
          {children}
        </main>
        <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} 뉴스 모음 | 모든 콘텐츠는 해당 언론사의 저작권을 따릅니다.</p>
          </div>
        </footer>
      </body>
    </html>
  )
}