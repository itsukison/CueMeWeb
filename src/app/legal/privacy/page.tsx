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
  title: "プライバシーポリシー | CueMe",
  description: "CueMeのプライバシーポリシーです。",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F7EE" }}>
      {/* Navbar - Matching Landing Page Style */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 relative z-10">
        {/* Logo */}
        <div
          className="flex items-center text-2xl font-bold"
          style={{ color: "#013220" }}
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
            <DropdownMenuTrigger className="flex items-center space-x-1 text-black hover:text-gray-700">
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
            <Button className="bg-black text-white hover:bg-gray-900 rounded-full px-6">
              ホームに戻る
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 lg:px-12 py-8">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center" style={{ color: "#013220" }}>
            プライバシーポリシー
          </h1>
            
            <div className="space-y-8">
              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">1. 基本方針</h2>
                <p className="text-gray-700">
                  CueMe（以下「当社」）は、お客様の個人情報の重要性を認識し、個人情報の保護に関する法律（個人情報保護法）を遵守し、適切な取り扱いと保護に努めます。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">2. 収集する個人情報</h2>
                <div className="text-gray-700 space-y-2">
                  <p>当社は以下の個人情報を収集する場合があります：</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>氏名、メールアドレス</li>
                    <li>決済情報（クレジットカード情報等）</li>
                    <li>サービス利用履歴、ログ情報</li>
                    <li>アップロードされた文書データ</li>
                    <li>IPアドレス、ブラウザ情報</li>
                  </ul>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">3. 個人情報の利用目的</h2>
                <div className="text-gray-700 space-y-2">
                  <p>収集した個人情報は以下の目的で利用します：</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>サービスの提供・運営</li>
                    <li>顧客サポート・お問い合わせ対応</li>
                    <li>決済処理</li>
                    <li>サービス改善・新機能開発</li>
                    <li>重要なお知らせの配信</li>
                    <li>利用規約違反の調査・対応</li>
                  </ul>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">4. 個人情報の第三者提供</h2>
                <div className="text-gray-700 space-y-2">
                  <p>当社は、以下の場合を除き、お客様の同意なく個人情報を第三者に提供することはありません：</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>法令に基づく場合</li>
                    <li>人の生命、身体または財産の保護のために必要がある場合</li>
                    <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
                    <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
                  </ul>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">5. 個人情報の委託</h2>
                <div className="text-gray-700 space-y-2">
                  <p>当社は、サービス提供のため以下の第三者サービスを利用しています：</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Stripe Inc.（決済処理）</li>
                    <li>Supabase Inc.（データベース・認証）</li>
                    <li>Vercel Inc.（ホスティング）</li>
                    <li>OpenAI（AI処理）</li>
                    <li>Google LLC（分析・AI処理）</li>
                  </ul>
                  <p className="mt-2">これらの委託先には、適切な個人情報保護契約を締結し、適切な管理を求めています。</p>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">6. 個人情報の保存期間</h2>
                <p className="text-gray-700">
                  個人情報は、利用目的の達成に必要な期間、または法令で定められた期間保存します。アカウント削除時は、法令で保存が義務付けられている情報を除き、速やかに削除いたします。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">7. 個人情報の安全管理</h2>
                <div className="text-gray-700 space-y-2">
                  <p>当社は、個人情報の漏洩、滅失、毀損を防止するため、以下の安全管理措置を講じています：</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>SSL/TLS暗号化通信の使用</li>
                    <li>アクセス制御・認証システムの導入</li>
                    <li>定期的なセキュリティ監査</li>
                    <li>従業員への教育・研修</li>
                  </ul>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">8. お客様の権利</h2>
                <div className="text-gray-700 space-y-2">
                  <p>お客様は、ご自身の個人情報について以下の権利を有します：</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>開示請求権</li>
                    <li>訂正・追加・削除請求権</li>
                    <li>利用停止・消去請求権</li>
                    <li>第三者提供停止請求権</li>
                  </ul>
                  <p className="mt-2">これらの権利を行使される場合は、下記お問い合わせ先までご連絡ください。</p>
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Cookie等の使用</h2>
                <p className="text-gray-700">
                  当社は、サービスの利便性向上のためCookieを使用する場合があります。Cookieの使用を希望されない場合は、ブラウザの設定で無効にすることができますが、一部機能が制限される場合があります。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">10. プライバシーポリシーの変更</h2>
                <p className="text-gray-700">
                  当社は、法令の変更やサービス内容の変更に伴い、本プライバシーポリシーを変更する場合があります。重要な変更については、サービス内またはメールにてお知らせいたします。
                </p>
              </div>

              <div className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">11. お問い合わせ</h2>
                <div className="text-gray-700">
                  <p>個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください：</p>
                  <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                    <p><strong>CueMe</strong></p>
                    <p>運営責任者: 孫逸歓</p>
                    <p>メールアドレス: ployee.officialcontact@gmail.com</p>
                    <p>電話番号: 080-8700-4730</p>
                    <p>住所: 〒154-0005 東京都世田谷区桜3-9-24</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">
                制定日: 2025年1月1日<br/>
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