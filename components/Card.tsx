import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, icon }) => {
  return (
    <div className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md ${className}`}>
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
