import { Trophy } from "lucide-react";

interface WhoItsForProps {
  images: {
    sports1: string;
  };
}

export function WhoItsFor({ images }: WhoItsForProps) {
  return (
    <section className="py-20 lg:py-32 bg-black relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute bottom-0 right-0 w-1/3 h-2/3 bg-gradient-to-tl from-[#c1ff00]/10 to-transparent"></div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-[#c1ff00] text-black font-black uppercase text-xs tracking-wider mb-6">
            Who It's For
          </div>
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight">
            <span className="text-[#c1ff00]">適用</span>對象
          </h2>
          <p className="text-xl text-gray-400">為基層運動隊伍量身打造</p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Single Card */}
          <div className="group relative bg-zinc-900 border-2 border-white/10 hover:border-[#c1ff00] overflow-hidden transition-all duration-300">
            {/* Image */}
            <div className="relative h-80 overflow-hidden">
              <img 
                src={images.sports1} 
                alt="各類基層運動隊伍"
                className="w-full h-full object-cover brightness-75 group-hover:scale-110 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
              
              {/* Tag */}
              <div className="absolute top-6 left-6 px-4 py-2 bg-[#c1ff00] text-black font-black text-xs tracking-wider">
                ALL SPORTS
              </div>

              {/* Icon Badge */}
              <div className="absolute bottom-6 left-6 w-16 h-16 bg-[#c1ff00] flex items-center justify-center">
                <Trophy className="w-8 h-8 text-black" />
              </div>
            </div>

            {/* Content */}
            <div className="p-8 lg:p-12">
              <h3 className="text-3xl lg:text-4xl font-black text-white mb-6 uppercase tracking-tight">
                各類基層運動隊伍
              </h3>
              <p className="text-gray-400 text-lg leading-relaxed">
                適用於各種運動隊伍，協助教練在有限資源下，仍能提供科學訓練最基本的入門。減少運動傷害才能提升運動表現，延長選手運動生涯。
              </p>
            </div>

            {/* Checkered Accent */}
            <div className="absolute bottom-0 right-0 w-16 h-16 opacity-20">
              <div className="grid grid-cols-4 gap-1 w-full h-full">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className={`${i % 2 === 0 ? 'bg-[#c1ff00]' : 'bg-white'}`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}