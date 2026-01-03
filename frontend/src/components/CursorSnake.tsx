import React, { useEffect, useRef } from 'react';
import './CursorSnake.css';

interface Point {
  x: number;
  y: number;
}

interface CursorSnakeProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

const CursorSnake: React.FC<CursorSnakeProps> = ({ containerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const trailRef = useRef<Point[]>([]);
  const targetRef = useRef<Point>({ x: 0, y: 0 });
  const currentRef = useRef<Point>({ x: 0, y: 0 });
  const isMouseInsideRef = useRef<boolean>(false);
  const animationTimeRef = useRef<number>(0);

  const SEGMENT_COUNT = 50;
  const SEGMENT_DISTANCE = 30;
  const HEAD_SIZE = 24;
  const BODY_SIZE = 16;
  const SPEED = 0.15;
  const CENTER_SPEED = 0.05;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = containerRef?.current;
    if (!container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      // Initialize trail at center if empty
      if (trailRef.current.length === 0) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        currentRef.current = { x: centerX, y: centerY };
        targetRef.current = { x: centerX, y: centerY };
        trailRef.current = Array(SEGMENT_COUNT).fill(null).map(() => ({ x: centerX, y: centerY }));
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if mouse is inside container bounds
      const isInside = (
        x >= 0 && x <= rect.width &&
        y >= 0 && y <= rect.height &&
        e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top && e.clientY <= rect.bottom
      );

      isMouseInsideRef.current = isInside;

      if (isInside) {
        targetRef.current = { x, y };
      } else {
        // Move to center when outside
        targetRef.current = {
          x: rect.width / 2,
          y: rect.height / 2
        };
      }
    };

    const handleMouseLeave = () => {
      isMouseInsideRef.current = false;
      const rect = container.getBoundingClientRect();
      targetRef.current = {
        x: rect.width / 2,
        y: rect.height / 2
      };
    };

    // Also listen to mouseleave on window to catch when cursor leaves screen
    const handleWindowMouseLeave = () => {
      isMouseInsideRef.current = false;
      const rect = container.getBoundingClientRect();
      targetRef.current = {
        x: rect.width / 2,
        y: rect.height / 2
      };
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseout', handleWindowMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update animation time
      animationTimeRef.current += 0.05;

      // Update current position towards target
      const speed = isMouseInsideRef.current ? SPEED : CENTER_SPEED;
      const dx = targetRef.current.x - currentRef.current.x;
      const dy = targetRef.current.y - currentRef.current.y;
      
      currentRef.current.x += dx * speed;
      currentRef.current.y += dy * speed;
      
      // Keep head within screen bounds
      const margin = HEAD_SIZE + 5;
      currentRef.current.x = Math.max(margin, Math.min(canvas.width - margin, currentRef.current.x));
      currentRef.current.y = Math.max(margin, Math.min(canvas.height - margin, currentRef.current.y));

      // Update trail
      trailRef.current.unshift({ ...currentRef.current });
      
      // Keep segments at proper distance
      for (let i = 1; i < trailRef.current.length; i++) {
        const prev = trailRef.current[i - 1];
        const curr = trailRef.current[i];
        
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > SEGMENT_DISTANCE) {
          const angle = Math.atan2(dy, dx);
          curr.x = prev.x + Math.cos(angle) * SEGMENT_DISTANCE;
          curr.y = prev.y + Math.sin(angle) * SEGMENT_DISTANCE;
        }
      }

      // Keep trail length consistent
      if (trailRef.current.length > SEGMENT_COUNT) {
        trailRef.current.pop();
      }

      // Draw snake body with 3D effect
      trailRef.current.forEach((point, index) => {
        if (index === 0) {
          // Calculate movement direction angle
          let angle = 0;
          if (trailRef.current.length > 1) {
            const next = trailRef.current[1];
            angle = Math.atan2(next.y - point.y, next.x - point.x);
          } else {
            // If no next point, use current movement direction
            const dx = targetRef.current.x - currentRef.current.x;
            const dy = targetRef.current.y - currentRef.current.y;
            if (dx !== 0 || dy !== 0) {
              angle = Math.atan2(dy, dx);
            }
          }
          
          // Save context for rotation
          ctx.save();
          ctx.translate(point.x, point.y);
          ctx.rotate(angle);
          
          // Draw shadow (rotated)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(2, 2, HEAD_SIZE * 0.9, HEAD_SIZE * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Calculate light position relative to rotated head
          const lightAngle = Math.PI / 4;
          const lightX = Math.cos(lightAngle) * HEAD_SIZE * 0.5;
          const lightY = Math.sin(lightAngle) * HEAD_SIZE * 0.5;
          
          // Draw 3D head sphere (rotated to face direction)
          const gradient = ctx.createRadialGradient(
            lightX, lightY, 0,
            0, 0, HEAD_SIZE
          );
          gradient.addColorStop(0, 'rgba(255, 230, 50, 1)'); // Bright highlight
          gradient.addColorStop(0.3, 'rgba(250, 204, 21, 0.95)');
          gradient.addColorStop(0.6, 'rgba(234, 179, 8, 0.8)');
          gradient.addColorStop(0.8, 'rgba(202, 138, 4, 0.6)');
          gradient.addColorStop(1, 'rgba(161, 98, 7, 0.3)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(0, 0, HEAD_SIZE, HEAD_SIZE * 0.85, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw head outline with depth
          ctx.strokeStyle = 'rgba(202, 138, 4, 0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, HEAD_SIZE, HEAD_SIZE * 0.85, 0, 0, Math.PI * 2);
          ctx.stroke();
          
          // Draw highlight on top
          const highlightGradient = ctx.createRadialGradient(
            lightX, lightY, 0,
            lightX, lightY, HEAD_SIZE * 0.6
          );
          highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
          highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = highlightGradient;
          ctx.beginPath();
          ctx.ellipse(0, 0, HEAD_SIZE * 0.7, HEAD_SIZE * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw eyes with 3D effect (facing forward, looking at screen)
          const eyeOffset = 8;
          const eyeSpacing = 5;
          const eye1X = -eyeOffset;
          const eye1Y = eyeSpacing;
          const eye2X = -eyeOffset;
          const eye2Y = -eyeSpacing;
          const eyeSize = 5;

          // Eye sockets (shadows)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
          ctx.beginPath();
          ctx.ellipse(eye1X + 0.5, eye1Y + 0.5, eyeSize + 1, eyeSize + 0.5, 0, 0, Math.PI * 2);
          ctx.ellipse(eye2X + 0.5, eye2Y + 0.5, eyeSize + 1, eyeSize + 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Eye whites
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.beginPath();
          ctx.ellipse(eye1X, eye1Y, eyeSize, eyeSize * 0.8, 0, 0, Math.PI * 2);
          ctx.ellipse(eye2X, eye2Y, eyeSize, eyeSize * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Eye outline
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(eye1X, eye1Y, eyeSize, eyeSize * 0.8, 0, 0, Math.PI * 2);
          ctx.ellipse(eye2X, eye2Y, eyeSize, eyeSize * 0.8, 0, 0, Math.PI * 2);
          ctx.stroke();
          
          // Eye pupils (looking forward at screen)
          ctx.fillStyle = 'rgba(0, 0, 0, 1)';
          ctx.beginPath();
          ctx.arc(eye1X, eye1Y, 2.5, 0, Math.PI * 2);
          ctx.arc(eye2X, eye2Y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Eye highlights (shiny effect)
          ctx.fillStyle = 'rgba(255, 255, 255, 1)';
          ctx.beginPath();
          ctx.arc(eye1X - 0.8, eye1Y - 0.8, 1.2, 0, Math.PI * 2);
          ctx.arc(eye2X - 0.8, eye2Y - 0.8, 1.2, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw mouth (smile)
          const mouthY = 8;
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(-eyeOffset + 2, mouthY, 4, 0, Math.PI);
          ctx.stroke();
          
          // Draw nose/nostrils
          const nostrilY = 2;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.beginPath();
          ctx.arc(-eyeOffset + 1, nostrilY, 1, 0, Math.PI * 2);
          ctx.arc(-eyeOffset + 3, nostrilY, 1, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw cheeks (optional, for cuteness)
          ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
          ctx.beginPath();
          ctx.arc(eyeSpacing, eye1Y, 3, 0, Math.PI * 2);
          ctx.arc(eyeSpacing, eye2Y, 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Restore context
          ctx.restore();
        } else {
          // Draw body segment with 3D effect and animation
          const progress = index / trailRef.current.length;
          const baseSize = BODY_SIZE * (1 - progress * 0.5);
          
          // Add wave animation to body segments
          const waveOffset = Math.sin(animationTimeRef.current * 2 + index * 0.3) * 2;
          const pulseSize = 1 + Math.sin(animationTimeRef.current * 3 + index * 0.4) * 0.15;
          const size = baseSize * pulseSize;
          
          // Add slight position offset for wave effect
          const waveX = point.x + Math.sin(animationTimeRef.current * 2 + index * 0.3) * 1.5;
          const waveY = point.y + Math.cos(animationTimeRef.current * 2 + index * 0.3) * 1.5;
          
          const opacity = 0.9 * (1 - progress * 0.5);
          
          // Calculate light position for this segment
          const lightAngle = Math.PI / 4;
          const lightX = waveX + Math.cos(lightAngle) * size * 0.5;
          const lightY = waveY + Math.sin(lightAngle) * size * 0.5;
          
          // Draw shadow with animation
          ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.2})`;
          ctx.beginPath();
          ctx.ellipse(waveX + 2, waveY + 2, size * 0.9, size * 0.6, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw 3D body sphere with animated size
          const gradient = ctx.createRadialGradient(
            lightX, lightY, 0,
            waveX, waveY, size
          );
          gradient.addColorStop(0, `rgba(255, 230, 50, ${opacity * 0.8})`);
          gradient.addColorStop(0.3, `rgba(250, 204, 21, ${opacity})`);
          gradient.addColorStop(0.6, `rgba(234, 179, 8, ${opacity * 0.8})`);
          gradient.addColorStop(0.8, `rgba(202, 138, 4, ${opacity * 0.6})`);
          gradient.addColorStop(1, `rgba(161, 98, 7, ${opacity * 0.2})`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(waveX, waveY, size, size * 0.85, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw highlight with animation
          const highlightGradient = ctx.createRadialGradient(
            lightX, lightY, 0,
            lightX, lightY, size * 0.5
          );
          highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.4})`);
          highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
          ctx.fillStyle = highlightGradient;
          ctx.beginPath();
          ctx.ellipse(waveX, waveY, size * 0.6, size * 0.4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw connections between segments
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      trailRef.current.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mouseout', handleWindowMouseLeave);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="cursor-snake-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    />
  );
};

export default CursorSnake;

