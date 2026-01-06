
import React from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, XAxis } from 'recharts';
import { MousePointer2, User, Briefcase } from 'lucide-react';
import Badge from './ui/Badge';

const data = [
    { name: 'Mon', value: 40 },
    { name: 'Tue', value: 30 },
    { name: 'Wed', value: 55 },
    { name: 'Thu', value: 35 },
    { name: 'Fri', value: 20 },
    { name: 'Sat', value: 65 },
    { name: 'Sun', value: 75 },
];

const FeatureSplit: React.FC = () => {
    return (
        <section id="features" className="py-6 px-4 md:px-8">
            <div className="text-center mb-6">
                <Badge text="How it works" icon={<div className="w-2 h-2 rounded-full bg-text-primary"></div>} className="mb-4" />
                <h2 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight text-text-primary">
                    3ステップで完璧準備
                </h2>
                <p className="text-base text-text-primary/70 max-w-xl mx-auto font-medium">
                    複雑な設定は不要。インストールして起動するだけ。
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-stretch">
                {/* Left Card: Analytics */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="bg-card-light border border-subtle-bg rounded-[24px] p-5 md:p-6 relative overflow-hidden group flex flex-col"
                >
                    <div className="mb-4 relative z-10">
                        <h3 className="text-xl font-bold mb-2 text-text-primary">自動質問検出</h3>
                        <p className="text-text-primary/70 leading-relaxed font-medium text-sm">会話音声から質問をリアルタイム抽出。</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-subtle-bg p-4 relative z-10 flex-1 flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-semibold text-sm text-text-primary">パフォーマンス</h4>
                            <div className="flex items-center gap-2 text-xs text-text-primary/70 border border-subtle-bg rounded-lg px-2 py-1 bg-white">
                                過去7日間
                            </div>
                        </div>

                        <div className="text-center mb-4">
                            <div className="text-2xl font-bold text-text-primary">85%</div>
                            <div className="text-[10px] text-text-primary/50 mt-0.5 font-medium">面接通過率の向上</div>
                        </div>

                        <div className="h-[140px] w-full relative mt-auto">
                            {/* Custom Indicator overlay mimicking the design */}
                            <div className="absolute top-[45%] left-[45%] z-20 flex flex-col items-center">
                                <div className="w-8 h-8 bg-accent-lime/20 rounded-full flex items-center justify-center animate-pulse">
                                    <div className="w-4 h-4 bg-accent-lime rounded-full border-2 border-white shadow-lg"></div>
                                </div>
                                <div className="h-16 w-px bg-accent-lime/50 absolute top-4 -z-10"></div>
                                <div className="h-16 w-px bg-accent-lime/50 absolute bottom-12 -z-10"></div>
                            </div>

                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#D8F9B8" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#D8F9B8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" hide />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#a3e635" // approximate accent-lime darker shade for visibility
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-lime/20 rounded-full blur-2xl opacity-50"></div>
                </motion.div>

                {/* Right Card: Writing Assistant */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="bg-subtle-bg/50 border border-subtle-bg rounded-[24px] p-5 md:p-6 relative overflow-hidden flex flex-col"
                >
                    <div className="mb-4 relative z-10">
                        <h3 className="text-xl font-bold mb-2 text-text-primary">パーソナライズ回答</h3>
                        <p className="text-text-primary/70 leading-relaxed font-medium text-sm">履歴書や経験に基づき、その場で最適解を生成。</p>
                    </div>

                    <div className="relative h-[200px] w-full mt-auto flex items-center justify-center">
                        {/* Connection Lines (SVG) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40">
                            {/* Left Curve (Interviewer) */}
                            <path d="M80,80 C150,80 150,140 250,140" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="6 6" />
                            {/* Right Curve (User) */}
                            <path d="M480,80 C400,80 400,140 300,140" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="6 6" />
                        </svg>

                        {/* Node 1: Interviewer (Left Top) */}
                        <div className="absolute top-8 left-4 md:left-8 bg-white p-3 pr-6 rounded-2xl shadow-sm border border-subtle-bg flex items-center gap-3 z-10 min-w-[160px] transform hover:scale-105 transition-transform duration-300">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                <Briefcase size={18} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-text-primary">面接官</div>
                                <div className="text-[10px] text-text-primary/50 font-medium">自己紹介を...</div>
                            </div>
                        </div>

                        {/* Node 2: User (Right Top) */}
                        <div className="absolute top-8 right-4 md:right-8 bg-white p-3 pr-6 rounded-2xl shadow-sm border border-subtle-bg flex items-center gap-3 z-10 min-w-[160px] transform hover:scale-105 transition-transform duration-300">
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                                <User size={18} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-text-primary">ユーザー</div>
                                <div className="text-[10px] text-text-primary/50 font-medium">志望動機は...</div>
                            </div>
                        </div>

                        {/* Central Node: CueMe AI (Bottom Center) - Enlarged */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm p-4 pr-8 rounded-3xl shadow-xl border-t border-white/50 border-b-4 border-b-subtle-bg flex items-center gap-4 z-20 min-w-[280px]">
                            <div className="w-12 h-12 rounded-full bg-accent-lime flex items-center justify-center text-text-primary shadow-inner shrink-0">
                                <img src="/logo.png" alt="AI" className="w-6 h-6 object-contain" />
                            </div>
                            <div className="flex-1">
                                <div className="text-base font-bold text-text-primary flex items-center gap-2">
                                    CueMe AI
                                    <span className="px-2 py-0.5 rounded-full bg-accent-lime/20 text-accent-lime-dark text-[10px] font-extrabold uppercase tracking-wider">PRO</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-lime opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-lime"></span>
                                    </span>
                                    <span className="text-xs text-text-primary/60 font-medium">回答をリアルタイム生成中...</span>
                                </div>
                            </div>
                        </div>

                        {/* Cursor Icon */}
                        <div className="absolute top-[60%] left-[60%] z-30 drop-shadow-md animate-bounce-slow opacity-80">
                            <MousePointer2 className="text-sky-500 fill-sky-500 stroke-white" size={28} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default FeatureSplit;
