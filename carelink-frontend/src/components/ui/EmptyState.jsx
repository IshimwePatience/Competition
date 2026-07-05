import emptyMascot from '../../images/empty_mascot.png';

export default function EmptyState({ message = 'No items found', compact = false, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6' : 'py-16'} ${className}`}>
      <img
        src={emptyMascot}
        alt=""
        className={compact ? 'mb-2 h-16 w-auto object-contain' : 'mb-4 h-32 w-auto object-contain'}
      />
      <p className={`max-w-sm text-gray-400 ${compact ? 'text-xs' : 'text-[14px]'}`}>{message}</p>
    </div>
  );
}
