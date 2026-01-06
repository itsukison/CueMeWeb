
import React from 'react';
import { motion } from 'framer-motion';

const Stats: React.FC = () => {
    const stats = [
        { value: '2000+', label: 'アクティブユーザー' },
        { value: '85%', label: '面接通過の実感' },
        { value: '4.9', label: 'App Store評価' },
        { value: '24/7', label: 'AIサポート' },
    ];

    return (
        <section className="py-12 bg-white border-y border-subtle-bg">
            <div className="px-8 md:px-12 max-w-7xl mx-auto">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            className="flex flex-col items-center md:items-start text-center md:text-left"
                        >
                            <h3 className="text-4xl md:text-5xl font-bold text-text-primary mb-3 tracking-tight">{stat.value}</h3>
                            <p className="text-text-primary/60 font-medium text-base md:text-lg">{stat.label}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Stats;
