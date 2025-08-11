import React from 'react';

const GlassCard = ({ children, className = '', hover = true, glow = false }) => {
  return (
    <div className={`
      glass-effect rounded-2xl p-6 shadow-2xl
      ${hover ? 'hover:scale-[1.02] hover:shadow-3xl transition-all duration-300' : ''}
      ${glow ? 'animate-glow' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export default GlassCard;