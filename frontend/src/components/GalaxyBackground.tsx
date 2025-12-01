import React, { useEffect, useRef } from 'react';
import './GalaxyBackground.css';

interface Star {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  opacity: number;
  twinkle: number;
  twinkleSpeed: number;
}

interface GalaxyBackgroundProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  starCount?: number;
  speed?: number;
}

const GalaxyBackground: React.FC<GalaxyBackgroundProps> = ({
  containerRef,
  starCount = 200,
  speed = 0.5
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationFrameRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

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

    // Initialize stars
    const initStars = () => {
      starsRef.current = [];
      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          opacity: Math.random() * 0.8 + 0.2,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: Math.random() * 0.02 + 0.01
        });
      }
    };

    initStars();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    container.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw galaxy gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.3,
        canvas.height * 0.4,
        0,
        canvas.width * 0.3,
        canvas.height * 0.4,
        Math.max(canvas.width, canvas.height) * 0.8
      );
      gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
      gradient.addColorStop(0.3, 'rgba(139, 92, 246, 0.2)');
      gradient.addColorStop(0.6, 'rgba(168, 85, 247, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw additional galaxy spirals
      const spiralGradient1 = ctx.createRadialGradient(
        canvas.width * 0.2,
        canvas.height * 0.3,
        0,
        canvas.width * 0.2,
        canvas.height * 0.3,
        Math.max(canvas.width, canvas.height) * 0.6
      );
      spiralGradient1.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
      spiralGradient1.addColorStop(0.5, 'rgba(139, 92, 246, 0.15)');
      spiralGradient1.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spiralGradient1;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const spiralGradient2 = ctx.createRadialGradient(
        canvas.width * 0.7,
        canvas.height * 0.6,
        0,
        canvas.width * 0.7,
        canvas.height * 0.6,
        Math.max(canvas.width, canvas.height) * 0.5
      );
      spiralGradient2.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
      spiralGradient2.addColorStop(0.5, 'rgba(59, 130, 246, 0.1)');
      spiralGradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spiralGradient2;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      starsRef.current.forEach((star) => {
        // Update position
        star.x += star.vx;
        star.y += star.vy;

        // Wrap around edges
        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        // Update twinkle
        star.twinkle += star.twinkleSpeed;
        const twinkleOpacity = (Math.sin(star.twinkle) + 1) / 2;

        // Mouse interaction - stars move away from cursor
        const dx = star.x - mouseRef.current.x;
        const dy = star.y - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 150;

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          star.x += Math.cos(angle) * force * 2;
          star.y += Math.sin(angle) * force * 2;
        }

        // Draw star with glow effect
        const finalOpacity = star.opacity * (0.5 + twinkleOpacity * 0.5);
        
        // Outer glow
        const glowGradient = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.radius * 3
        );
        glowGradient.addColorStop(0, `rgba(255, 255, 255, ${finalOpacity * 0.3})`);
        glowGradient.addColorStop(0.5, `rgba(255, 255, 255, ${finalOpacity * 0.1})`);
        glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        ctx.fill();

        // Star core
        ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw some bright stars (larger)
      const brightStars = starsRef.current.filter((_, i) => i % 10 === 0);
      brightStars.forEach((star) => {
        const twinkleOpacity = (Math.sin(star.twinkle) + 1) / 2;
        const finalOpacity = star.opacity * (0.7 + twinkleOpacity * 0.3);
        
        // Bright star glow
        const brightGlow = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.radius * 5
        );
        brightGlow.addColorStop(0, `rgba(147, 197, 253, ${finalOpacity * 0.4})`);
        brightGlow.addColorStop(0.3, `rgba(147, 197, 253, ${finalOpacity * 0.2})`);
        brightGlow.addColorStop(1, 'rgba(147, 197, 253, 0)');
        
        ctx.fillStyle = brightGlow;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [containerRef, starCount, speed]);

  return (
    <canvas
      ref={canvasRef}
      className="galaxy-background-canvas"
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

export default GalaxyBackground;

