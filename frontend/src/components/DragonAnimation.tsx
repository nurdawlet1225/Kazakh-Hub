import React, { useEffect, useRef } from 'react';
import './DragonAnimation.css';

interface DragonAnimationProps {
  containerRef: React.RefObject<HTMLDivElement>;
  forceOrbit?: boolean; // Force dragon to orbit when login form is open
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const DragonAnimation: React.FC<DragonAnimationProps> = ({ containerRef, forceOrbit = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  const dragonHeadRef = useRef({ x: 0, y: 0 });
  const bodySegmentsRef = useRef<Array<{ x: number; y: number; angle: number }>>([]);
  const cursorTrailRef = useRef<Array<{ x: number; y: number; life: number }>>([]);
  const lastTrailPointRef = useRef({ x: 0, y: 0 });
  const idleRotationRef = useRef(0); // Rotation angle for idle animation
  const returnToCenterTimerRef = useRef<NodeJS.Timeout | null>(null);
  const shouldReturnToCenterRef = useRef(false);

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

    // Initialize dragon head position
    const segments = 25;
    dragonHeadRef.current = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
    targetRef.current = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
    lastTrailPointRef.current = { x: canvas.width * 0.5, y: canvas.height * 0.5 };
    
    // Initialize body segments
    bodySegmentsRef.current = [];
    for (let i = 0; i < segments; i++) {
      bodySegmentsRef.current.push({
        x: canvas.width * 0.5,
        y: canvas.height * 0.5,
        angle: 0
      });
    }
    
    // Initialize cursor trail
    cursorTrailRef.current = [];

    // Track mouse movement and create trail
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      
      targetRef.current = { x: newX, y: newY };
      
      // Add point to cursor trail
      const dx = newX - lastTrailPointRef.current.x;
      const dy = newY - lastTrailPointRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Add points along the path
      if (distance > 5) {
        const steps = Math.floor(distance / 5);
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          cursorTrailRef.current.push({
            x: lastTrailPointRef.current.x + dx * t,
            y: lastTrailPointRef.current.y + dy * t,
            life: 200 // Trail lifetime
          });
        }
        
        lastTrailPointRef.current = { x: newX, y: newY };
      }
      
      // Limit trail length
      if (cursorTrailRef.current.length > 100) {
        cursorTrailRef.current = cursorTrailRef.current.slice(-100);
      }
    };

    // Handle mouse leave - return dragon to center after 3 seconds
    const handleMouseLeave = () => {
      // Clear cursor trail when mouse leaves
      cursorTrailRef.current = [];
      
      // Clear any existing timer
      if (returnToCenterTimerRef.current) {
        clearTimeout(returnToCenterTimerRef.current);
      }
      
      // Set flag to return to center after 3 seconds
      returnToCenterTimerRef.current = setTimeout(() => {
        shouldReturnToCenterRef.current = true;
        const centerX = canvas.width * 0.5;
        const centerY = canvas.height * 0.5;
        targetRef.current = { x: centerX, y: centerY };
      }, 3000); // 3 seconds delay
    };
    
    // Handle mouse enter - cancel return to center
    const handleMouseEnter = () => {
      shouldReturnToCenterRef.current = false;
      if (returnToCenterTimerRef.current) {
        clearTimeout(returnToCenterTimerRef.current);
        returnToCenterTimerRef.current = null;
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('mouseenter', handleMouseEnter);

    // Initialize particles
    const initParticles = () => {
      particlesRef.current = [];
      for (let i = 0; i < 50; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          life: Math.random() * 100,
          maxLife: 100 + Math.random() * 100,
          size: Math.random() * 2 + 1
        });
      }
    };

    initParticles();

    // Draw dragon function
    const drawDragon = (ctx: CanvasRenderingContext2D, time: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const segments = bodySegmentsRef.current.length;
      const segmentLength = 18;
      
      // Update cursor trail - decrease life
      cursorTrailRef.current = cursorTrailRef.current
        .map(point => ({ ...point, life: point.life - 1 }))
        .filter(point => point.life > 0);
      
      // Head follows cursor trail directly, or orbits center like a sun galaxy if no trail
      const centerX = width * 0.5;
      const centerY = height * 0.5;
      let targetX = centerX;
      let targetY = centerY;
      let isReturningToCenter = false;
      let isIdleOrbit = false;
      
      // Force orbit when login form is open
      if (forceOrbit) {
        isIdleOrbit = true;
        isReturningToCenter = false;
        
        // Head stays at center (sun) - smooth movement to exact center
        const headDx = centerX - dragonHeadRef.current.x;
        const headDy = centerY - dragonHeadRef.current.y;
        const headDistance = Math.sqrt(headDx * headDx + headDy * headDy);
        
        if (headDistance > 2) {
          dragonHeadRef.current.x += headDx * 0.15; // Smooth centering
          dragonHeadRef.current.y += headDy * 0.15;
        } else {
          // Lock head to exact center when close
          dragonHeadRef.current.x = centerX;
          dragonHeadRef.current.y = centerY;
        }
        
        targetX = centerX;
        targetY = centerY;
        
        // Update rotation angle for orbiting body segments (smooth, consistent speed)
        idleRotationRef.current += 0.012; // Smooth rotation speed
      }
      // If there's a cursor trail, follow it
      else if (cursorTrailRef.current.length > 5) {
        // Take a point from the trail that's closer to the cursor (newer points)
        // Use a point that's about 10-20% from the end (closer to cursor)
        const trailIndex = Math.max(0, Math.floor(cursorTrailRef.current.length * 0.85));
        const trailPoint = cursorTrailRef.current[trailIndex];
        
        const dx = trailPoint.x - dragonHeadRef.current.x;
        const dy = trailPoint.y - dragonHeadRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Follow the trail point if it exists
        if (distance > 10) {
          targetX = trailPoint.x;
          targetY = trailPoint.y;
          isReturningToCenter = false;
          isIdleOrbit = false;
        } else {
          isReturningToCenter = true;
          isIdleOrbit = false;
        }
      } else {
        // No trail - check if we should return to center (after 3 seconds)
        const distanceToCenter = Math.sqrt(
          Math.pow(dragonHeadRef.current.x - centerX, 2) + 
          Math.pow(dragonHeadRef.current.y - centerY, 2)
        );
        
        if (shouldReturnToCenterRef.current) {
          // Timer triggered (3 seconds passed), return to center
          if (distanceToCenter < 20) {
            // Dragon head stays at center like a sun, body segments orbit around it
            isIdleOrbit = true;
            isReturningToCenter = false;
            
          // Head stays at center (sun) - smooth movement to exact center
          const headDx = centerX - dragonHeadRef.current.x;
          const headDy = centerY - dragonHeadRef.current.y;
          const headDistance = Math.sqrt(headDx * headDx + headDy * headDy);
          
          if (headDistance > 2) {
            dragonHeadRef.current.x += headDx * 0.15; // Smooth centering
            dragonHeadRef.current.y += headDy * 0.15;
          } else {
            // Lock head to exact center when close
            dragonHeadRef.current.x = centerX;
            dragonHeadRef.current.y = centerY;
          }
          
          targetX = centerX;
          targetY = centerY;
          
          // Update rotation angle for orbiting body segments (smooth, consistent speed)
          idleRotationRef.current += 0.012; // Smooth rotation speed
          } else {
            // Timer triggered, start moving to center smoothly
            targetX = centerX;
            targetY = centerY;
            isReturningToCenter = true;
            isIdleOrbit = false;
          }
        } else {
          // Timer not triggered yet (less than 3 seconds), stay in current position
          // Don't move to center yet - keep current target
          isReturningToCenter = false;
          isIdleOrbit = false;
        }
      }
      
      // Head follows trail point or cursor with realistic physics-based speed
      // Much slower speed when returning to center
      // Smooth speed when orbiting
      const baseHeadSpeed = isReturningToCenter ? 0.015 : (isIdleOrbit ? 0.05 : 0.06);
      const distanceToTarget = Math.sqrt(
        Math.pow(targetX - dragonHeadRef.current.x, 2) + 
        Math.pow(targetY - dragonHeadRef.current.y, 2)
      );
      
      // Stop moving if too close to target to prevent jittering
      const minDistance = 3; // Minimum distance threshold (reduced for smoother stop)
      if (distanceToTarget > minDistance) {
        // Realistic physics: acceleration when far, deceleration when close
        // Like real objects with inertia
        const maxSpeed = baseHeadSpeed * 2;
        const acceleration = Math.min(distanceToTarget / 150, 1); // Accelerate based on distance
        const adaptiveSpeed = baseHeadSpeed + (maxSpeed - baseHeadSpeed) * acceleration * 0.5;
        
        // Smooth easing for natural movement
        const easeFactor = Math.min(adaptiveSpeed, 0.15);
        
        dragonHeadRef.current.x += (targetX - dragonHeadRef.current.x) * easeFactor;
        dragonHeadRef.current.y += (targetY - dragonHeadRef.current.y) * easeFactor;
      }
      
      // Calculate head angle towards target
      const headAngle = Math.atan2(
        targetY - dragonHeadRef.current.y,
        targetX - dragonHeadRef.current.x
      );
      
      // Update body segments - each follows the previous one
      // Or orbit around head like planets around sun when idle
      let prevX = dragonHeadRef.current.x;
      let prevY = dragonHeadRef.current.y;
      let prevAngle = headAngle;
      
      if (isIdleOrbit) {
        // Body segments orbit around head like planets around sun (smooth, beautiful animation)
        for (let i = 0; i < segments; i++) {
          const segment = bodySegmentsRef.current[i];
          
          // Smooth circular orbits with varying radii and speeds
          const baseRadius = 45 + (i * 5); // Base orbit radius (closer together)
          const orbitSpeed = 0.8 + (i * 0.03); // Slightly different speeds for each segment
          const orbitOffset = (i * Math.PI * 0.35); // Different starting positions (spread out)
          
          // Calculate orbit angle
          const angle = idleRotationRef.current * orbitSpeed + orbitOffset;
          
          // Smooth circular orbit
          const orbitX = centerX + Math.cos(angle) * baseRadius;
          const orbitY = centerY + Math.sin(angle) * baseRadius;
          
          // Smooth movement to orbit position
          const dx = orbitX - segment.x;
          const dy = orbitY - segment.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Smooth, consistent speed for beautiful animation
          const orbitSpeedFactor = 0.2; // Consistent speed for smooth movement
          
          if (distance > 1) {
            segment.x += dx * orbitSpeedFactor;
            segment.y += dy * orbitSpeedFactor;
          } else {
            // Lock to orbit position when very close
            segment.x = orbitX;
            segment.y = orbitY;
          }
          
          // Calculate angle pointing towards center (head)
          segment.angle = Math.atan2(centerY - segment.y, centerX - segment.x) + Math.PI / 2;
          
          prevX = segment.x;
          prevY = segment.y;
          prevAngle = segment.angle;
        }
      } else {
        // Normal following behavior with realistic physics
        for (let i = 0; i < segments; i++) {
          const segment = bodySegmentsRef.current[i];
          
          // Calculate distance to previous segment (head or previous body segment)
          const dx = prevX - segment.x;
          const dy = prevY - segment.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Realistic following: segments maintain natural spacing
          const idealDistance = segmentLength;
          const distanceRatio = distance / idealDistance;
          
          // Adaptive speed: faster when stretched, slower when compressed
          const baseFollowSpeed = 0.12 + (i / segments) * 0.08; // Slower for tail segments
          const adaptiveSpeed = baseFollowSpeed * (0.8 + distanceRatio * 0.4); // Speed based on stretch
          
          // Move segment towards previous one with smooth physics
          if (distance > idealDistance * 0.8) { // Start moving before fully stretched
            const moveX = dx * adaptiveSpeed;
            const moveY = dy * adaptiveSpeed;
            segment.x += moveX;
            segment.y += moveY;
          }
          
          // Smooth angle update (like real snake movement)
          const targetAngle = Math.atan2(dy, dx);
          const angleDiff = targetAngle - segment.angle;
          // Normalize angle difference to [-PI, PI]
          const normalizedAngleDiff = ((angleDiff % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const shortestAngle = normalizedAngleDiff > Math.PI ? normalizedAngleDiff - Math.PI * 2 : normalizedAngleDiff;
          
          segment.angle += shortestAngle * 0.3; // Smooth angle interpolation
          
          prevX = segment.x;
          prevY = segment.y;
          prevAngle = segment.angle;
        }
      }
      
      // Build path array for drawing (head -> body -> tail)
      const path: Array<{ x: number; y: number; rotation: number }> = [];
      
      // Add head (first)
      path.push({
        x: dragonHeadRef.current.x,
        y: dragonHeadRef.current.y,
        rotation: headAngle
      });
      
      // Add body segments
      bodySegmentsRef.current.forEach((segment) => {
        path.push({
          x: segment.x,
          y: segment.y,
          rotation: segment.angle
        });
      });

      // Draw dragon body with glow
      // Reduce opacity and intensity when orbiting (idle mode)
      const colorOpacity = isIdleOrbit ? 0.4 : 1.0; // Reduce opacity when orbiting
      const glowOpacity = isIdleOrbit ? 0.15 : 0.3; // Reduce glow when orbiting
      
      ctx.save();
      
      // Outer glow
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        
        const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        gradient.addColorStop(0, `rgba(0, 255, 255, ${glowOpacity})`);
        gradient.addColorStop(1, `rgba(0, 200, 255, ${glowOpacity})`);
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = (60 + Math.sin(time + i) * 10) * (isIdleOrbit ? 0.7 : 1.0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      // Main body
      const bodyPath = new Path2D();
      bodyPath.moveTo(path[0].x, path[0].y);
      
      for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i + 1];
        const cp1x = p1.x + (p2.x - p1.x) * 0.5;
        const cp1y = p1.y + (p2.y - p1.y) * 0.5;
        bodyPath.quadraticCurveTo(cp1x, cp1y, p2.x, p2.y);
      }
      
      const bodyGradient = ctx.createLinearGradient(
        path[0].x, path[0].y,
        path[path.length - 1].x, path[path.length - 1].y
      );
      
      // Softer colors when orbiting
      if (isIdleOrbit) {
        bodyGradient.addColorStop(0, 'rgba(100, 150, 200, 0.6)'); // Softer cyan-blue
        bodyGradient.addColorStop(0.5, 'rgba(80, 130, 180, 0.6)');
        bodyGradient.addColorStop(1, 'rgba(60, 110, 160, 0.6)');
      } else {
        bodyGradient.addColorStop(0, '#00ffff');
        bodyGradient.addColorStop(0.5, '#00ccff');
        bodyGradient.addColorStop(1, '#0099ff');
      }
      
      // Draw main body stroke
      ctx.strokeStyle = bodyGradient;
      ctx.lineWidth = (25 + Math.sin(time) * 3) * (isIdleOrbit ? 0.8 : 1.0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(bodyPath);
      
      // Clear outline/stroke for better definition
      ctx.strokeStyle = isIdleOrbit ? 'rgba(0, 150, 200, 1)' : '#00ccff';
      ctx.lineWidth = (5 + Math.sin(time) * 0.5) * (isIdleOrbit ? 0.8 : 1.0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke(bodyPath);

      // Draw scales/segments (reduced when orbiting)
      if (!isIdleOrbit) { // Only draw scales when not orbiting to reduce blue color
        for (let i = 0; i < path.length - 1; i += 2) {
          const p = path[i];
          const nextP = path[Math.min(i + 1, path.length - 1)];
          const angle = Math.atan2(nextP.y - p.y, nextP.x - p.x);
          
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(angle);
          
          // Scale pattern
          const scaleGradient = ctx.createLinearGradient(-15, 0, 15, 0);
          scaleGradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
          scaleGradient.addColorStop(0.5, 'rgba(0, 200, 255, 1)');
          scaleGradient.addColorStop(1, 'rgba(0, 150, 255, 0.8)');
          
          ctx.fillStyle = scaleGradient;
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(15, 0);
          ctx.lineTo(0, 12);
          ctx.lineTo(-15, 0);
          ctx.closePath();
          ctx.fill();
          
          // Scale highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(8, 0);
          ctx.lineTo(0, 8);
          ctx.lineTo(-8, 0);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
        }
      }

      // Draw dragon head (at the beginning of path, following cursor)
      const head = path[0];
      
      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(headAngle);
      
      // Head glow (reduced when orbiting)
      const headGlowOpacity = isIdleOrbit ? 0.3 : 0.8;
      const headGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, 50);
      headGlow.addColorStop(0, `rgba(0, 255, 255, ${headGlowOpacity})`);
      headGlow.addColorStop(0.5, `rgba(0, 200, 255, ${headGlowOpacity * 0.5})`);
      headGlow.addColorStop(1, 'rgba(0, 150, 255, 0)');
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.fill();
      
      // Head shape (tribal style) - softer colors when orbiting
      if (isIdleOrbit) {
        ctx.fillStyle = 'rgba(100, 150, 200, 0.7)';
        ctx.strokeStyle = 'rgba(0, 150, 200, 1)'; // Clear outline
      } else {
        ctx.fillStyle = '#00ffff';
        ctx.strokeStyle = '#00ccff';
      }
      ctx.lineWidth = 5; // Thicker outline for better definition
      
      // Head outline
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(20, -15);
      ctx.lineTo(30, 0);
      ctx.lineTo(25, 15);
      ctx.lineTo(10, 20);
      ctx.lineTo(-10, 20);
      ctx.lineTo(-25, 15);
      ctx.lineTo(-30, 0);
      ctx.lineTo(-20, -15);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -5, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(-5, -5, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Spikes/mane
      for (let i = 0; i < 5; i++) {
        const spikeX = -20 + i * 10;
        const spikeY = -30 - Math.sin(i) * 5;
        ctx.beginPath();
        ctx.moveTo(spikeX, spikeY);
        ctx.lineTo(spikeX + 5, spikeY - 10);
        ctx.lineTo(spikeX + 10, spikeY);
        ctx.closePath();
        ctx.fill();
      }
      
      // Jaw/teeth
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 3; i++) {
        const toothX = -15 + i * 15;
        ctx.beginPath();
        ctx.moveTo(toothX, 20);
        ctx.lineTo(toothX + 3, 25);
        ctx.lineTo(toothX - 3, 25);
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();

      // Draw energy particles around dragon (reduced when orbiting)
      if (!isIdleOrbit) { // Hide particles when orbiting to reduce blue color
        for (let i = 0; i < path.length; i += 3) {
          const p = path[i];
          const angle = Math.random() * Math.PI * 2;
          const distance = 30 + Math.sin(time + i) * 20;
          const px = p.x + Math.cos(angle) * distance;
          const py = p.y + Math.sin(angle) * distance;
          
          const particleGradient = ctx.createRadialGradient(px, py, 0, px, py, 5);
          particleGradient.addColorStop(0, 'rgba(0, 255, 255, 1)');
          particleGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
          
          ctx.fillStyle = particleGradient;
          ctx.beginPath();
          ctx.arc(px, py, 3 + Math.sin(time + i) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    };

    // Draw background particles
    const drawParticles = (ctx: CanvasRenderingContext2D, time: number) => {
      particlesRef.current.forEach((particle, i) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life += 0.5;
        
        if (particle.life > particle.maxLife) {
          particle.life = 0;
          particle.x = Math.random() * canvas.width;
          particle.y = Math.random() * canvas.height;
        }
        
        const opacity = Math.sin((particle.life / particle.maxLife) * Math.PI) * 0.5;
        const size = particle.size * (0.5 + Math.sin(time + i) * 0.3);
        
        ctx.fillStyle = `rgba(0, 255, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      timeRef.current += 0.016; // ~60fps
      
      // Draw particles
      drawParticles(ctx, timeRef.current);
      
      // Draw dragon
      drawDragon(ctx, timeRef.current);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('mouseenter', handleMouseEnter);
      if (returnToCenterTimerRef.current) {
        clearTimeout(returnToCenterTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [containerRef, forceOrbit]);

  return (
    <canvas
      ref={canvasRef}
      className="dragon-animation"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 3
      }}
    />
  );
};

export default DragonAnimation;

