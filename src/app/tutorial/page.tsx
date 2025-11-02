"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Mic,
  FileText,
  User,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Volume2,
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
    <Card className="bg-card-light border border-card-dark/10 shadow-md hover:shadow-lg transition-all duration-300 rounded-container h-full group">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-accent-light group-hover:bg-accent-lime transition-colors duration-300">
            {icon}
          </div>
          <CardTitle className="text-xl font-semibold text-text-primary">
            {title}
          </CardTitle>
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <CheckCircle className="w-4 h-4 mt-0.5 text-accent-lime flex-shrink-0" />
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
    <Card className="bg-card-light border border-card-dark/10 shadow-md hover:shadow-lg transition-all duration-300 rounded-container">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-text-primary">
            {step}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-accent-light">
                {icon}
              </div>
              <h3 className="font-semibold text-lg text-text-primary">
                {title}
              </h3>
            </div>
            <p className="text-gray-600 text-sm mb-3">{description}</p>
            {action && (
              <Link href={action.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs border-text-primary text-text-primary hover:bg-text-primary hover:text-white transition-colors"
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
    <Card className="bg-card-light border border-card-dark/10 shadow-md hover:shadow-lg transition-all duration-300 rounded-container group">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent-light group-hover:bg-accent-lime transition-colors duration-300">
              {icon}
            </div>
            <CardTitle className="text-lg font-semibold text-text-primary">
              {title}
            </CardTitle>
          </div>
          {badge && (
            <span className="text-xs bg-accent-lime text-text-primary px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-gray-600 text-sm">{description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <ul className="space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="text-xs text-gray-600 flex items-center gap-2">
              <div className="w-1 h-1 bg-accent-lime rounded-full" />
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
    <div className="min-h-screen bg-app-bg">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="space-y-16">
          {/* Hero Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-light/30 to-transparent rounded-3xl blur-3xl -z-10" />
            
            <div className="text-center space-y-8 relative">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-accent-lime/20 rounded-full blur-xl" />
                  <Image src="/logo.png" alt="CueMe Logo" width={64} height={64} className="w-16 h-16 relative z-10" />
                </div>
                <h1 className="text-5xl font-bold text-text-primary">
                  チュートリアル
                </h1>
              </div>
              <p className="text-xl -mt-4 font-medium text-gray-600 max-w-2xl mx-auto">
                CueMeの機能を最大限に活用するための完全ガイド
              </p>
            </div>
          </div>

          {/* Demo Video Section */}
          <section className="space-y-6 -mt-12">
            <div className="text-left p-8">
              <h2 className="text-4xl font-bold mb-4 text-text-primary">
                デモ動画
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                CueMeの使い方を動画で確認しましょう
              </p>
            </div>
            
            <div className="max-w-5xl mx-auto">
              <div className="bg-card-light border border-card-dark/10 shadow-lg rounded-container p-4">
                <video 
                  src="/demo.mp4" 
                  controls 
                  className="w-full h-auto rounded-xl"
                >
                  お使いのブラウザは動画タグをサポートしていません。
                </video>
              </div>
            </div>
          </section>

          {/* Keyboard Shortcuts Section */}
          <section className="space-y-20">
            <div className="relative p-8 rounded-2xl">
              <h2 className="text-4xl font-bold mb-4 text-text-primary">
                キーボードショートカット
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                CueMeを素早く操作するための便利なショートカット
              </p>
            </div>
            
            {/* Command + B */}
            <div className="flex flex-col lg:flex-row items-center gap-16 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-accent-light/10 to-transparent rounded-3xl -z-10" />
              
              <div className="lg:w-1/2 flex flex-col items-center text-center space-y-6 relative z-10">
                <div className="flex items-center gap-4 p-6 rounded-2xl">
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
                  <h3 className="text-xl font-bold text-text-primary">
                    アプリの表示/非表示
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    どこからでもCueMeアプリを瞬時に表示・非表示できます
                  </p>
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="bg-card-light border border-card-dark/10 shadow-lg rounded-3xl p-2 overflow-hidden">
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

            {/* Command + T */}
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
                  <h3 className="text-xl font-bold text-text-primary">
                    チャットを開く
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    AIアシスタントとテキストベースで対話できます
                  </p>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-card-light border border-card-dark/10 shadow-lg rounded-3xl p-2 overflow-hidden">
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

            {/* Command + L */}
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
                  <h3 className="text-xl font-bold text-text-primary">
                    リスニングモード開始
                  </h3>
                  <p className="text-sm text-gray-600 max-w-md">
                    話しかけるだけで質問でき、AIが自動的に回答します
                  </p>
                </div>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-card-light border border-card-dark/10 shadow-lg rounded-3xl p-2 overflow-hidden">
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

          {/* Core Features Section */}
          <section className="space-y-12">
            <div>
              <h2 className="text-4xl font-bold mb-4 text-text-primary">
                主要機能
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                CueMeの核となる機能を理解して、最大限に活用しましょう
              </p>
            </div>
            
            {/* Audio Features */}
            <div className="relative bg-card-light border border-card-dark/10 shadow-md rounded-3xl p-12 mb-16 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-accent-lime/5 rounded-full blur-3xl -z-10" />
              
              <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
                <div className="lg:w-1/2">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent-light">
                      <Volume2 className="w-8 h-8 text-text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary">
                      音声コマンド
                    </h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    常時リスニング機能により、いつでも自然な音声で質問できます。AIが質問を自動検出し、適切な回答を提供します。
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-card-dark/30 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-accent-lime" />
                      <span className="text-gray-700 font-medium">リアルタイム音声認識</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-card-dark/30 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-accent-lime" />
                      <span className="text-gray-700 font-medium">自動質問検出</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-card-dark/30 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-accent-lime" />
                      <span className="text-gray-700 font-medium">バックグラウンド動作</span>
                    </div>
                  </div>
                </div>
                <div className="lg:w-1/2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-accent-lime/10 rounded-2xl blur-xl" />
                    <Image 
                      src="/livequestion.png" 
                      alt="音声コマンド機能" 
                      width={500} 
                      height={400} 
                      className="w-full h-auto rounded-2xl shadow-lg relative z-10 border border-card-dark/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Document Management */}
            <div className="bg-card-light border border-card-dark/10 shadow-md rounded-3xl p-12 mb-16">
              <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                <div className="lg:w-1/2">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-accent-light">
                      <FileText className="w-8 h-8 text-text-primary" />
                    </div>
                    <h3 className="text-3xl font-bold text-text-primary">
                      ドキュメント管理
                    </h3>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    PDFファイルをアップロードするだけで、AIが自動的に内容を解析し、質問と回答のペアを生成します。
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-accent-lime" />
                      <span className="text-gray-700">PDF自動解析</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-accent-lime" />
                      <span className="text-gray-700">Q&A自動生成</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-accent-lime" />
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

            {/* Mode Cards */}
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

          {/* CTA Section */}
          <section className="relative text-center space-y-8 py-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent-lime/20 via-accent-light/30 to-transparent rounded-3xl" />
            <div className="absolute inset-0 bg-card-light/80 rounded-3xl border border-card-dark/20" />
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold text-text-primary mb-4">
                さあ、始めましょう
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-8">
                チュートリアルを読み終えたら、実際にCueMeを使ってみましょう。
                最初のコレクションを作成して、AIアシスタントの力を体験してください。
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Link href="/login">
                  <Button className="rounded-full px-10 py-4 text-white font-medium text-lg bg-text-primary hover:bg-gray-900 shadow-lg hover:shadow-xl transition-all duration-300">
                    <Plus className="w-5 h-5 mr-2" />
                    無料で始める
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    variant="outline"
                    className="rounded-full px-10 py-4 text-lg border-text-primary text-text-primary hover:bg-text-primary hover:text-white transition-all duration-300"
                  >
                    ホームに戻る
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
