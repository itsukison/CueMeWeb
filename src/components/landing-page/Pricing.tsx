
import React from 'react';
import { Rocket, User, Briefcase, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Badge from './ui/Badge';

interface PricingCardProps {
    title: string;
    description: string;
    price: string;
    period: string;
    icon: React.ReactNode;
    theme: 'white' | 'green' | 'dark';
    features: string[];
}

const PricingCard: React.FC<PricingCardProps> = ({ title, description, price, period, icon, theme, features }) => {
    const isDark = theme === 'dark';
    const isGreen = theme === 'green';

    const bgClass = isDark ? 'bg-text-primary text-white' : isGreen ? 'bg-accent-light' : 'bg-white';
    const borderClass = isDark ? 'border-text-primary' : isGreen ? 'border-accent-lime' : 'border-gray-100';
    const textClass = isDark ? 'text-gray-400' : 'text-text-primary/60';
    const titleClass = isDark ? 'text-white' : 'text-text-primary';
    const buttonClass = isDark
        ? 'bg-white text-text-primary hover:bg-gray-100'
        : isGreen
            ? 'bg-text-primary text-white hover:bg-text-primary/90 shadow-lg shadow-lime-200/50'
            : 'bg-white border border-gray-200 text-text-primary hover:border-gray-300';

    return (
        <div className={`rounded-3xl p-6 border ${bgClass} ${borderClass} flex flex-col h-full hover:shadow-md transition-all duration-300 relative overflow-hidden`}>
            {isGreen && <div className="absolute top-0 right-0 bg-accent-lime text-text-primary text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-accent-lime">POPULAR</div>}

            <div className="flex items-center gap-4 mb-4">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                    {icon}
                </div>
                <div>
                    <h3 className={`text-lg font-bold ${titleClass}`}>{title}</h3>
                    <p className={`text-xs ${textClass} font-medium`}>{description}</p>
                </div>
            </div>

            <div className="mb-4">
                <span className={`text-3xl font-bold tracking-tight ${titleClass}`}>{price}</span>
                <span className={`text-xs ${textClass}`}> / {period}</span>
            </div>

            <div className="border-b border-gray-100/10 mb-4"></div>

            <div className="flex-1 mb-6">
                <ul className="space-y-2">
                    {features.map((feat, i) => (
                        <li key={i} className={`flex items-start gap-2 text-xs font-medium ${textClass}`}>
                            <CheckCircle size={14} className={isGreen ? "text-accent-lime-dark shrink-0" : "text-accent-lime shrink-0"} />
                            <span>{feat}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <Link href="/subscription" className="w-full mt-auto">
                <button className={`w-full py-3 rounded-full font-bold text-sm transition-all ${buttonClass}`}>
                    始める
                </button>
            </Link>
        </div>
    );
};

const Pricing: React.FC = () => {
    return (
        <section id="pricing" className="py-12 max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-8">
                <Badge text="Pricing" icon={<Rocket size={14} />} className="mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-text-primary">シンプルな料金プラン</h2>
                <p className="text-text-primary/60 mb-8 font-medium text-sm">長期利用がお得な年額プランをご用意しました。</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                <PricingCard
                    title="フリー"
                    description="お試し利用"
                    price="無料"
                    period="月"
                    icon={<User size={18} className="text-gray-600" />}
                    theme="white"
                    features={[
                        "基本質問セットの利用",
                        "月3回までの模擬面接",
                        "基本的な回答生成"
                    ]}
                />
                <PricingCard
                    title="スタンダード"
                    description="本格的な対策"
                    price="¥750"
                    period="月"
                    icon={<Rocket size={18} className="text-gray-600" />}
                    theme="green"
                    features={[
                        "無制限のQ&A生成",
                        "無制限の模擬面接",
                        "リアルタイム音声認識",
                        "履歴書からのカスタム対策",
                        "優先メールサポート"
                    ]}
                />
                <PricingCard
                    title="プロフェッショナル"
                    description="短期集中・重要面接"
                    price="¥2,500"
                    period="月"
                    icon={<Briefcase size={18} className="text-white" />}
                    theme="dark"
                    features={[
                        "スタンダードの全機能",
                        "GPT-4oによる高度な添削",
                        "英語面接対応",
                        "専属キャリアコーチング",
                        "24時間以内の優先サポート"
                    ]}
                />
            </div>
        </section>
    );
};

export default Pricing;
