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
                    <h2 className="text-4xl lg:text-7xl font-black text-white mb-6 tracking-tight uppercase">
                        <span className="text-[#c1ff00]">適用</span>對象
                    </h2>
                    <p className="text-xl lg:text-2xl text-gray-400 font-bold">為各種不同環境的基層隊伍量身打造</p>
                </div>

                <div className="max-w-5xl mx-auto">
                    {/* Single Card */}
                    <div className="group relative bg-zinc-900 border-2 border-white/10 hover:border-[#c1ff00] overflow-hidden transition-all duration-300 shadow-2xl">
                        {/* Image */}
                        <div className="relative h-96 lg:h-[500px] overflow-hidden">
                            <img
                                src={images.sports1}
                                alt="各類基層運動隊伍"
                                className="w-full h-full object-cover brightness-50 group-hover:brightness-75 group-hover:scale-105 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

                            {/* Tag */}
                            <div className="absolute top-8 left-8 px-6 py-2 bg-[#c1ff00] text-black font-black text-sm tracking-widest uppercase shadow-lg">
                                ALL SPORTS INVOLVED
                            </div>

                            {/* Icon Badge */}
                            <div className="absolute bottom-8 left-8 w-20 h-20 bg-[#c1ff00] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                <Trophy className="w-10 h-10 text-black" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-10 lg:p-16">
                            <h3 className="text-3xl lg:text-5xl font-black text-white mb-8 uppercase tracking-tight">
                                各類基層運動隊伍
                            </h3>
                            <p className="text-gray-300 text-xl lg:text-2xl leading-relaxed font-bold">
                                適用於各種球類與專項運動隊伍，協助教練在有限經費預算下，仍能提供科學化訓練最核心的入門模組。
                                <span className="text-[#c1ff00]"> 唯有減少不必要的運動傷害，才能穩定提升訓練表現</span>，延長選手寶貴的運動生涯。
                            </p>
                        </div>

                        {/* Checkered Accent */}
                        <div className="absolute bottom-0 right-0 w-24 h-24 opacity-20">
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
