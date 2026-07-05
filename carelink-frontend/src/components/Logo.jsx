export default function Logo({ size = 'md' }) {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' };
  return (
    <div className={`flex items-center gap-1 font-bold tracking-tight ${sizes[size]}`}>
      <span className="relative inline-flex h-7 w-7 items-center justify-center">
        <span className="absolute h-6 w-6 rounded-full border-[3px] border-brand-orange" />
        <span className="relative text-brand-orange text-xs font-black">+</span>
      </span>
      <span className="text-gray-900">
        <span className="text-brand-orange">C</span>ARELINK
      </span>
    </div>
  );
}
