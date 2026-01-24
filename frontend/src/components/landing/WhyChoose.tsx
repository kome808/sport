import { Smartphone, Clock, Users, Shield } from "lucide-react";

export function WhyChoose() {
    const reasons = [
        {
            icon: Smartphone,
            title: "不需額外設備",
            description: "不需心率帶或 GPS，手機即可完成所有回報數據紀錄。",
        },
        {
            icon: Clock,
            title: "極低使用門檻",
            description: "每日僅需 1 分鐘，完全不影響選手原有的訓練節奏。",
        },
        {
            icon: Users,
            title: "專業教練核心",
            description: "功能精簡卻強力，直覺貼近教練實際的調度決策需求。",
        },
        {
            icon: Shield,
            title: "保護選手第一",
            description: "以預防傷病為最高目標，預防永遠比復健成本更低。",
        }
    ];

    return (
        <section id="about" className="py-20 lg:py-32 bg-zinc-950 relative overflow-hidden ring-1 ring-white/5">
            {/* Dynamic Accent */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#c1ff00]/5 to-transparent skew-y-3"></div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="text-center mb-24">
                    <div className="inline-block px-4 py-2 bg-[#c1ff00] text-black font-black uppercase text-xs tracking-wider mb-6">
                        Why Choose Us
                    </div>
                    <h2 className="text-4xl lg:text-7xl font-black text-white mb-6 tracking-tight uppercase">
                        為什麼選擇<br />
                        <span className="text-[#c1ff00]">SPORTREPO</span>？
                    </h2>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {reasons.map((reason, index) => {
                        const Icon = reason.icon;

                        return (
                            <div
                                key={index}
                                className="group relative bg-zinc-900 border-2 border-white/10 hover:border-[#c1ff00] p-10 transition-all duration-300 hover:-translate-y-3 shadow-2xl"
                            >
                                {/* Number */}
                                <div className="absolute -top-4 -right-4 w-12 h-12 bg-[#c1ff00] flex items-center justify-center shadow-lg">
                                    <span className="text-black font-black text-xl">{String(index + 1).padStart(2, '0')}</span>
                                </div>

                                {/* Icon */}
                                <div className="w-20 h-20 bg-[#c1ff00] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-xl">
                                    <Icon className="w-10 h-10 text-black" />
                                </div>

                                {/* Content */}
                                <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">
                                    {reason.title}
                                </h3>
                                <p className="text-gray-400 text-lg leading-relaxed font-bold">
                                    {reason.description}
                                </p>

                                {/* Hover Effect Line */}
                                <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#c1ff00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
