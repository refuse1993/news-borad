import { Inter } from 'next/font/google'
import './globals.css'
import { ReactNode } from 'react'

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
      <body className={inter.className}>
        <header className="bg-gray-800 text-white p-4 shadow-md">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold">뉴스 모음</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-gray-100 border-t p-4 text-center text-gray-600">
          <p>© {new Date().getFullYear()} 뉴스 모음</p>
        </footer>
      </body>
    </html>
  )
}