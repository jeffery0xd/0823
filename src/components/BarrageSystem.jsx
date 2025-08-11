import React, { useState, useEffect, useRef } from 'react';

const BarrageSystem = ({ messages }) => {
  const [activeBarrages, setActiveBarrages] = useState([]);
  const [nextBarrageId, setNextBarrageId] = useState(0);
  const barrageRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (!latestMessage.is_own) { // 只显示他人的消息作为弹幕
        createBarrage(latestMessage);
      }
    }
  }, [messages]);

  const createBarrage = (message) => {
    const barrageId = nextBarrageId;
    setNextBarrageId(prev => prev + 1);

    const colors = [
      'text-blue-600', 'text-green-600', 'text-purple-600', 
      'text-red-600', 'text-yellow-600', 'text-pink-600',
      'text-indigo-600', 'text-teal-600'
    ];
    
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const randomTop = Math.random() * 400 + 100; // 随机高度，从100px开始避开导航栏
    const speed = Math.random() * 5 + 8; // 随机速度

    const newBarrage = {
      id: barrageId,
      content: message.content,
      nickname: message.nickname,
      color: randomColor,
      top: randomTop,
      left: window.innerWidth,
      speed: speed,
      opacity: 1
    };

    setActiveBarrages(prev => [...prev, newBarrage]);

    // 动画处理
    const animateBarrage = () => {
      setActiveBarrages(prev => 
        prev.map(barrage => {
          if (barrage.id === barrageId) {
            const newLeft = barrage.left - barrage.speed;
            if (newLeft < -300) {
              // 弹幕移出屏幕，标记为删除
              return { ...barrage, shouldRemove: true };
            }
            return { ...barrage, left: newLeft };
          }
          return barrage;
        }).filter(barrage => !barrage.shouldRemove)
      );
    };

    const intervalId = setInterval(animateBarrage, 50);

    // 10秒后清理
    setTimeout(() => {
      clearInterval(intervalId);
      setActiveBarrages(prev => prev.filter(b => b.id !== barrageId));
    }, 10000);
  };

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" ref={barrageRef} style={{ zIndex: 9999 }}>
      {activeBarrages.map(barrage => (
        <div
          key={barrage.id}
          className={`absolute whitespace-nowrap ${barrage.color} font-medium text-sm sm:text-base bg-white bg-opacity-90 px-2 py-1 rounded shadow-lg border transition-all duration-100`}
          style={{
            left: `${barrage.left}px`,
            top: `${Math.max(barrage.top, 80)}px`, // 确保不被导航栏遮挡
            opacity: barrage.opacity,
            transform: 'translateZ(0)', // 硬件加速
            willChange: 'transform'
          }}
        >
          <span className="text-xs text-gray-500 mr-1">{barrage.nickname}:</span>
          {barrage.content}
        </div>
      ))}
    </div>
  );
};

export default BarrageSystem;