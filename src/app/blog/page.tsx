import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar, User, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: '面接対策ブログ | AI面接・転職面接のコツとテクニック - CueMe',
  description: 'AI面接対策、転職面接のコツ、就活面接のテクニックを専門家が解説。面接カンニング方法、オンライン面接の攻略法など実践的な情報を提供。',
  keywords: [
    '面接対策',
    '転職面接',
    '就活面接',
    'AI面接',
    '面接コツ',
    '面接テクニック',
    'オンライン面接',
    '面接質問',
    '面接回答例'
  ],
  openGraph: {
    title: '面接対策ブログ | AI面接・転職面接のコツとテクニック',
    description: 'AI面接対策、転職面接のコツ、就活面接のテクニックを専門家が解説。',
    url: 'https://www.cueme.ink/blog',
  },
  alternates: {
    canonical: '/blog',
  },
}

const blogPosts = [
  {
    id: 1,
    title: 'AI面接対策の完全ガイド：成功率を85%向上させる方法',
    excerpt: 'AI面接対策の基本から応用まで、実際の成功事例を交えて詳しく解説します。転職面接・就活面接で差をつける秘訣とは？',
    date: '2025年1月1日',
    author: 'CueMe編集部',
    slug: 'ai-interview-complete-guide',
    category: 'AI面接対策'
  },
  {
    id: 2,
    title: '面接カンニング機能の効果的な使い方：オンライン面接攻略法',
    excerpt: 'Zoom・Teams面接で使える面接カンニング機能の活用方法。リアルタイム回答支援で面接を成功に導くテクニックを公開。',
    date: '2024年12月28日',
    author: 'CueMe編集部',
    slug: 'interview-cheating-techniques',
    category: '面接カンニング'
  },
  {
    id: 3,
    title: '転職面接でよく聞かれる質問TOP50と模範回答例',
    excerpt: '転職面接で頻出の質問50選と、採用担当者に好印象を与える回答例を業界別に紹介。面接対策の決定版。',
    date: '2024年12月25日',
    author: 'CueMe編集部',
    slug: 'top-50-interview-questions',
    category: '転職面接'
  },
  {
    id: 4,
    title: 'オンライン面接のマナーと成功のコツ：AI会議ツール活用術',
    excerpt: 'オンライン面接特有のマナーと成功のポイント。AI会議ツールを使った効果的な面接対策方法を解説。',
    date: '2024年12月22日',
    author: 'CueMe編集部',
    slug: 'online-interview-manners',
    category: 'オンライン面接'
  },
  {
    id: 5,
    title: '就活面接の基本：新卒採用で内定を勝ち取る面接対策',
    excerpt: '就活生必見！新卒採用面接の基本から応用まで。自己PR、志望動機の作り方から面接当日の振る舞いまで完全解説。',
    date: '2024年12月20日',
    author: 'CueMe編集部',
    slug: 'job-hunting-interview-basics',
    category: '就活面接'
  },
  {
    id: 6,
    title: '業界別面接対策：IT・金融・コンサル・営業の攻略法',
    excerpt: '業界特化の面接対策方法。IT、金融、コンサル、営業など主要業界の面接傾向と対策を詳しく解説。',
    date: '2024年12月18日',
    author: 'CueMe編集部',
    slug: 'industry-specific-interview-strategies',
    category: '業界別対策'
  }
]

export default function BlogPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F7EE" }}>
      {/* Header */}
      <header className="px-6 py-6 lg:px-12">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center text-2xl font-bold" style={{ color: "#013220" }}>
            <img src="/logo.png" alt="CueMe Logo" className="w-10 h-10 mr-2" />
            <span>CueMe</span>
          </Link>
          <Link href="/login">
            <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-6">
              無料で始める
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-12 lg:px-12 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-black mb-6 leading-tight">
            面接対策ブログ
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            AI面接対策、転職面接のコツ、就活面接のテクニックを専門家が解説。実践的な面接対策情報をお届けします。
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="px-6 py-16 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.id} className="bg-white shadow-lg border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 rounded-2xl">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-sm font-medium text-white rounded-full" style={{ backgroundColor: "#013220" }}>
                      {post.category}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-black mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                  </div>
                  
                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="outline" className="w-full rounded-full border-black text-black hover:bg-black hover:text-white flex items-center gap-2">
                      続きを読む
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 lg:px-12 lg:py-24" style={{ backgroundColor: "#013220" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            CueMeで面接対策を実践
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            ブログで学んだ面接対策をCueMeで実践。AI面接対策ツールで成功率を向上させましょう。
          </p>
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-10 py-4 text-lg font-semibold">
              無料でダウンロード
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 lg:px-12" style={{ backgroundColor: "#F7F7EE" }}>
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center text-2xl font-bold mb-4" style={{ color: "#013220" }}>
            <img src="/logo.png" alt="CueMe Logo" className="w-10 h-10 mr-2" />
            <span>CueMe</span>
          </div>
          <p className="text-gray-600 mb-4">
            AI面接対策ツール・面接カンニング機能で転職面接・就活面接を成功に導きます
          </p>
          <div className="border-t border-gray-300 pt-4 text-gray-600">
            <p>&copy; 2025 CueMe. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}