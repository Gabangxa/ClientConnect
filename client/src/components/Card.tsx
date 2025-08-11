/**
 * Card.tsx — small reusable card with creative styling
 * - Accepts optional 'title' and children content
 * - Uses glassmorphism + subtle shadow and interactive hover lift
 */

export default function Card({
  title,
  children,
  className = "",
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`glass rounded-xl2 soft-shadow p-5 transform transition-transform hover:-translate-y-1 ${className}`}
    >
      {title && (
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}