import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, Zap, Target, CheckCircle, Download } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI面接対策ツール | 面接カンニング・リアルタイム回答支援 - CueMe',
  description: 'AI面接対策の最新ツール。面接カンニング機能でオンライン面接をサポート。転職面接・就活面接の成功率を85%向上させるAI会議ツール。無料ダウンロード可能。',
  keywords: [
    'AI面接対策',
    '面接カンニング',
    'AI会議ツール',
    'オンライン面接',
    '転職面接',
    '就活面接',
    '面接支援ツール',
    'リアルタイム回答',
    'Zoom面接',
    'Teams面接'
  ],
  openGraph: {
    title: 'AI面接対策ツール | 面接カンニング・リアルタイム回答支援',
    description: 'AI面接対策の最新ツール。面接カンニング機能でオンライン面接をサポート。',
    url: 'https://www.cueme.ink/ai-interview',
  },
  alternates: {
    canonical: '/ai-interview',
  },
}

export default function AIInterviewPage() {
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
            AI面接対策ツールで
            <br />
            <span style={{ color: "#013220" }}>面接カンニング</span>を実現
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            オンライン面接でリアルタイム回答支援。Zoom・Teams対応のAI会議ツールで転職面接・就活面接の成功率を85%向上させます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-8 py-3 text-lg flex items-center gap-2">
                <Download className="w-5 h-5" />
                無料ダウンロード
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 lg:px-12 lg:py-24" style={{ backgroundColor: "#013220" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white text-center mb-12">
            AI面接対策の主要機能
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Brain className="w-12 h-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">AI面接質問生成</h3>
                <p className="text-gray-300">
                  転職面接・就活面接に特化したAI質問生成。業界別・職種別の実際の面接質問を網羅的に練習。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Zap className="w-12 h-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">面接カンニング機能</h3>
                <p className="text-gray-300">
                  オンライン面接中にリアルタイムで回答ヒントを表示。Zoom・Teams対応のAI会議ツール。
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-white mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-4">個別面接対策</h3>
                <p className="text-gray-300">
                  あなたの経歴・志望企業に合わせた個別面接対策。転職エージェント級のパーソナライズ。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-6 py-16 lg:px-12 lg:py-24" style={{ backgroundColor: "#F7F7EE" }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-black text-center mb-12">
            なぜCueMeが選ばれるのか
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-black mb-2">面接通過率85%向上</h3>
                <p className="text-gray-700">
                  AI面接対策により、ユーザーの平均面接通過率が85%向上。転職面接・就活面接での成功実績多数。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-black mb-2">オンライン面接完全対応</h3>
                <p className="text-gray-700">
                  Zoom、Teams、Google Meetなど主要なオンライン面接プラットフォームに対応。AI会議ツールとして最適化。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-black mb-2">リアルタイム面接カンニング</h3>
                <p className="text-gray-700">
                  面接中にリアルタイムで適切な回答をサジェスト。緊張や忘れがちな内容もAIがサポート。
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-black mb-2">業界特化の面接対策</h3>
                <p className="text-gray-700">
                  IT、金融、コンサル、営業など業界別の面接対策。職種特化の質問と回答例で効率的な準備。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-16 lg:px-12 lg:py-24" style={{ backgroundColor: "#013220" }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            今すぐAI面接対策を始める
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            無料ダウンロードで面接カンニング機能を体験。転職面接・就活面接の成功率を今すぐ向上させましょう。
          </p>
          <Link href="/login">
            <Button className="bg-white text-black hover:bg-gray-100 rounded-full px-10 py-4 text-lg font-semibold flex items-center gap-2 mx-auto">
              <Download className="w-5 h-5" />
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