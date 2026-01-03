import React, { useEffect, useRef } from 'react';
import './DragonCursorTrail.css';

interface DragonCursorTrailProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

interface TrailParticle {
  x: number;
  y: number;
  z: number; // 3D depth
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  vz: number; // 3D velocity
  rotation: number;
  rotationX: number; // 3D rotation
  rotationY: number;
}

const DragonCursorTrail: React.FC<DragonCursorTrailProps> = ({ containerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<TrailParticle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, z: 0 });
  const lastMouseRef = useRef({ x: 0, y: 0, z: 0 });
  const animationFrameRef = useRef<number>();
  
  // 3D perspective settings
  const FOV = 1000; // Field of view

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
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      
      // Calculate 3D position based on mouse position (z varies with position)
      const normalizedX = (newX / rect.width) * 2 - 1; // -1 to 1
      const normalizedY = (newY / rect.height) * 2 - 1; // -1 to 1
      const newZ = Math.sin(normalizedX * Math.PI) * Math.cos(normalizedY * Math.PI) * 200;

      // Calculate velocity
      const dx = newX - lastMouseRef.current.x;
      const dy = newY - lastMouseRef.current.y;
      const dz = newZ - lastMouseRef.current.z;
      const distance = Math.sqrt(dx * dx + dy * dy);

      mouseRef.current = { x: newX, y: newY, z: newZ };

      // Create particles along the trail
      if (distance > 0) {
        const particleCount = Math.min(Math.floor(distance / 2), 10); // Уменьшено в 2 раза
        for (let i = 0; i < particleCount; i++) {
          const t = i / particleCount;
          const x = lastMouseRef.current.x + dx * t;
          const y = lastMouseRef.current.y + dy * t;
          const z = lastMouseRef.current.z + dz * t + (Math.random() - 0.5) * 100;

          // Create dragon scale-like particles with 3D
          const angle = Math.atan2(dy, dx);
          const speed = distance * 0.1;

          particlesRef.current.push({
            x,
            y,
            z,
            size: Math.random() * 8 + 4,
            opacity: 1,
            life: 0,
            maxLife: 60 + Math.random() * 40, // Уменьшено в 2 раза (было 120-200, стало 60-100)
            vx: Math.cos(angle) * speed * 0.3 + (Math.random() - 0.5) * 2,
            vy: Math.sin(angle) * speed * 0.3 + (Math.random() - 0.5) * 2,
            vz: (Math.random() - 0.5) * 3,
            rotation: angle + Math.PI / 2,
            rotationX: Math.random() * Math.PI * 2,
            rotationY: Math.random() * Math.PI * 2
          });
        }
      }

      lastMouseRef.current = { x: newX, y: newY, z: newZ };
    };

    container.addEventListener('mousemove', handleMouseMove);

    // 3D projection function
    const project3D = (x: number, y: number, z: number) => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const scale = FOV / (FOV + z);
      const projectedX = (x - centerX) * scale + centerX;
      const projectedY = (y - centerY) * scale + centerY;
      return { x: projectedX, y: projectedY, scale };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.life++;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        particle.vz *= 0.95;
        particle.opacity = 1 - (particle.life / particle.maxLife);
        particle.rotation += 0.1;
        particle.rotationX += 0.05;
        particle.rotationY += 0.05;

        if (particle.life >= particle.maxLife || particle.z < -FOV) {
          return false;
        }

        // Project 3D to 2D
        const projected = project3D(particle.x, particle.y, particle.z);
        const scale = projected.scale;
        const scaledSize = particle.size * scale;

        // Skip if too small or behind camera
        if (scaledSize < 0.5 || scale < 0) {
          return true;
        }

        // Draw dragon scale shape with 3D effect
        ctx.save();
        ctx.translate(projected.x, projected.y);
        ctx.rotate(particle.rotation);
        ctx.scale(scale, scale);

        // Dragon scale gradient with depth-based color
        const depthFactor = Math.max(0, Math.min(1, (particle.z + FOV) / (FOV * 2)));
        const gradient = ctx.createLinearGradient(
          -particle.size / 2, 0,
          particle.size / 2, 0
        );
        
        // Red dragon colors (brighter when closer)
        const hue = 0 + (particle.life / particle.maxLife) * 5; // 0-5 (pure red spectrum)
        const brightness = 50 + depthFactor * 20; // Brighter when closer
        gradient.addColorStop(0, `hsla(${hue}, 100%, ${brightness}%, ${particle.opacity * 0.8})`);
        gradient.addColorStop(0.5, `hsla(${hue + 2}, 100%, ${brightness + 5}%, ${particle.opacity * 0.9})`);
        gradient.addColorStop(1, `hsla(${hue + 4}, 100%, ${brightness + 10}%, ${particle.opacity * 0.7})`);

        ctx.fillStyle = gradient;
        ctx.strokeStyle = `hsla(${hue}, 100%, ${brightness - 10}%, ${particle.opacity * 0.5})`;
        ctx.lineWidth = 1 / scale;

        // Draw 3D dragon scale shape (diamond/scale-like with depth)
        const depthOffset = Math.sin(particle.rotationX) * particle.size * 0.2;
        
        ctx.beginPath();
        ctx.moveTo(0, -particle.size / 2 + depthOffset);
        ctx.lineTo(particle.size / 2, depthOffset);
        ctx.lineTo(0, particle.size / 2 + depthOffset);
        ctx.lineTo(-particle.size / 2, depthOffset);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Add 3D shadow
        const shadowGradient = ctx.createRadialGradient(
          0, depthOffset + particle.size / 2, 0,
          0, depthOffset + particle.size / 2, particle.size
        );
        shadowGradient.addColorStop(0, `hsla(0, 0%, 0%, ${particle.opacity * 0.3})`);
        shadowGradient.addColorStop(1, `hsla(0, 0%, 0%, 0)`);
        ctx.fillStyle = shadowGradient;
        ctx.beginPath();
        ctx.ellipse(0, depthOffset + particle.size / 2, particle.size * 0.8, particle.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect with 3D depth
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, particle.size * 1.5);
        glowGradient.addColorStop(0, `hsla(${hue}, 100%, ${brightness}%, ${particle.opacity * 0.3 * scale})`);
        glowGradient.addColorStop(1, `hsla(${hue}, 100%, ${brightness}%, 0)`);
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, particle.size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        return true;
      });

      // Sort particles by z-depth for proper rendering
      particlesRef.current.sort((a, b) => b.z - a.z);

      // Draw main cursor glow (dragon head effect) with 3D
      if (mouseRef.current.x > 0 && mouseRef.current.y > 0) {
        const cursorProjected = project3D(mouseRef.current.x, mouseRef.current.y, mouseRef.current.z);
        const cursorScale = cursorProjected.scale;
        const glowSize = 30 * cursorScale;
        
        // 3D glow effect - red
        const mainGradient = ctx.createRadialGradient(
          cursorProjected.x, cursorProjected.y, 0,
          cursorProjected.x, cursorProjected.y, glowSize
        );
        mainGradient.addColorStop(0, `hsla(0, 100%, 70%, ${0.6 * cursorScale})`);
        mainGradient.addColorStop(0.5, `hsla(0, 100%, 65%, ${0.3 * cursorScale})`);
        mainGradient.addColorStop(1, 'hsla(0, 100%, 60%, 0)');

        ctx.fillStyle = mainGradient;
        ctx.beginPath();
        ctx.arc(cursorProjected.x, cursorProjected.y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // Draw 3D dragon eye effect
        ctx.save();
        ctx.translate(cursorProjected.x, cursorProjected.y);
        ctx.scale(cursorScale, cursorScale);
        
        // Outer eye glow - red
        const eyeGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 8);
        eyeGlow.addColorStop(0, 'hsla(0, 100%, 60%, 0.8)');
        eyeGlow.addColorStop(1, 'hsla(0, 100%, 50%, 0)');
        ctx.fillStyle = eyeGlow;
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner eye - red
        ctx.fillStyle = 'hsla(0, 100%, 50%, 0.9)';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eye highlight
        ctx.fillStyle = 'hsla(0, 100%, 90%, 0.8)';
        ctx.beginPath();
        ctx.arc(-1, -1, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }

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
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="dragon-cursor-trail"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  );
};

export default DragonCursorTrail;

