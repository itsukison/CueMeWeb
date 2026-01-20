
import React from 'react';
import { motion } from 'framer-motion';
import { Download, Apple } from 'lucide-react';

const DownloadApp: React.FC = () => {
    const [downloadUrl, setDownloadUrl] = React.useState<string>('https://github.com/itsukison/CueMeFinal/releases/latest');

    React.useEffect(() => {
        const fetchLatestRelease = async () => {
            try {
                const response = await fetch('https://api.github.com/repos/itsukison/CueMeFinal/releases/latest');
                if (!response.ok) return;

                const data = await response.json();
                // Find asset ending in .dmg
                const dmgAsset = data.assets?.find((asset: any) => asset.name.endsWith('.dmg'));

                if (dmgAsset) {
                    setDownloadUrl(dmgAsset.browser_download_url);
                } else {
                    // Fallback to the html_url of the release if no dmg found
                    if (data.html_url) setDownloadUrl(data.html_url);
                }
            } catch (error) {
                console.error('Failed to fetch latest release:', error);
            }
        };

        fetchLatestRelease();
    }, []);

    return (
        <section id="download" className="py-28 px-4 relative overflow-hidden">
            <div className="max-w-4xl mx-auto text-center relative z-10">

                {/* Subtle background glow centered behind text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-lime/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-tight text-text-primary leading-[1.1]">
                        アプリをダウンロード
                    </h2>
                    <p className="text-xl md:text-xl text-text-primary/60 max-w-2xl mx-auto font-medium mb-12 leading-relaxed">
                        面接の不安を自信に変える、最高のパートナー。<br />
                        あなたのキャリアを、ここからアップデートしましょう。
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <a
                            href={downloadUrl}
                            className="group relative bg-text-primary hover:bg-black text-white font-bold text-lg px-10 py-5 rounded-full shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            <Apple size={24} className="mb-1" />
                            <span>Mac版をダウンロード</span>
                        </a>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                        className="mt-8 text-sm text-text-primary/40 font-medium tracking-wide"
                    >
                        macOS 12.0以上 (Apple Silicon / Intel対応)
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
};

export default DownloadApp;
