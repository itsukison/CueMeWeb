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
  title: "利用規約 | CueMe",
  description: "CueMeの利用規約です。",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-app-bg">
      {/* Navbar - Matching Landing Page Style */}
      <nav className="flex items-center justify-between px-6 py-6 lg:px-12 relative z-10">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center text-2xl font-bold hover:opacity-80 transition-opacity cursor-pointer text-text-primary"
        >
          <img
            src="/logo.png"
            alt="CueMe Logo"
            className="w-10 h-10 mr-2"
            style={{ verticalAlign: "middle" }}
          />
          <span className="logo-text">CueMe</span>
        </Link>

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
            利用規約
          </h1>

          <div className="space-y-8">
            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第1条（適用）</h2>
              <div className="text-gray-700 space-y-2">
                <p>1. 本規約は、CueMe（以下「当社」）が提供するサービス「CueMe」（以下「本サービス」）の利用条件を定めるものです。</p>
                <p>2. 利用者は、本サービスを利用することにより、本規約に同意したものとみなします。</p>
                <p>3. 本規約に同意いただけない場合は、本サービスをご利用いただけません。</p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第2条（定義）</h2>
              <div className="text-gray-700 space-y-2">
                <p>本規約において、以下の用語は以下の意味を有します：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>「利用者」：本サービスを利用する個人または法人</li>
                  <li>「アカウント」：本サービス利用のために作成される利用者固有の権利</li>
                  <li>「コンテンツ」：利用者が本サービスに投稿・アップロードする文書、データ等</li>
                </ul>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第3条（アカウント登録）</h2>
              <div className="text-gray-700 space-y-2">
                <p>1. 利用者は、当社の定める方法によりアカウント登録を行うものとします。</p>
                <p>2. 利用者は、登録情報について正確かつ最新の情報を提供するものとします。</p>
                <p>3. 利用者は、アカウント情報の管理について一切の責任を負うものとします。</p>
                <p>4. アカウントの不正利用により生じた損害について、当社は一切の責任を負いません。</p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第4条（サービス内容）</h2>
              <div className="text-gray-700 space-y-2">
                <p>1. 本サービスは、AI技術を活用した文書処理・質問応答システムを提供します。</p>
                <p>2. 当社は、本サービスの内容を予告なく変更・追加・削除することができます。</p>
                <p>3. 当社は、技術上または運営上の理由により、本サービスの全部または一部を一時的に停止することができます。</p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第5条（利用料金）</h2>
              <div className="text-gray-700 space-y-2">
                <p>1. 本サービスの利用料金は、当社ウェブサイトに記載する通りとします。</p>
                <p>2. 利用料金は、クレジットカードによる前払いとします。</p>
                <p>3. 一度支払われた利用料金は、原則として返金いたしません。</p>
                <p>4. 利用料金の未払いがある場合、当社は本サービスの提供を停止することができます。</p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第6条（禁止事項）</h2>
              <div className="text-gray-700 space-y-2">
                <p>利用者は、以下の行為を行ってはなりません：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>他者の知的財産権を侵害する行為</li>
                  <li>他者のプライバシーを侵害する行為</li>
                  <li>本サービスの運営を妨害する行為</li>
                  <li>不正アクセスやコンピュータウイルスの送信等</li>
                  <li>商用利用（許可された場合を除く）</li>
                  <li>その他、当社が不適切と判断する行為</li>
                </ul>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第7条（コンテンツの取り扱い）</h2>
              <div className="text-gray-700 space-y-2">
                <p>1. 利用者が投稿するコンテンツの著作権は、利用者に帰属します。</p>
                <p>2. 利用者は、投稿するコンテンツについて必要な権利を有していることを保証します。</p>
                <p>3. 当社は、本サービス提供のため、投稿されたコンテンツを処理・保存することができます。</p>
                <p>4. 当社は、違法または不適切なコンテンツを削除することができます。</p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第8条（個人情報の保護）</h2>
              <div className="text-gray-700">
                <p>当社は、利用者の個人情報を「プライバシーポリシー」に従って適切に取り扱います。</p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第9条（サービスの停止・終了）</h2>
              <div className="text-gray-700 space-y-2">
                <p>1. 当社は、以下の場合にアカウントを停止または削除することができます：</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>本規約に違反した場合</li>
                  <li>利用料金の支払いが遅延した場合</li>
                  <li>長期間サービスを利用していない場合</li>
                  <li>その他、当社が不適切と判断した場合</li>
                </ul>
                <p>2. 当社は、本サービスを終了する場合、30日前に通知します。</p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第10条（免責事項）</h2>
              <div className="text-gray-700 space-y-2">
                <p>1. 当社は、本サービスの完全性、正確性、安全性等について保証いたしません。</p>
                <p>2. 本サービスの利用により生じた損害について、当社は一切の責任を負いません。</p>
                <p>3. 当社の責任は、故意または重過失がある場合を除き、直接損害に限定され、その額は利用者が支払った利用料金を上限とします。</p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第11条（規約の変更）</h2>
              <div className="text-gray-700 space-y-2">
                <p>1. 当社は、必要に応じて本規約を変更することができます。</p>
                <p>2. 規約の変更は、本サービス内またはウェブサイトでの掲示により通知します。</p>
                <p>3. 変更後も本サービスを継続利用した場合、変更に同意したものとみなします。</p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第12条（準拠法・管轄裁判所）</h2>
              <div className="text-gray-700 space-y-2">
                <p>1. 本規約は、日本法に準拠し、日本法に従って解釈されます。</p>
                <p>2. 本サービスに関する紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>
              </div>
            </div>

            <div className="border-l-4 border-blue-500 pl-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">第13条（お問い合わせ）</h2>
              <div className="text-gray-700">
                <p>本規約に関するお問い合わせは、以下までご連絡ください：</p>
                <div className="mt-3 bg-gray-50 p-4 rounded-lg">
                  <p><strong>CueMe</strong></p>
                  <p>運営責任者: 孫逸歓</p>
                  <p>メールアドレス: ployee.officialcontact@gmail.com</p>
                  <p>電話番号: 080-8700-4730</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          制定日: 2025年1月1日<br />
          最終更新日: {new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>
    </div>

  );
}