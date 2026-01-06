
import React from 'react';
import { motion } from 'framer-motion';
import Badge from './ui/Badge';
import { Trophy } from 'lucide-react';

const FeatureTilted: React.FC = () => {
    return (
        <section className="py-16 max-w-7xl mx-auto px-4 overflow-hidden">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <div className="max-w-xl ml-6">
                    <Badge text="Features" icon={<Trophy size={14} />} className="mb-6" />
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-text-primary leading-[1.1]">
                        あなたの成功のために<br />
                        設計された機能
                    </h2>
                    <p className="text-lg text-text-primary/70 leading-relaxed font-medium">
                        面接の準備から本番、そして振り返りまで。CueMeは一貫してあなたのパフォーマンスを最大化するために作られています。
                    </p>
                </div>

                {/* Floating Cards Animation */}
                <div className="relative h-[550px] flex items-center justify-center">
                    {/* Card 1: Q&A Generation (Blue/Green) */}
                    <motion.div
                        initial={{ rotate: 0, y: 100, opacity: 0 }}
                        whileInView={{ rotate: -5, y: -120, opacity: 1 }}
                        viewport={{ margin: "-100px" }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="absolute w-[380px] bg-sky-50 border border-sky-100 p-8 rounded-2xl shadow-sm z-10 top-[40%] left-1/2 -translate-x-1/2"
                        style={{ transformOrigin: "center center" }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-text-primary">Q&A生成</h3>
                            <div className="w-3 h-3 rounded-full bg-sky-400"></div>
                        </div>
                        <p className="text-text-primary/70 text-sm leading-relaxed font-medium">
                            数千パターンの質問から、あなたの経歴に特化した質問セットを生成。
                        </p>
                    </motion.div>

                    {/* Card 2: Stealth Mode (Lime) */}
                    <motion.div
                        initial={{ rotate: 0, x: 50, opacity: 0 }}
                        whileInView={{ rotate: 2, y: 10, opacity: 1 }}
                        viewport={{ margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.1, type: "spring" }}
                        className="absolute w-[380px] bg-accent-light border border-accent-lime p-8 rounded-2xl shadow-sm z-20 top-[40%] left-1/2 -translate-x-1/2"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-text-primary">ステルスモード</h3>
                            <div className="w-3 h-3 rounded-full bg-accent-lime"></div>
                        </div>
                        <p className="text-text-primary/70 text-sm leading-relaxed font-medium">
                            OSレベルで動作する透過レイヤー。画面共有ツールには一切映りません。
                        </p>
                    </motion.div>

                    {/* Card 3: Real-time AI (Purple) */}
                    <motion.div
                        initial={{ rotate: 0, y: 50, opacity: 0 }}
                        whileInView={{ rotate: -2, y: 140, opacity: 1 }}
                        viewport={{ margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2, type: "spring" }}
                        className="absolute w-[380px] bg-purple-50 border border-purple-100 p-8 rounded-2xl shadow-sm z-30 top-[40%] left-1/2 -translate-x-1/2"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-text-primary">リアルタイムAI</h3>
                            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        </div>
                        <p className="text-text-primary/70 text-sm leading-relaxed font-medium">
                            面接中の音声をリアルタイム解析。言葉に詰まるその瞬間をサポート。
                        </p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default FeatureTilted;
