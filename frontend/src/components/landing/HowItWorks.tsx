import { UserPlus, ClipboardList, BarChart3 } from "lucide-react";

export function HowItWorks() {
    const steps = [
        {
            number: "01",
            icon: UserPlus,
            title: "快速建隊",
            description: "教練建立隊伍 → 發送邀請碼 → 選手加入即可開始使用。",
        },
        {
            number: "02",
            icon: ClipboardList,
            title: "每日回報",
            description: "選手每日花 1分鐘回報狀態，系統自動整理分析。",
        },
        {
            number: "03",
            icon: BarChart3,
            title: "即時決策",
            description: "教練儀表板以 紅・黃・綠燈 呈現全隊狀況，訓練調整不再只靠感覺。",
        }
    ];

    return (
        <section id="how-it-works" className="py-20 lg:py-32 bg-zinc-950 relative overflow-hidden ring-1 ring-white/5">
            {/* Diagonal Background */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-[#c1ff00]/10 to-transparent skew-y-[-3deg] -translate-y-1/4"></div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="text-center mb-20">
                    <div className="inline-block px-4 py-2 bg-[#c1ff00] text-black font-black uppercase text-xs tracking-wider mb-6">
                        How It Works
                    </div>
                    <h2 className="text-4xl lg:text-7xl font-black text-white mb-6 tracking-tight uppercase">
                        系統<span className="text-[#c1ff00]">運作流程</span>
                    </h2>
                    <p className="text-xl lg:text-2xl text-gray-400 font-bold">三個簡單步驟，立即開始數位轉型</p>
                </div>

                <div className="grid md:grid-cols-3 gap-12 relative">
                    {/* Connection Line */}
                    <div className="hidden md:block absolute top-16 left-0 right-0 h-1.5 bg-zinc-800">
                        <div className="h-full bg-gradient-to-r from-[#c1ff00] to-transparent w-full"></div>
                    </div>

                    {steps.map((step, index) => {
                        const Icon = step.icon;

                        return (
                            <div key={index} className="relative group">
                                {/* Card */}
                                <div className="bg-zinc-900 border-2 border-white/10 group-hover:border-[#c1ff00] p-10 h-full transition-all duration-300 group-hover:-translate-y-4 shadow-2xl relative z-20">
                                    {/* Number Badge */}
                                    <div className="w-24 h-24 bg-black border-4 border-[#c1ff00] flex items-center justify-center mb-8 relative z-10 mx-auto group-hover:scale-110 transition-transform">
                                        <span className="text-4xl font-black text-[#c1ff00]">{step.number}</span>
                                    </div>

                                    {/* Icon */}
                                    <div className="w-16 h-16 bg-[#c1ff00] flex items-center justify-center mb-8 mx-auto shadow-lg">
                                        <Icon className="w-8 h-8 text-black" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-2xl lg:text-3xl font-black text-white mb-6 uppercase tracking-tight text-center">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-400 text-lg leading-relaxed text-center font-bold">
                                        {step.description}
                                    </p>

                                    {/* Checkered Corner Accent */}
                                    <div className="absolute top-0 right-0 w-16 h-16 opacity-30">
                                        <div className="grid grid-cols-4 gap-1 w-full h-full">
                                            {[...Array(16)].map((_, i) => (
                                                <div key={i} className={`${i % 2 === 0 ? 'bg-[#c1ff00]' : 'bg-white'}`}></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
