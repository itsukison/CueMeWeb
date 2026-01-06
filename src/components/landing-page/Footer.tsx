
import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
    return (
        <footer className="py-12 px-4 md:px-8 mt-12 mb-12">
            <div className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-[40px] shadow-sm overflow-hidden">
                <div className="p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row justify-between gap-12">
                    <div className="max-w-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <img src="/logo.png" alt="logo" className="w-8 h-8 object-contain" />
                            <span className="font-bold text-xl tracking-tight text-text-primary logo-text">CueMe</span>
                        </div>
                        <p className="text-text-primary/60 leading-relaxed font-medium">
                            AI面接対策ツールで、あなたの転職を成功に導きます。<br />
                            見えないアシスタントが、自信と結果をもたらします。
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-16 md:gap-32">
                        <div className="flex flex-col gap-4">
                            <h4 className="font-bold text-text-primary">製品</h4>
                            <Link href="/ai-interview" className="text-text-primary/60 hover:text-text-primary transition-colors font-medium">AI面接対策</Link>
                            <Link href="/subscription" className="text-text-primary/60 hover:text-text-primary transition-colors font-medium">料金プラン</Link>
                            <Link href="#" className="text-text-primary/60 hover:text-text-primary transition-colors font-medium">企業向け</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="font-bold text-text-primary">コンテンツ</h4>
                            <Link href="/blog" className="text-text-primary/60 hover:text-text-primary transition-colors font-medium">ブログ</Link>
                            <Link href="/blog/guide" className="text-text-primary/60 hover:text-text-primary transition-colors font-medium">AI面接ガイド</Link>
                            <Link href="/questions" className="text-text-primary/60 hover:text-text-primary transition-colors font-medium">面接質問集</Link>
                        </div>
                        <div className="flex flex-col gap-4">
                            <h4 className="font-bold text-text-primary">会社情報</h4>
                            <Link href="/legal/tokusho" className="text-text-primary/60 hover:text-text-primary transition-colors font-medium">特商法表記</Link>
                            <Link href="/legal/privacy" className="text-text-primary/60 hover:text-text-primary transition-colors font-medium">プライバシー</Link>
                            <Link href="/legal/terms" className="text-text-primary/60 hover:text-text-primary transition-colors font-medium">利用規約</Link>
                        </div>
                    </div>
                </div>

                <div className="bg-subtle-bg text-text-primary/60 py-5 px-8 md:px-12 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-medium border-t border-gray-100">
                    <div className="opacity-80">
                        © 2025 CueMe. All rights reserved.
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="hover:text-text-primary transition-colors">Twitter</Link>
                        <Link href="#" className="hover:text-text-primary transition-colors">LinkedIn</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
