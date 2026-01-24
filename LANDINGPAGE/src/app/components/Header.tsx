import { Button } from "@/app/components/ui/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-[#c1ff00] rounded flex items-center justify-center">
                <span className="text-black font-black text-xl">S</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#c1ff00] rounded-full animate-pulse"></div>
            </div>
            <span className="text-2xl font-black text-white tracking-tight">
              SPORT<span className="text-[#c1ff00]">REPO</span>
              <span className="text-xs ml-1 text-gray-400 align-super">BETA</span>
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-3 lg:gap-4">
            <Button 
              variant="ghost" 
              className="text-white hover:text-[#c1ff00] hover:bg-white/5 font-bold uppercase tracking-wide"
              onClick={() => window.location.href = '/login'}
            >
              登入
            </Button>
            <Button 
              className="bg-[#c1ff00] hover:bg-[#d4ff33] text-black font-black uppercase tracking-wide px-6"
              onClick={() => window.location.href = '/register'}
            >
              建立隊伍
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}