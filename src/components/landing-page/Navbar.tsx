
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, Globe } from 'lucide-react';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 flex justify-center pt-4 px-4`}>
            <div className={`
        flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300
        ${scrolled ? 'bg-app-bg/80 backdrop-blur-md shadow-sm border border-subtle-bg w-full max-w-5xl' : 'bg-transparent w-full max-w-7xl'}
      `}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 cursor-pointer group hover:opacity-80 transition-opacity">
                    <img
                        src="/logo.png"
                        alt="CueMe Logo"
                        className="w-8 h-8 object-contain"
                    />
                    <span className="font-bold text-lg tracking-tight text-text-primary logo-text">CueMe</span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-6 lg:gap-8">
                    <Link href="/ai-interview" className="text-sm font-medium text-text-primary/70 hover:text-text-primary transition-colors">
                        AI面接対策
                    </Link>
                    <Link href="/blog" className="text-sm font-medium text-text-primary/70 hover:text-text-primary transition-colors">
                        ブログ
                    </Link>
                    <Link href="/subscription" className="text-sm font-medium text-text-primary/70 hover:text-text-primary transition-colors">
                        料金
                    </Link>
                    <Link href="#support" className="text-sm font-medium text-text-primary/70 hover:text-text-primary transition-colors">
                        サポート
                    </Link>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center space-x-1 text-sm font-medium text-text-primary/70 hover:text-text-primary transition-colors outline-none">
                            <Globe className="w-3 h-3 mr-1" />
                            <span>JP</span>
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem>日本語</DropdownMenuItem>
                            <DropdownMenuItem>English</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Right Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium text-text-primary hover:text-text-primary/70 transition-colors">
                        ログイン
                    </Link>
                    <Link href="#download">
                        <button className="bg-text-primary text-white text-sm font-medium px-5 py-2.5 rounded-full hover:bg-text-primary/90 transition-colors shadow-lg shadow-gray-200">
                            無料で始める
                        </button>
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-text-primary"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-20 left-4 right-4 bg-app-bg border border-subtle-bg shadow-xl rounded-2xl p-6 flex flex-col gap-4 md:hidden"
                    >
                        <Link href="/ai-interview" className="font-medium text-text-primary" onClick={() => setMobileMenuOpen(false)}>AI面接対策</Link>
                        <Link href="/blog" className="font-medium text-text-primary" onClick={() => setMobileMenuOpen(false)}>ブログ</Link>
                        <Link href="/subscription" className="font-medium text-text-primary" onClick={() => setMobileMenuOpen(false)}>料金</Link>
                        <Link href="#support" className="font-medium text-text-primary" onClick={() => setMobileMenuOpen(false)}>サポート</Link>
                        <div className="h-px bg-subtle-bg my-2"></div>
                        <Link href="/login" className="font-medium text-text-primary" onClick={() => setMobileMenuOpen(false)}>ログイン</Link>
                        <Link href="#download">
                            <Button className="w-full bg-accent-lime text-text-primary hover:bg-accent-light">無料で始める</Button>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
