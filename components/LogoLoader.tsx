'use client';

import { motion } from 'framer-motion';
import { useBranding } from '@/hooks/useBranding';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';

interface LogoLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showSpinner?: boolean;
}

export function LogoLoader({ size = 'md', className = '', showSpinner = false }: LogoLoaderProps) {
  const { logo_url, company_name } = useBranding();

  const dimensions = {
    sm: { width: 40, height: 40 },
    md: { width: 64, height: 64 },
    lg: { width: 96, height: 96 },
    xl: { width: 140, height: 140 },
    '2xl': { width: 180, height: 180 },
  };

  const { width, height } = dimensions[size as keyof typeof dimensions] || dimensions.md;

  if (!logo_url) {
    // Return an empty container with the same size to avoid layout shift
    return <div className={`flex flex-col items-center justify-center ${className}`} style={{ width, height }} />;
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-6 mx-auto ${className}`}>
      <div
        className="relative"
        style={{ width, height }}
      >
        <Image
          src={logo_url}
          alt={`${company_name} Logo`}
          fill
          className="object-contain"
          unoptimized
          referrerPolicy="no-referrer"
        />
      </div>
      
      {showSpinner && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3"
        >
          <Loader2 className="w-5 h-5 animate-spin text-cyan-500/80" />
          <span className="text-cyan-500/80 font-bold tracking-widest text-sm uppercase">
            Carregando
          </span>
        </motion.div>
      )}
    </div>
  );
}
