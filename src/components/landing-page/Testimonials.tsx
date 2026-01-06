
import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import Badge from './ui/Badge';

const testimonials = [
    {
        name: 'K.T.',
        role: 'マーケティング職 / 20代',
        avatar: 'https://picsum.photos/100/100?random=1',
        content: "面接で頭が真っ白になることが多かったのですが、CueMeのおかげで落ち着いて回答できるようになり、第一志望に内定しました。"
    },
    {
        name: 'Y.S.',
        role: 'エンジニア / 30代',
        avatar: 'https://picsum.photos/100/100?random=2',
        content: "技術面接のライブコーディング中に、思考を整理するためのヒントをリアルタイムでくれたのが本当に助かりました。"
    },
    {
        name: 'D.Y.',
        role: '営業職 / 20代',
        avatar: 'https://picsum.photos/100/100?random=3',
        content: "想定外の質問が来た時も、スムーズな切り返し方を提案してくれたおかげで、会話が途切れることなく盛り上がりました。"
    },
    {
        name: 'A.S.',
        role: '事務職 / 20代',
        avatar: 'https://picsum.photos/100/100?random=4',
        content: "自分の経歴書を読み込ませるだけで、ここまでパーソナライズされた模擬面接ができるなんて驚きです。練習の質が変わりました。"
    },
    {
        name: 'M.T.',
        role: 'コンサルタント / 30代',
        avatar: 'https://picsum.photos/100/100?random=5',
        content: "ケース面接の壁打ち相手として最適。論理の飛躍を指摘してくれるので、独りよがりな回答にならずに済みました。"
    },
    {
        name: 'M.I.',
        role: 'デザイナー / 20代',
        avatar: 'https://picsum.photos/100/100?random=6',
        content: "ポートフォリオの説明で言葉に詰まらず、自分のデザイン意図を明確に伝えるサポートをしてくれました。"
    },
    {
        name: 'S.W.',
        role: 'プロダクトマネージャー / 30代',
        avatar: 'https://picsum.photos/100/100?random=7',
        content: "英語面接で、ネイティブらしい自然なフレーズを瞬時に提案してくれたのが心強かったです。自信を持って挑めました。"
    },
    {
        name: 'M.K.',
        role: '人事 / 20代',
        avatar: 'https://picsum.photos/100/100?random=8',
        content: "採用側の視点で見ても、CueMeのアドバイスは非常に的確。求職者が本当に伝えるべき強みを引き出してくれています。"
    },
    {
        name: 'T.K.',
        role: '新卒 / 20代',
        avatar: 'https://picsum.photos/100/100?random=9',
        content: "面接練習の相手がいなくても、これさえあれば深夜でも質の高い練習ができる。就活生全員におすすめしたいです。"
    }
];

const Testimonials: React.FC = () => {
    return (
        <section id="testimonials" className="py-24 px-8 md:px-12 relative overflow-hidden">
            <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
                <Badge text="Success Stories" icon={<Star size={14} />} className="mb-6" />
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-text-primary"
                >
                    ユーザーの声
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-lg text-text-primary/60 font-medium"
                >
                    多くの転職者がCueMeを使ってキャリアアップを実現しています。
                </motion.p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {testimonials.map((testimonial, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-card-light p-8 rounded-[32px] border border-subtle-bg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full"
                    >
                        <div>
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                                        <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-text-primary">{testimonial.name}</div>
                                        <div className="text-xs text-text-primary/50 font-medium">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex text-yellow-400 mb-3">
                                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                            </div>
                            <p className="text-text-primary/70 leading-relaxed text-[15px] font-medium">
                                {testimonial.content}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Subtle dot pattern background */}
            <div className="absolute inset-0 bg-[radial-gradient(#d4d4d4_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none -z-10"></div>
        </section>
    );
};

export default Testimonials;
