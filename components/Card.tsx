import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, icon }) => {
  return (
    <div className={`bg-white p-5 rounded-3xl shadow-[0_2px_12px_-2px_rgba(0,0,0,0.03)] border border-gray-50 transition-all hover:shadow-[0_8px_20px_-4px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {icon}
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;