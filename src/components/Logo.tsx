import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className, variant = 'default', size = 'md' }: LogoProps) {
  const textColor = variant === 'light' ? 'text-white' : 'text-[#1a1a1a]';
  const subTextColor = variant === 'light' ? 'text-[rgba(255,255,255,0.7)]' : 'text-[#737373]';
  
  const sizeClasses = {
    sm: { title: 'text-lg', subtitle: 'text-[6px] tracking-[0.2em]' },
    md: { title: 'text-2xl', subtitle: 'text-[8px] tracking-[0.3em]' },
    lg: { title: 'text-3xl', subtitle: 'text-[10px] tracking-[0.3em]' },
    xl: { title: 'text-4xl', subtitle: 'text-xs tracking-[0.4em]' },
  };

  return (
    <div className={cn("flex flex-col items-center select-none", className)}>
      <h1 className={cn("font-serif font-bold tracking-widest leading-none", textColor, sizeClasses[size].title)}>
        ELITTE
      </h1>
      <span className={cn("uppercase font-sans font-medium mt-1", subTextColor, sizeClasses[size].subtitle)}>
        Capital · Private
      </span>
    </div>
  );
}
