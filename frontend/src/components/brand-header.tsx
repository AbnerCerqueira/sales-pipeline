import { Handshake } from "lucide-react";

function BrandHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-950/50 ring-1 ring-orange-400/20">
        <Handshake className="text-white" size={22} strokeWidth={2.2} />
      </span>
      <h1 className="mt-4 font-bold text-2xl tracking-tight">
        <span className="text-white">Sales</span>
        <span className="text-orange-500">Pipeline</span>
      </h1>
      <p className="mt-1.5 text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

export default BrandHeader;
