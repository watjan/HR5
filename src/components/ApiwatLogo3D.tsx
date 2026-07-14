import { useState, useEffect } from 'react';

interface ApiwatLogo3DProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function ApiwatLogo3D({ size = 'md', className = '' }: ApiwatLogo3DProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Automatic slow hover-like tilt animation when not hovered
  useEffect(() => {
    if (isHovered) return;
    let frameId: number;
    const animate = (time: number) => {
      const angleX = Math.sin(time / 1500) * 8;
      const angleY = Math.cos(time / 2000) * 10;
      setRotate({ x: angleX, y: angleY });
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [isHovered]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    // Map movement to tilt angles (max +/- 25 degrees)
    const factor = size === 'lg' ? 20 : 15;
    const angleX = -(y / (rect.height / 2)) * factor;
    const angleY = (x / (rect.width / 2)) * factor;
    setRotate({ x: angleX, y: angleY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // Dimensions based on size prop
  const dimensions = {
    sm: {
      container: 'w-10 h-10',
      perspective: 'perspective(400px)',
      shadow: 'shadow-md',
      textHidden: true,
    },
    md: {
      container: 'w-24 h-24',
      perspective: 'perspective(600px)',
      shadow: 'shadow-lg',
      textHidden: false,
    },
    lg: {
      container: 'w-64 h-64 md:w-72 md:h-72',
      perspective: 'perspective(1000px)',
      shadow: 'shadow-2xl',
      textHidden: false,
    },
  }[size];

  return (
    <div
      className={`relative select-none flex flex-col items-center justify-center ${dimensions.container} ${className}`}
      style={{ perspective: '1000px' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 3D Perspective Wrapper */}
      <div
        className="w-full h-full flex flex-col items-center justify-center transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow backdrop effect */}
        <div 
          className={`absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-red-500/25 blur-xl transition-opacity duration-300 ${
            isHovered ? 'opacity-100 scale-110' : 'opacity-70'
          }`}
          style={{ transform: 'translateZ(-20px)' }}
        />

        {/* The 3D Emblem Container */}
        <div 
          className="w-full h-full relative flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Layer 1: Background Flames (Plates of Fire) */}
          <div 
            className="absolute inset-0 flex items-center justify-center animate-pulse"
            style={{ 
              transform: 'translateZ(-10px)',
              animationDuration: '3s'
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
              <defs>
                <linearGradient id="flameGrad" x1="0%" y1="100%" x2="50%" y2="0%">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#f97316" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Left Fire Wings */}
              <path 
                d="M 40,110 C 20,95 20,70 45,55 C 25,65 20,80 35,95 C 40,100 50,105 60,108 C 50,111 43,112 40,110 Z" 
                fill="url(#flameGrad)"
              />
              <path 
                d="M 25,120 C 10,105 12,85 35,75 C 20,85 18,98 30,110 C 35,115 45,118 55,120 C 45,122 35,123 25,120 Z" 
                fill="url(#flameGrad)"
                opacity="0.8"
              />
              {/* Right Fire Wings */}
              <path 
                d="M 160,110 C 180,95 180,70 155,55 C 175,65 180,80 165,95 C 160,100 150,105 140,108 C 150,111 157,112 160,110 Z" 
                fill="url(#flameGrad)"
                transform="scale(-1, 1) translate(-200, 0)"
              />
              <path 
                d="M 175,120 C 190,105 188,85 165,75 C 180,85 182,98 170,110 C 165,115 155,118 145,120 C 155,122 165,123 175,120 Z" 
                fill="url(#flameGrad)"
                opacity="0.8"
                transform="scale(-1, 1) translate(-200, 0)"
              />
              {/* Backglow Flames behind the Cloche */}
              <path 
                d="M 70,80 C 70,50 100,20 130,40 C 100,30 85,50 85,80 Z" 
                fill="url(#flameGrad)"
                className="animate-bounce"
                style={{ animationDuration: '4s' }}
              />
            </svg>
          </div>

          {/* Layer 2: Core Culinary Ware (3D extruded look) */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: 'translateZ(15px)' }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
              <defs>
                {/* Shiny Chrome Silver Gradients */}
                <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="25%" stopColor="#cbd5e1" />
                  <stop offset="50%" stopColor="#64748b" />
                  <stop offset="75%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>
                <linearGradient id="chromeHighlight" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#1e293b" stopOpacity="0.6" />
                  <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
                </linearGradient>

                {/* Pot Red Ceramic Gradients */}
                <radialGradient id="redPotGrad" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="70%" stopColor="#b91c1c" />
                  <stop offset="100%" stopColor="#7f1d1d" />
                </radialGradient>
                <linearGradient id="metalHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="30%" stopColor="#ffffff" stopOpacity="0" />
                  <stop offset="70%" stopColor="#000000" stopOpacity="0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
                </linearGradient>

                {/* Dark Handle Gradients */}
                <linearGradient id="handleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* A. RED COOKING POT (Right background element) */}
              <g transform="translate(15, 5)">
                {/* Steam effect (animated SVG paths) */}
                <path d="M125,45 Q120,35 125,25 T120,5" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" className="animate-pulse" />
                <path d="M135,43 Q138,33 133,23 T138,8" fill="none" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round" opacity="0.4" className="animate-pulse" style={{ animationDelay: '0.5s' }} />

                {/* Pot Handles */}
                <rect x="155" y="70" width="22" height="10" rx="4" fill="url(#handleGrad)" stroke="#1e293b" strokeWidth="1" />
                
                {/* Pot Body */}
                <path d="M110,65 L160,67 C165,67 168,71 168,76 L160,105 C158,112 150,116 142,116 L110,116 Z" fill="url(#redPotGrad)" stroke="#7f1d1d" strokeWidth="1" />
                <path d="M110,65 L160,67 C165,67 168,71 168,76 L160,105 C158,112 150,116 142,116 L110,116 Z" fill="url(#metalHighlight)" style={{ mixBlendMode: 'multiply' }} />
                
                {/* Pot Lid */}
                <path d="M107,63 L162,65 L157,55 L112,53 Z" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="1" />
                <rect x="128" y="47" width="14" height="7" rx="2" fill="url(#handleGrad)" />
              </g>

              {/* B. STEEL CHEF'S KNIFE (Pointing up on the right) */}
              <g transform="translate(100, 35) rotate(15)">
                {/* Blade */}
                <path d="M15,50 L23,-15 C23,-15 25,20 18,50 Z" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="0.75" />
                <path d="M15,50 L23,-15 C23,-15 25,20 18,50 Z" fill="url(#chromeHighlight)" style={{ mixBlendMode: 'overlay' }} />
                {/* Handle Bolster */}
                <rect x="13" y="50" width="6" height="5" rx="1" fill="#475569" />
                {/* Handle */}
                <path d="M13,55 L11,92 C11,94 13,96 15,96 L18,96 C20,96 21,94 21,92 L19,55 Z" fill="url(#handleGrad)" stroke="#0f172a" strokeWidth="1" />
                {/* Rivets */}
                <circle cx="16" cy="65" r="1.5" fill="#cbd5e1" />
                <circle cx="16" cy="80" r="1.5" fill="#cbd5e1" />
              </g>

              {/* C. KITCHEN SPATULA (Left background element, pointing left-up) */}
              <g transform="translate(45, 65) rotate(-35)">
                {/* Slotted Spatula Head */}
                <path d="M-15,-20 L15,-20 C18,-20 20,-17 19,-14 L12,15 C11,18 8,20 5,20 L-5,20 C-8,20 -11,18 -12,15 L-19,-14 C-20,-17 -18,-20 -15,-20 Z" fill="url(#chromeGrad)" stroke="#475569" strokeWidth="1" />
                <path d="M-15,-20 L15,-20 C18,-20 20,-17 19,-14 L12,15 C11,18 8,20 5,20 L-5,20 C-8,20 -11,18 -12,15 L-19,-14 C-20,-17 -18,-20 -15,-20 Z" fill="url(#chromeHighlight)" style={{ mixBlendMode: 'overlay' }} />
                {/* Slots */}
                <rect x="-8" y="-12" width="3" height="22" rx="1.5" fill="#1e293b" opacity="0.8" />
                <rect x="-1.5" y="-12" width="3" height="22" rx="1.5" fill="#1e293b" opacity="0.8" />
                <rect x="5" y="-12" width="3" height="22" rx="1.5" fill="#1e293b" opacity="0.8" />
                {/* Handle Connection */}
                <path d="M0,20 L0,32" stroke="url(#chromeGrad)" strokeWidth="4.5" strokeLinecap="round" />
                {/* Handle Gripper */}
                <path d="M-2.5,30 L2.5,30 L4,75 C4,77 2,79 0,79 C-2,79 -4,77 -4,75 Z" fill="url(#handleGrad)" stroke="#0f172a" strokeWidth="1" />
              </g>

              {/* D. FORK (Sitting beside spatula) */}
              <g transform="translate(68, 65) rotate(-22)">
                <path d="M-6,-22 L6,-22 L5,2 C5,5 3,7 0,7 C-3,7 -5,5 -5,2 Z" fill="url(#chromeGrad)" stroke="#475569" strokeWidth="0.75" />
                {/* Fork Prongs (tines) slots */}
                <rect x="-3" y="-22" width="1.5" height="15" fill="#1e293b" />
                <rect x="1.5" y="-22" width="1.5" height="15" fill="#1e293b" />
                {/* Shaft */}
                <path d="M0,7 L0,30" stroke="url(#chromeGrad)" strokeWidth="3" />
                {/* Handle */}
                <path d="M-2,28 L2,28 L3,65 C3,67 1.5,68 0,68 C-1.5,68 -3,67 -3,65 Z" fill="url(#handleGrad)" stroke="#0f172a" strokeWidth="0.75" />
              </g>

              {/* E. POLISHED CHROME CLOCHE / FOOD DOME (The absolute centerpiece!) */}
              <g transform="translate(100, 95)">
                {/* Underplate */}
                <ellipse cx="0" cy="18" rx="55" ry="7" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="1" />
                <ellipse cx="0" cy="18" rx="55" ry="7" fill="url(#chromeHighlight)" style={{ mixBlendMode: 'overlay' }} />

                {/* Cloche Dome */}
                <path d="M-50,15 C-50,-25 50,-25 50,15 Z" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="1.25" />
                <path d="M-50,15 C-50,-25 50,-25 50,15 Z" fill="url(#chromeHighlight)" style={{ mixBlendMode: 'overlay' }} />
                
                {/* Dome Highlight Rim */}
                <path d="M-45,11 C-35,-15 35,-15 45,11" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.6" />

                {/* Handle / Knob on Top */}
                <circle cx="0" cy="-21" r="7" fill="url(#chromeGrad)" stroke="#334155" strokeWidth="1" />
                <path d="M-5,-15 C-5,-18 5,-18 5,-15 L4,-22 L-4,-22 Z" fill="url(#chromeGrad)" />
              </g>
            </svg>
          </div>

          {/* Layer 3: Interactive 3D Curved Banner and Text */}
          {!dimensions.textHidden && (
            <div 
              className="absolute bottom-0 inset-x-0 flex flex-col items-center justify-center pointer-events-none"
              style={{ transform: 'translateZ(45px)' }}
            >
              {/* Blue/White banner background */}
              <div className="relative px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 border border-blue-500/30 shadow-2xl flex flex-col items-center text-center">
                
                {/* Shiny gloss effect on the banner */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-xl pointer-events-none" />

                {/* Thai 3D Typography "อภิวัฒน์เครื่องครัว" */}
                <span 
                  className="font-bold text-white tracking-wide text-center block font-sans select-none"
                  style={{
                    fontSize: size === 'lg' ? '1.5rem' : '0.85rem',
                    lineHeight: '1.2',
                    textShadow: `
                      0 1px 0 #1d4ed8, 
                      0 2px 0 #1d4ed8, 
                      0 3px 0 #1d4ed8, 
                      0 4px 0 #1e40af,
                      0 5px 6px rgba(0, 0, 0, 0.6)
                    `,
                    WebkitTextStroke: '0.75px #ffffff',
                  }}
                >
                  อภิวัฒน์เครื่องครัว
                </span>

                {/* Subtitle "PREMIUM KITCHENWARE" */}
                <span 
                  className="text-[8px] md:text-[9.5px] font-black text-amber-400 tracking-widest uppercase mt-1 font-mono"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                  }}
                >
                  Premium Landmark
                </span>
              </div>
            </div>
          )}

          {/* Small text version for small sizes */}
          {dimensions.textHidden && (
            <div 
              className="absolute -bottom-1 text-[8px] bg-slate-950/80 text-white font-extrabold px-1 rounded-xs border border-amber-500/30 whitespace-nowrap"
              style={{ transform: 'translateZ(20px)' }}
            >
              อภิวัฒน์
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
