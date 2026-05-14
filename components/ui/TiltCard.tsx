'use client';

import React from 'react';
import Tilt from 'react-parallax-tilt';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  tiltMaxAngleX?: number;
  tiltMaxAngleY?: number;
  scale?: number;
  transitionSpeed?: number;
  glareEnable?: boolean;
}

export function TiltCard({
  children,
  className = "w-full h-full",
  onClick,
  tiltMaxAngleX = 5,
  tiltMaxAngleY = 5,
  scale = 1.02,
  transitionSpeed = 2000,
  glareEnable = false
}: TiltCardProps) {
  return (
    <Tilt
      tiltMaxAngleX={tiltMaxAngleX}
      tiltMaxAngleY={tiltMaxAngleY}
      scale={scale}
      transitionSpeed={transitionSpeed}
      glareEnable={glareEnable}
      glareMaxOpacity={0.15}
      glareColor="#ffffff"
      glarePosition="all"
      className={className}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div onClick={onClick} className="w-full h-full" style={{ transform: 'translateZ(20px)' }}>
        {children}
      </div>
    </Tilt>
  );
}
