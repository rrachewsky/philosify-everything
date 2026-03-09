// Skeleton - Base skeleton loading component with shimmer animation
import './Skeleton.css';

export function Skeleton({
  width = '100%',
  height = '16px',
  borderRadius = '4px',
  className = '',
}) {
  return <div className={`skeleton ${className}`} style={{ width, height, borderRadius }} />;
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="14px" width={i === lines - 1 && lines > 1 ? '70%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonCircle({ size = '40px', className = '' }) {
  return <Skeleton width={size} height={size} borderRadius="50%" className={className} />;
}

export default Skeleton;
