import React, { useEffect, useState } from 'react';

const Fireworks = ({ isVisible, onComplete }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (isVisible) {
      // 创建多个爆炸点
      const explosions = [
        { x: 20, y: 30, delay: 0 },
        { x: 80, y: 25, delay: 500 },
        { x: 50, y: 40, delay: 1000 },
        { x: 30, y: 20, delay: 1500 },
        { x: 70, y: 35, delay: 2000 }
      ];

      const newParticles = [];
      
      explosions.forEach((explosion, explosionIndex) => {
        // 每个爆炸点创建多个粒子
        for (let i = 0; i < 30; i++) {
          const angle = (i / 30) * Math.PI * 2;
          const velocity = 2 + Math.random() * 3;
          const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FCEA2B', '#FF9FF3', '#54A0FF'];
          
          newParticles.push({
            id: `${explosionIndex}-${i}`,
            x: explosion.x,
            y: explosion.y,
            initialX: explosion.x,
            initialY: explosion.y,
            vx: Math.cos(angle) * velocity,
            vy: Math.sin(angle) * velocity,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 3 + Math.random() * 4,
            delay: explosion.delay,
            life: 1
          });
        }
      });

      setParticles(newParticles);

      // 动画循环
      const animateParticles = () => {
        setParticles(prevParticles => {
          return prevParticles.map(particle => {
            if (Date.now() - particle.delay < 0) return particle;
            
            return {
              ...particle,
              x: particle.x + particle.vx,
              y: particle.y + particle.vy,
              vy: particle.vy + 0.1, // 重力效果
              life: particle.life - 0.02,
              size: particle.size * 0.99
            };
          }).filter(particle => particle.life > 0);
        });
      };

      const animationId = setInterval(animateParticles, 50);

      // 3秒后完成动画
      const timeoutId = setTimeout(() => {
        clearInterval(animationId);
        setParticles([]);
        onComplete();
      }, 3000);

      return () => {
        clearInterval(animationId);
        clearTimeout(timeoutId);
      };
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black bg-opacity-20 animate-pulse"></div>
      
      {/* 粒子效果 */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: particle.life,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            transform: `scale(${particle.life})`,
            transition: 'all 0.05s ease-out'
          }}
        />
      ))}

      {/* 中央文字效果 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center animate-bounce">
          <div className="text-6xl mb-4 animate-pulse">🏆</div>
          <div className="text-3xl font-bold text-yellow-400 drop-shadow-lg animate-pulse">
            每日龙虎榜
          </div>
          <div className="text-xl text-white drop-shadow-lg mt-2 animate-pulse">
            ROI排行榜
          </div>
        </div>
      </div>

      {/* 星星闪烁效果 */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`star-${i}`}
          className="absolute animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1 + Math.random() * 2}s`
          }}
        >
          ⭐
        </div>
      ))}
    </div>
  );
};

export default Fireworks;