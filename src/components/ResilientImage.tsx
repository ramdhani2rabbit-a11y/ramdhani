import { useState } from 'react';
import { Zap } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  fallbackTitle?: string;
  className?: string;
  containerClassName?: string;
}

export function ResilientImage({
  src,
  alt,
  fallbackTitle,
  className = 'w-full h-full object-cover',
  containerClassName = '',
}: ResilientImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-slate-300 p-6 text-center ${containerClassName}`}
      >
        <Zap className="w-8 h-8 text-amber-400 mb-3" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-200 max-w-xs">
          {fallbackTitle || alt}
        </p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
      loading="lazy"
    />
  );
}
