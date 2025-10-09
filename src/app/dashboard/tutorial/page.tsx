"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Mic,
  FileText,
  Database,
  Users,
  User,
  TrendingUp,
  Upload,
  Search,
  MessageCircle,
  Headphones,
  FolderOpen,
  Settings,
  Crown,
  Star,
  Gift,
  HelpCircle,
  CheckCircle,
  ArrowRight,
  Volume2,
  Eye,
  EyeOff,
  Plus,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}

function FeatureCard({ icon, title, description, features }: FeatureCardProps) {
  return (
    <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#f0f9f0", color: "#2D5016" }}
          >
            {icon}
          </div>
          <CardTitle className="text-xl font-semibold" style={{ color: "#2D5016" }}>
            {title}
          </CardTitle>
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface StepCardProps {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    text: string;
    href: string;
  };
}

function StepCard({ step, icon, title, description, action }: StepCardProps) {
  return (
    <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: "#2D5016" }}
          >
            {step}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "#f0f9f0", color: "#2D5016" }}
              >
                {icon}
              </div>
              <h3 className="font-semibold text-lg" style={{ color: "#2D5016" }}>
                {title}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-3">{description}</p>
            {action && (
              <Link href={action.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  style={{ borderColor: "#2D5016", color: "#2D5016" }}
                >
                  {action.text}
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ModeCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
  badge?: string;
}

function ModeCard({ icon, title, description, features, badge }: ModeCardProps) {
  return (
    <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "#f0f9f0", color: "#2D5016" }}
            >
              {icon}
            </div>
            <CardTitle className="text-lg font-semibold" style={{ color: "#2D5016" }}>
              {title}
            </CardTitle>
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              {badge}
            </Badge>
          )}
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function TutorialPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F7EE" }}>
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="space-y-16">
          {/* Hero Section */}
          <div className="text-center space-y-8">
            <div className="flex items-center justify-center gap-4 mb-8">
              <Image src="/logo.png" alt="CueMe Logo" width={64} height={64} className="w-16 h-16" />
              <h1 className="text-5xl font-bold" style={{ color: "#2D5016" }}>
                チュートリアル
              </h1>
            </div>
          </div>

          {/* Keyboard Shortcuts Section */}
          <section className="space-y-20">
            <div>
              <h2 className="text-4xl font-bold mb-4" style={{ color: "#2D5016" }}>
                キーボードショートカット
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                CueMeを素早く操作するための便利なショートカット
              </p>
            </div>
            
            {/* Command + B - Toggle App Visibility */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2 flex flex-col items-center text-center space-y-6">
                <div className="flex items-center gap-4">
                  <Image 
                    src="/command.png" 
                    alt="Command key" 
                    width={120} 
                    height={120} 
                    className="w-24 h-24 lg:w-32 lg:h-32"
                  />
                  <span className="text-5xl font-bold text-gray-400">+</span>
                  <Image 
                    src="/B.png" 
                    alt="B key" 
                    width={120} 
                    height={120} 
                    className="w-24 h-24 lg:w-32 lg:h-32"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold" style={{ color: "#2D5016" }}>
                    アプリの表示/非表示
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    どこからでもCueMeアプリを瞬時に表示・非表示できます
                  </p>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-3xl p-2 overflow-hidden">
                  <video 
                    src="/commandB.mov" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-auto rounded-2xl"
                  />
                </div>
              </div>
            </div>

            {/* Command + T - Open Chat */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
              <div className="lg:w-1/2 flex flex-col items-center text-center space-y-6">
                <div className="flex items-center gap-4">
                  <Image 
                    src="/command.png" 
                    alt="Command key" 
                    width={120} 
                    height={120} 
                    className="w-24 h-24 lg:w-32 lg:h-32"
                  />
                  <span className="text-5xl font-bold text-gray-400">+</span>
                  <Image 
                    src="/T.png" 
                    alt="T key" 
                    width={120} 
                    height={120} 
                    className="w-24 h-24 lg:w-32 lg:h-32"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold" style={{ color: "#2D5016" }}>
                    チャットを開く
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    AIアシスタントとテキストベースで対話できます
                  </p>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-3xl p-2 overflow-hidden">
                  <video 
                    src="/commandT.mov" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-auto rounded-2xl"
                  />
                </div>
              </div>
            </div>

            {/* Command + L - Start Listening Mode */}
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2 flex flex-col items-center text-center space-y-6">
                <div className="flex items-center gap-4">
                  <Image 
                    src="/command.png" 
                    alt="Command key" 
                    width={120} 
                    height={120} 
                    className="w-24 h-24 lg:w-32 lg:h-32"
                  />
                  <span className="text-5xl font-bold text-gray-400">+</span>
                  <Image 
                    src="/L.png" 
                    alt="L key" 
                    width={120} 
                    height={120} 
                    className="w-24 h-24 lg:w-32 lg:h-32"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold" style={{ color: "#2D5016" }}>
                    リスニングモード開始
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    話しかけるだけで質問でき、AIが自動的に回答します
                  </p>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-3xl p-2 overflow-hidden">
                  <video 
                    src="/commandL.mov" 
                    autoPlay 
                    loop 
                    muted 
                    playsInline
                    className="w-full h-auto rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Core Features Section with Images */}
          <section className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold mb-4" style={{ color: "#2D5016" }}>
                主要機能
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                CueMeの核となる機能を理解して、最大限に活用しましょう
              </p>
            </div>
            
            {/* Audio Features - Full width with image */}
            <div className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-3xl p-12 mb-16">
              <div className="flex flex-col lg:flex-row items-center gap-12">
                <div className="lg:w-1/2">
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: "#f0f9f0", color: "#2D5016" }}
                    >
                      <Volume2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold" style={{ color: "#2D5016" }}>
                      音声コマンド
                    </h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    常時リスニング機能により、いつでも自然な音声で質問できます。AIが質問を自動検出し、適切な回答を提供します。
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">リアルタイム音声認識</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">自動質問検出</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">バックグラウンド動作</span>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <Image 
                    src="/livequestion.png" 
                    alt="音声コマンド機能" 
                    width={500} 
                    height={400} 
                    className="w-full h-auto rounded-2xl shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Document Management - Reverse layout */}
            <div className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-3xl p-12 mb-16">
              <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                <div className="lg:w-1/2">
                  <div className="flex items-center gap-4 mb-6">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ backgroundColor: "#f0f9f0", color: "#2D5016" }}
                    >
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="text-3xl font-bold" style={{ color: "#2D5016" }}>
                      ドキュメント管理
                    </h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    PDFファイルをアップロードするだけで、AIが自動的に内容を解析し、質問と回答のペアを生成します。
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">PDF自動解析</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">Q&A自動生成</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">コレクション管理</span>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <Image 
                    src="/qnaedit.png" 
                    alt="ドキュメント管理" 
                    width={500} 
                    height={400} 
                    className="w-full h-auto rounded-2xl shadow-lg"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <ModeCard
            icon={<User className="w-4 h-4" />}
            title="面接モード"
            description="面接や技術的な質疑応答に最適化された簡潔で自信のある回答"
            features={[
              "60-120秒で話せる量に圧縮",
              "結論ファーストの構成",
              "Big-O記法は1行で簡潔に",
              "自信なさげな表現を排除"
            ]}
            badge="推奨"
          />
          <ModeCard
            icon={<Users className="w-4 h-4" />}
            title="会議モード"
            description="ビジネス会議での議論に適した構造化された回答"
            features={[
              "TL;DR → 議題 → 決定 → 保留 → ToDo",
              "客観的で中立的な表現",
              "不確実な情報は仮説として明示",
              "アクションアイテムの明確化"
            ]}
          />
          <ModeCard
            icon={<TrendingUp className="w-4 h-4" />}
            title="商談モード"
            description="営業・提案シーンでの説得力のある回答"
            features={[
              "顧客メリットを前面に",
              "敬語での丁寧な表現",
              "具体的な事例と数値",
              "次のアクションへの誘導"
            ]}
          />
            </div>
          </section>

          {/* Tips Section */}
          <section className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold mb-4" style={{ color: "#2D5016" }}>
                使用のコツ
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                CueMeをより効果的に活用するためのベストプラクティス
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2" style={{ color: "#2D5016" }}>
                <HelpCircle className="w-5 h-5" />
                効率的な質問の仕方
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">✅ 良い例：</p>
                <p className="text-sm text-gray-600 bg-green-50 p-2 rounded-lg">
                  「ReactのuseEffectフックで、コンポーネントのマウント時にAPIを呼び出す方法を教えて」
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">❌ 避けるべき例：</p>
                <p className="text-sm text-gray-600 bg-red-50 p-2 rounded-lg">
                  「Reactについて教えて」
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2" style={{ color: "#2D5016" }}>
                <FolderOpen className="w-5 h-5" />
                コレクションの整理
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>プロジェクト別にコレクションを分ける</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>分かりやすい名前を付ける</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>定期的に不要なQ&Aを整理する</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                  <span>関連するドキュメントをまとめる</span>
                </li>
              </ul>
            </CardContent>
          </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="text-center space-y-8 py-16 bg-white/70 backdrop-blur-md border-0 shadow-lg rounded-3xl">
            <h2 className="text-4xl font-bold" style={{ color: "#2D5016" }}>
              さあ、始めましょう！
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              チュートリアルを読み終えたら、実際にCueMeを使ってみましょう。
              最初のコレクションを作成して、AIアシスタントの力を体験してください。
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/dashboard/collections/new">
                <Button
                  className="rounded-full px-10 py-4 text-white font-medium text-lg"
                  style={{ backgroundColor: "#2D5016" }}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  最初のコレクションを作成
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="rounded-full px-10 py-4 text-lg"
                  style={{ borderColor: "#2D5016", color: "#2D5016" }}
                >
                  ダッシュボードに戻る
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}