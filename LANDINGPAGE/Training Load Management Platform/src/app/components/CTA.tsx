import { Button } from "@/app/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 lg:py-32 bg-[#c1ff00] relative overflow-hidden">
      {/* Diagonal Background Patterns */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/10 to-transparent skew-y-[-3deg]"></div>
        
        {/* Checkered Pattern */}
        <div className="absolute top-10 right-10 w-32 h-32 opacity-20">
          <div className="grid grid-cols-8 gap-1 w-full h-full">
            {[...Array(64)].map((_, i) => (
              <div key={i} className={`${i % 2 === 0 ? 'bg-black' : 'bg-white'}`}></div>
            ))}
          </div>
        </div>
        
        <div className="absolute bottom-10 left-10 w-24 h-24 opacity-20">
          <div className="grid grid-cols-6 gap-1 w-full h-full">
            {[...Array(36)].map((_, i) => (
              <div key={i} className={`${i % 2 === 0 ? 'bg-black' : 'bg-white'}`}></div>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-10">
          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-black leading-none tracking-tight">
            SPORTREPO<br />
            用最簡單的方式<br />
            <span className="relative inline-block">
              一起保護選手的健康
              <div className="absolute -bottom-2 left-0 right-0 h-2 bg-black"></div>
            </span>
          </h2>
          
          <p className="text-xl lg:text-2xl text-black/80 font-bold max-w-2xl mx-auto">
            從今天開始，只要一支手機<br />就能讓訓練更安全、更有依據
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button 
              size="lg" 
              className="bg-black hover:bg-black/90 text-[#c1ff00] font-black text-lg px-12 py-8 uppercase tracking-wide group shadow-2xl"
              onClick={() => window.location.href = '/register'}
            >
              立即開始使用 SPORTREPO
              <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          </div>

          <div className="pt-8 flex items-center justify-center gap-8 text-black/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-black"></div>
              <span className="text-sm font-bold uppercase">完全免費試用</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-black"></div>
              <span className="text-sm font-bold uppercase">無需信用卡</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-black"></div>
              <span className="text-sm font-bold uppercase">隨時開始</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
