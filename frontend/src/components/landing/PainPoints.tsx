import { AlertTriangle, Heart, Settings } from "lucide-react";

export function PainPoints() {
    const painPoints = [
        {
            number: "01",
            icon: AlertTriangle,
            title: "教練的困境",
            description: "選手常說「還可以」、「沒問題」，但實際的疲勞與風險，往往在受傷後才被發現。",
        },
        {
            number: "02",
            icon: Heart,
            title: "家長的不安",
            description: "孩子每天高強度訓練，缺乏一個能理解身體負荷與訓練狀況的管道。",
        },
        {
            number: "03",
            icon: Settings,
            title: "導入門檻過高",
            description: "多數訓練監控需要穿戴式裝置，對基層隊伍而言是難以負擔的成本。",
        }
    ];

    return (
        <section className="py-20 lg:py-32 bg-zinc-950 relative overflow-hidden ring-1 ring-white/5">
            {/* Background Diagonal */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#c1ff00]/5 to-transparent"></div>

            {/* Checkered Pattern */}
            <div className="absolute bottom-0 left-0 w-32 h-32 opacity-10">
                <div className="grid grid-cols-8 gap-1 w-full h-full">
                    {[...Array(64)].map((_, i) => (
                        <div key={i} className={`${i % 2 === 0 ? 'bg-[#c1ff00]' : 'bg-white'}`}></div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-block px-4 py-2 bg-[#c1ff00] text-black font-black uppercase text-xs tracking-wider mb-6">
                        Pain Points
                    </div>
                    <h2 className="text-4xl lg:text-7xl font-black text-white mb-6 tracking-tight uppercase">
                        基層運動隊伍<br />
                        <span className="text-[#c1ff00]">最常遇到的</span>現實困境
                    </h2>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {painPoints.map((point, index) => {
                        const Icon = point.icon;

                        return (
                            <div
                                key={index}
                                className="group relative bg-zinc-900 border-2 border-white/10 hover:border-[#c1ff00] p-10 transition-all duration-300 hover:-translate-y-2 shadow-2xl"
                            >
                                {/* Number Badge */}
                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#c1ff00] flex items-center justify-center shadow-lg">
                                    <span className="text-black font-black text-2xl">{point.number}</span>
                                </div>

                                {/* Icon */}
                                <div className="w-16 h-16 bg-white/5 group-hover:bg-[#c1ff00]/10 flex items-center justify-center mb-8 transition-colors">
                                    <Icon className="w-10 h-10 text-[#c1ff00]" />
                                </div>

                                {/* Content */}
                                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">
                                    {point.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed font-bold">
                                    {point.description}
                                </p>

                                {/* Accent Line */}
                                <div className="absolute bottom-0 left-0 w-0 h-1.5 bg-[#c1ff00] group-hover:w-full transition-all duration-500"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
