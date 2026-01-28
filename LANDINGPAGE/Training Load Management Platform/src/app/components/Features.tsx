import { Smartphone, Target, TrendingUp, ArrowRight } from "lucide-react";

interface FeaturesProps {
  images: {
    feature1: string;
    feature2: string;
    feature3: string;
  };
}

export function Features({ images }: FeaturesProps) {
  const features = [
    {
      icon: Smartphone,
      title: "訓練負荷監控",
      subtitle: "零硬體成本",
      tag: "LOAD MONITORING",
      description: "透過球員自主回報，簡單容易執行",
      details: [
        "晨間心跳（RHR）",
        "身心狀態量表（Wellness）",
        "主觀訓練強度（RPE）",
        "系統自動計算與趨勢分析"
      ],
      value: "教練掌握所有選手身體負荷狀況調整訓練，減少受傷風險，開始運科訓練的第一步。",
      image: images.feature1,
    },
    {
      icon: Target,
      title: "視覺化傷痛回報",
      subtitle: "溝通零時差",
      tag: "INJURY REPORT",
      description: "哪裡不舒服，一眼就懂",
      details: [
        "直覺式人體圖像點選",
        "可回報疼痛、受傷、生病等狀態",
        "即時通知教練團隊",
        "完整記錄傷痛歷史"
      ],
      value: "教練即時掌握全隊健康狀況，避免帶傷訓練與風險累積。",
      image: images.feature2,
    },
    {
      icon: TrendingUp,
      title: "訓練歷史與成長紀錄",
      subtitle: "努力看得見",
      tag: "GROWTH TRACKING",
      description: "數據，會說故事",
      details: [
        "自動累積個人與團隊訓練紀錄",
        "視覺化趨勢圖表",
        "長期成長追蹤",
        "可分享給家長與選手"
      ],
      value: "教練用來調整訓練，家長用來理解孩子，建立透明、長期的信任關係。",
      image: images.feature3,
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-black">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-2 bg-[#c1ff00] text-black font-black uppercase text-xs tracking-wider mb-6">
            Core Features
          </div>
          <h2 className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight">
            <span className="text-[#c1ff00]">核心功能</span>模組
          </h2>
        </div>

        <div className="space-y-32">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isEven = index % 2 === 0;

            return (
              <div 
                key={index}
                className={`grid lg:grid-cols-2 gap-12 items-center ${!isEven ? 'lg:grid-flow-dense' : ''}`}
              >
                {/* Image Section */}
                <div className={`relative ${!isEven ? 'lg:col-start-2' : ''}`}>
                  <div className="relative overflow-hidden group">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-[500px] object-cover brightness-75 group-hover:brightness-100 group-hover:scale-105 transition-all duration-500"
                    />
                    
                    {/* Overlay Tag */}
                    <div className="absolute top-8 left-8 px-4 py-2 bg-[#c1ff00] text-black font-black text-sm tracking-wider">
                      {feature.tag}
                    </div>
                    
                    {/* Checkered Corner */}
                    <div className="absolute bottom-0 right-0 w-20 h-20">
                      <div className="grid grid-cols-5 gap-1 w-full h-full">
                        {[...Array(25)].map((_, i) => (
                          <div key={i} className={`${i % 2 === 0 ? 'bg-[#c1ff00]' : 'bg-white'}`}></div>
                        ))}
                      </div>
                    </div>

                    {/* Diagonal Accent */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#c1ff00]/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </div>
                </div>

                {/* Content Section */}
                <div className={`space-y-6 ${!isEven ? 'lg:col-start-1 lg:row-start-1' : ''}`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-[#c1ff00] flex items-center justify-center">
                      <Icon className="w-8 h-8 text-black" />
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#c1ff00] to-transparent"></div>
                  </div>

                  <div>
                    <div className="text-[#c1ff00] font-black text-sm uppercase tracking-wider mb-2">
                      {feature.subtitle}
                    </div>
                    <h3 className="text-3xl lg:text-5xl font-black text-white mb-4 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-xl text-gray-300 mb-8">
                      {feature.description}
                    </p>
                  </div>

                  {/* Details List */}
                  <div className="space-y-3">
                    {feature.details.map((detail, idx) => (
                      <div key={idx} className="flex items-center gap-3 group/item">
                        <div className="w-6 h-6 bg-white/10 group-hover/item:bg-[#c1ff00] flex items-center justify-center transition-colors">
                          <ArrowRight className="w-4 h-4 text-[#c1ff00] group-hover/item:text-black transition-colors" />
                        </div>
                        <span className="text-gray-300 group-hover/item:text-white transition-colors">{detail}</span>
                      </div>
                    ))}
                  </div>

                  {/* Value Statement */}
                  <div className="mt-8 p-6 bg-zinc-900 border-l-4 border-[#c1ff00]">
                    <div className="text-xs text-[#c1ff00] font-black uppercase tracking-wider mb-2">Value</div>
                    <p className="text-gray-300 leading-relaxed">
                      {feature.value}
                    </p>
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