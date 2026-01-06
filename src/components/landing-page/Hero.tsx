
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, Download, ArrowRight, Box, Circle, Mic, Video } from 'lucide-react';
import Badge from './ui/Badge';
import Link from 'next/link';
import { Button } from "@/components/ui/button";

const Hero: React.FC = () => {
    // Interactive Slider Logic
    const [dragPosition, setDragPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !containerRef.current) return;
        const container = containerRef.current.getBoundingClientRect();
        let newPos = ((e.clientX - container.left) / container.width) * 100;
        newPos = Math.max(0, Math.min(100, newPos));
        setDragPosition(newPos);
    };

    useEffect(() => {
        const handleMouseUpWindow = () => setIsDragging(false);
        window.addEventListener("mouseup", handleMouseUpWindow);
        return () => window.removeEventListener("mouseup", handleMouseUpWindow);
    }, []);

    return (
        <section className="pt-18 pb-12 px-4 flex flex-col items-center text-center overflow-hidden">
            <Badge
                icon={<img src="/logo.png" className="w-4 h-4 object-contain" alt="logo" />}
                text="AI Interview Assistant"
                className="mb-6"
            />

            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-5xl md:text-7xl lg:text-7xl font-black tracking-tight text-text-primary mb-6 leading-[1.0]"
            >
                見えない会話アシスト <br />
                <span className="bg-gradient-to-r from-text-primary  bg-clip-text ">
                    CueMe
                </span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg md:text-lg text-text-primary/70 max-w-2xl mb-8 leading-relaxed font-medium"
            >
                面接も、商談も、日常の会話も。<br className="md:hidden" />
                あなたを密かに支える、次世代のリアルタイムAI
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col items-center gap-6 mb-16"
            >
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="#download">
                        <button className="bg-accent-lime hover:bg-accent-light text-text-primary font-bold text-base px-6 py-3 rounded-full shadow-lg shadow-lime-200/50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                            <Download size={20} /> 無料で始める
                        </button>
                    </Link>
                    <Link href="/tutorial">
                        <button className="bg-white hover:bg-gray-50 text-text-primary font-bold text-base px-6 py-3 rounded-full shadow-sm border border-subtle-bg transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                            <ArrowRight size={20} /> デモを見る
                        </button>
                    </Link>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 text-sm font-medium text-text-primary bg-white px-6 py-2 rounded-full border border-subtle-bg shadow-sm">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"
                                style={{ backgroundImage: `url(https://picsum.photos/32/32?random=${i})`, backgroundSize: 'cover' }}
                            />
                        ))}
                        <div className="w-8 h-8 rounded-full bg-subtle-bg border-2 border-white flex items-center justify-center text-[10px] font-bold text-text-primary">
                            UP
                        </div>
                    </div>
                    <div className="h-4 w-px bg-subtle-bg hidden md:block"></div>
                    <span>多くの就活生が利用中</span>
                    <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                        <span className="text-text-primary ml-1 font-bold">5.0</span>
                    </div>
                </div>
            </motion.div>

            {/* Hero Browser Mockup */}
            <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="w-full max-w-5xl relative"
            >
                <div className="absolute inset-0 bg-gradient-to-t from-accent-lime/20 to-transparent blur-3xl -z-10 rounded-full opacity-50"></div>

                <div className="rounded-3xl shadow-2xl border border-gray-200 overflow-hidden h-[400px] md:h-[600px] relative bg-gray-900" ref={containerRef}>

                    <div
                        className="relative w-full h-full cursor-col-resize select-none overflow-hidden"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                    >
                        {/* Layer 1: Normal Screen (No CueMe) */}
                        <div className="absolute inset-0">
                            <img
                                src="/inivisible.png"
                                alt="Without CueMe"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-8 left-8 bg-black/70 backdrop-blur text-white text-sm px-4 py-2 rounded-lg font-medium shadow-sm">
                                相手に見えている画面
                            </div>
                        </div>

                        {/* Layer 2: With CueMe (Clipped) */}
                        <div
                            className="absolute inset-0"
                            style={{ clipPath: `inset(0 0 0 ${dragPosition}%)` }}
                        >
                            <img
                                src="/visible.png"
                                alt="With CueMe"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-8 right-8 bg-accent-lime/90 backdrop-blur text-text-primary text-sm font-bold px-4 py-2 rounded-lg shadow-lg border border-accent-lime">
                                あなたにだけ見える画面
                            </div>
                        </div>

                        {/* Slider Handle */}
                        <div
                            className="absolute top-0 h-full w-1 bg-white cursor-col-resize z-30 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                            style={{ left: `${dragPosition}%`, transform: "translateX(-50%)" }}
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl">
                                <div className="flex gap-1">
                                    <div className="w-0.5 h-4 bg-gray-300 rounded-full"></div>
                                    <div className="w-0.5 h-4 bg-gray-300 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-center items-center gap-2 text-sm text-text-primary/60 font-medium bg-white/50 backdrop-blur-sm py-2 px-4 rounded-full w-fit mx-auto border border-subtle-bg">
                    <span className="text-lg">←</span> スライダーを動かして比較 <span className="text-lg">→</span>
                </div>
            </motion.div>
        </section>
    );
};

export default Hero;
