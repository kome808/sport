import { Mail, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-16 lg:py-20">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative">
                <div className="w-12 h-12 bg-[#c1ff00] flex items-center justify-center">
                  <span className="text-black font-black text-2xl">S</span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#c1ff00] animate-pulse"></div>
              </div>
              <span className="text-3xl font-black text-white tracking-tight">
                SPORT<span className="text-[#c1ff00]">REPO</span>
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed max-w-md mb-6">
              專為基層運動隊伍打造的訓練負荷與健康管理平台。用最簡單的方式，開始運動科學訓練。
            </p>
            <div className="inline-block px-4 py-2 bg-white/5 border border-[#c1ff00] text-[#c1ff00] font-black text-xs uppercase tracking-wider">
              用最簡單的方式，開始運動科學訓練
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-black mb-6 uppercase tracking-tight text-lg">聯絡我們</h3>
            <div className="space-y-4">
              <a 
                href="mailto:sportrepotw@gmail.com" 
                className="flex items-center gap-3 text-gray-400 hover:text-[#c1ff00] transition-colors group"
              >
                <div className="w-10 h-10 bg-white/5 group-hover:bg-[#c1ff00]/10 flex items-center justify-center transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="text-sm">sportrepotw@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Creator */}
          <div>
            <h3 className="text-white font-black mb-6 uppercase tracking-tight text-lg">開發設計</h3>
            <div className="space-y-3">
              <p className="text-gray-400 font-bold">胖虎</p>
              <a 
                href="https://www.threads.com/@panwhooo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[#c1ff00] hover:text-[#d4ff33] transition-colors group"
              >
                <span className="text-sm font-bold">@panwhooo</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wide">
              © 2026 SportRepo. All rights reserved.
            </p>
            <div className="flex gap-8">
              <a href="#" className="text-gray-500 hover:text-[#c1ff00] transition-colors text-sm font-bold uppercase tracking-wide">
                隱私權政策
              </a>
              <a href="#" className="text-gray-500 hover:text-[#c1ff00] transition-colors text-sm font-bold uppercase tracking-wide">
                服務條款
              </a>
            </div>
          </div>
        </div>

        {/* Checkered Pattern Accent */}
        <div className="absolute bottom-0 right-0 w-24 h-24 opacity-10">
          <div className="grid grid-cols-6 gap-1 w-full h-full">
            {[...Array(36)].map((_, i) => (
              <div key={i} className={`${i % 2 === 0 ? 'bg-[#c1ff00]' : 'bg-white'}`}></div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
