import React, { useEffect, useRef, useState } from 'react';
import './CursorTrail.css';

interface Particle {
  x: number;
  y: number;
  size: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  color: string;
}

interface CursorTrailProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  particleCount?: number;
  particleSize?: number;
  trailLength?: number;
  colors?: string[];
}

const CursorTrail: React.FC<CursorTrailProps> = ({
  containerRef,
  particleCount = 20,
  particleSize = 4,
  trailLength = 30,
  colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444']
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const animationFrameRef = useRef<number>();
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef?.current || canvas.parentElement;
    if (!container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: mousePosRef.current.x || canvas.width / 2,
          y: mousePosRef.current.y || canvas.height / 2,
          size: particleSize + Math.random() * particleSize,
          life: 0,
          maxLife: trailLength + Math.random() * trailLength,
          vx: 0,
          vy: 0,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    initParticles();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isHovering) {
        const mouse = mousePosRef.current;
        
        particlesRef.current.forEach((particle, index) => {
          // Calculate target position (trail effect)
          const targetX = mouse.x;
          const targetY = mouse.y;
          
          // Add some offset for trailing effect
          const offsetX = (Math.sin(index * 0.5) * 20) * (1 - particle.life / particle.maxLife);
          const offsetY = (Math.cos(index * 0.5) * 20) * (1 - particle.life / particle.maxLife);
          
          // Smooth movement towards target
          const dx = targetX + offsetX - particle.x;
          const dy = targetY + offsetY - particle.y;
          
          particle.vx += dx * 0.05;
          particle.vy += dy * 0.05;
          
          // Apply friction
          particle.vx *= 0.85;
          particle.vy *= 0.85;
          
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;
          
          // Update life
          particle.life += 0.5;
          
          // Reset particle if it's too old
          if (particle.life >= particle.maxLife) {
            particle.x = targetX;
            particle.y = targetY;
            particle.life = 0;
            particle.vx = 0;
            particle.vy = 0;
            particle.color = colors[Math.floor(Math.random() * colors.length)];
          }
          
          // Draw particle with gradient
          const alpha = 1 - (particle.life / particle.maxLife);
          const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
          );
          gradient.addColorStop(0, particle.color);
          gradient.addColorStop(0.5, particle.color + '80');
          gradient.addColorStop(1, particle.color + '00');
          
          ctx.globalAlpha = alpha * 0.8;
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // Fade out particles when not hovering
        particlesRef.current.forEach((particle) => {
          particle.life += 2;
          if (particle.life < particle.maxLife) {
            const alpha = 1 - (particle.life / particle.maxLife);
            const gradient = ctx.createRadialGradient(
              particle.x, particle.y, 0,
              particle.x, particle.y, particle.size
            );
            gradient.addColorStop(0, particle.color);
            gradient.addColorStop(0.5, particle.color + '80');
            gradient.addColorStop(1, particle.color + '00');
            
            ctx.globalAlpha = alpha * 0.5;
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      ctx.globalAlpha = 1;
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [containerRef, particleCount, particleSize, trailLength, colors, isHovering]);

  return (
    <canvas
      ref={canvasRef}
      className="cursor-trail-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0
      }}
    />
  );
};

export default CursorTrail;

