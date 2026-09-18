function BrandHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="text-center">
      <h1 className="font-bold text-3xl tracking-tight">
        Sales<span className="text-orange-500">Pipeline</span>
      </h1>
      <p className="mt-2 text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

export default BrandHeader;
