interface SkeletonProps {
  variant?: 'text' | 'card' | 'table' | 'page';
  lines?: number;
}

export default function Skeleton({ variant = 'page', lines = 4 }: SkeletonProps) {
  if (variant === 'card') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', padding: '2rem' }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '50px' }} />
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="skeleton" style={{ height: '40px', borderRadius: '12px', width: '60%' }} />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '12px' }} />
        ))}
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '16px', borderRadius: '8px', width: `${80 - i * 10}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', padding: '2rem' }}>
      <div className="skeleton" style={{ width: '300px', height: '40px', borderRadius: '20px' }} />
      <div className="skeleton" style={{ width: '200px', height: '20px', borderRadius: '10px' }} />
      <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '16px', borderRadius: '8px' }} />
        ))}
      </div>
    </div>
  );
}
