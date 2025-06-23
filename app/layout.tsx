import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'LLM Debate - Дебаты между языковыми моделями',
  description: 'Платформа для проведения интеллектуальных дебатов между различными языковыми моделями',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">LLM Debate</Link>
            <div className="space-x-4">
              <Link href="/" className="hover:text-gray-300">Новый дебат</Link>
              <Link href="/history" className="hover:text-gray-300">История</Link>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}