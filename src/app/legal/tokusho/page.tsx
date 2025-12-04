import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | CueMe",
  description: "CueMeの特定商取引法に基づく表記です。",
};

export default function TokushoPage() {
  return (
    <div className="min-h-screen bg-app-bg">
      {/* Navbar - Matching Landing Page Style */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 relative z-10">
        {/* Logo */}
        <div
          className="flex items-center text-2xl font-bold text-text-primary"
        >
          <img
            src="/logo.png"
            alt="CueMe Logo"
            className="w-10 h-10 mr-2"
            style={{ verticalAlign: "middle" }}
          />
          <span className="logo-text">CueMe</span>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Language Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center space-x-1 text-text-primary hover:opacity-70">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">日本語</span>
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>日本語</DropdownMenuItem>
              <DropdownMenuItem>English</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Back to Home Button */}
          <Link href="/">
            <Button className="bg-text-primary text-white hover:opacity-90 rounded-full px-6">
              ホームに戻る
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-8">
        <div className="bg-card-light shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center text-text-primary">
            特定商取引法に基づく表記
          </h1>
            
            <div className="space-y-8">
              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">販売業者</h2>
                <p className="text-gray-700">CueMe</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">運営責任者</h2>
                <p className="text-gray-700">孫逸歓</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">所在地</h2>
                <p className="text-gray-700">〒154-0005 東京都世田谷区桜3-9-24</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">電話番号</h2>
                <p className="text-gray-700">080-8700-4730</p>
                <p className="text-sm text-gray-600 mt-1">※お電話でのお問い合わせは平日10:00-18:00にお願いいたします</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">メールアドレス</h2>
                <p className="text-gray-700">ployee.officialcontact@gmail.com</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">サービス内容</h2>
                <p className="text-gray-700">AI搭載文書処理・質問応答システムの提供</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">販売価格</h2>
                <div className="text-gray-700 space-y-2">
                  <p>• フリープラン: 無料</p>
                  <p>• プロプラン: 月額300円（税込）</p>
                  <p>• エンタープライズプラン: 月額750円（税込）</p>
                  <p className="text-sm text-gray-600 mt-2">※価格は予告なく変更される場合があります</p>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">支払方法</h2>
                <p className="text-gray-700">クレジットカード決済（Stripe経由）</p>
                <p className="text-sm text-gray-600 mt-1">VISA、MasterCard、American Express、JCB等</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">支払時期</h2>
                <p className="text-gray-700">サブスクリプション契約時に即時決済</p>
                <p className="text-sm text-gray-600 mt-1">以降、毎月同日に自動決済</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">サービス提供時期</h2>
                <p className="text-gray-700">決済完了後、即座にサービス利用可能</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">返品・キャンセルについて</h2>
                <div className="text-gray-700 space-y-2">
                  <p>デジタルサービスの性質上、原則として返品・返金はお受けできません。</p>
                  <p>ただし、以下の場合は返金対応いたします：</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>システム障害により長期間サービスが利用できない場合</li>
                    <li>当社の重大な過失によりサービスが提供できない場合</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-2">※サブスクリプションはいつでもキャンセル可能です（次回更新日から停止）</p>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">個人情報の取扱い</h2>
                <p className="text-gray-700">お客様の個人情報は、サービス提供および顧客サポートの目的でのみ使用し、適切に管理いたします。第三者への提供は行いません。</p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">その他</h2>
                <div className="text-gray-700 space-y-2">
                  <p>• 本サービスの利用には利用規約への同意が必要です</p>
                  <p>• サービス内容は予告なく変更される場合があります</p>
                  <p>• 本表記に関するお問い合わせは上記メールアドレスまでご連絡ください</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                最終更新日: {new Date().toLocaleDateString('ja-JP', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
  )
}