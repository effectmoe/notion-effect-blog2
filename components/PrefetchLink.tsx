import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  prefetchOnHover?: boolean;
}

export const PrefetchLink: React.FC<PrefetchLinkProps> = ({
  href,
  children,
  className,
  prefetchOnHover = true,
}) => {
  const router = useRouter();
  const prefetchTimeoutRef = useRef<NodeJS.Timeout>();
  const hasPrefetchedRef = useRef(false);

  const handleMouseEnter = () => {
    if (prefetchOnHover && !hasPrefetchedRef.current) {
      // 100ms待ってからプリフェッチ（誤ホバーを防ぐ）
      prefetchTimeoutRef.current = setTimeout(() => {
        router.prefetch(href);
        hasPrefetchedRef.current = true;
      }, 100);
    }
  };

  const handleMouseLeave = () => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Link
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Link>
  );
};