
import React from 'react';
import { motion } from 'framer-motion';

type BadgeProps = {
    text: string;
    icon?: React.ReactNode;
    className?: string;
};

const Badge: React.FC<BadgeProps> = ({ text, icon, className = "" }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-100 bg-white text-sm font-medium text-text-primary shadow-soft ${className}`}
        >
            {icon}
            <span>{text}</span>
        </motion.div>
    );
};

export default Badge;
