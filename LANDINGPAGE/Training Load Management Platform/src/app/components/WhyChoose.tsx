import { Smartphone, Clock, Users, Shield } from "lucide-react";

export function WhyChoose() {
  const reasons = [
    {
      icon: Smartphone,
      title: "不需任何硬體設備",
      description: "手機即可完成每日回報",
    },
    {
      icon: Clock,
      title: "極低使用門檻",
      description: "每日 1 分鐘，不影響訓練節奏",
    },
    {
      icon: Users,
      title: "專為基層設計",
      description: "貼近教練實際決策需求",
    },
    {
      icon: Shield,
      title: "以保護選手為核心",
      description: "預防永遠比復健更重要",
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-zinc-950 relative overflow-hidden">
      {/* Diagonal Accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-[#c1ff00]/5 to-transparent skew-y-3"></div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-[#c1ff00] text-black font-black uppercase text-xs tracking-wider mb-6">
            Why Choose Us
          </div>
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight">
            為什麼選擇<br />
            <span className="text-[#c1ff00]">SPORTREPO</span>？
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;

            return (
              <div 
                key={index}
                className="group relative bg-zinc-900 border-2 border-white/10 hover:border-[#c1ff00] p-8 transition-all duration-300 hover:-translate-y-2"
              >
                {/* Number */}
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-[#c1ff00] flex items-center justify-center">
                  <span className="text-black font-black text-lg">{String(index + 1).padStart(2, '0')}</span>
                </div>

                {/* Icon */}
                <div className="w-16 h-16 bg-[#c1ff00] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Icon className="w-8 h-8 text-black" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">
                  {reason.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {reason.description}
                </p>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#c1ff00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
