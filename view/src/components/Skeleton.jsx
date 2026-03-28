export function EmpresaCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 animate-pulse">
      <div className="h-24 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded-full w-3/4" />
        <div className="h-2 bg-gray-100 rounded-full w-1/2" />
      </div>
    </div>
  );
}

export function ItemCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-gray-100 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded-full w-1/2" />
        <div className="h-2 bg-gray-100 rounded-full w-3/4" />
        <div className="h-3 bg-gray-200 rounded-full w-1/4" />
      </div>
      <div className="w-16 h-16 bg-gray-200 rounded-xl flex-shrink-0" />
    </div>
  );
}
