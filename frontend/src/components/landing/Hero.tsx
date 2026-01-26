import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Zap, Shield, TrendingUp, PlayCircle } from "lucide-react";

interface HeroProps {
    heroImage: string;
}

export function Hero({ heroImage }: HeroProps) {
    return (
        <section className="relative pt-16 lg:pt-20 pb-12 lg:pb-16 bg-black overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
                <img
                    src={heroImage}
                    alt="運動選手訓練"
                    className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-transparent"></div>

                {/* Diagonal Accent */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-[#c1ff00]/10 to-transparent skew-x-[-12deg] translate-x-1/4"></div>
            </div>

            {/* Checkered Pattern Accent */}
            <div className="absolute top-40 right-20 w-20 h-20 opacity-30">
                <div className="grid grid-cols-4 gap-1 w-full h-full">
                    {[...Array(16)].map((_, i) => (
                        <div key={i} className={`${i % 2 === 0 ? 'bg-[#c1ff00]' : 'bg-white'}`}></div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="max-w-4xl">
                    {/* Small Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#c1ff00] text-black font-black uppercase text-xs tracking-wider mb-8">
                        <Zap className="w-4 h-4" />
                        <span>最簡單的運動科學訓練</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-none mb-6 tracking-tight uppercase">
                        <span className="text-[#c1ff00]">訓練負荷</span>
                        <br />
                        管理平台
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed mb-8 max-w-2xl font-bold">
                        一支手機・每日 <span className="text-[#c1ff00] font-black">1 分鐘</span>回報・掌握選手身體負荷數據
                    </p>

                    {/* Key Benefits Grid */}
                    <div className="grid sm:grid-cols-3 gap-4 mb-12">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-[#c1ff00] flex items-center justify-center flex-shrink-0 mt-1">
                                <Shield className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <div className="text-white font-black text-lg">預防傷害</div>
                                <div className="text-sm text-gray-400 font-bold uppercase">運動傷害風險監控</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-[#c1ff00] flex items-center justify-center flex-shrink-0 mt-1">
                                <TrendingUp className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <div className="text-white font-black text-lg">數據輔助</div>
                                <div className="text-sm text-gray-400 font-bold uppercase">訓練調整科學決策</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-[#c1ff00] flex items-center justify-center flex-shrink-0 mt-1">
                                <Zap className="w-5 h-5 text-black" />
                            </div>
                            <div>
                                <div className="text-white font-black text-lg">零硬體</div>
                                <div className="text-sm text-gray-400 font-bold uppercase">無需昂貴設備成本</div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="text-white font-black text-lg mb-2 sm:mb-0 sm:mr-4 flex items-center uppercase tracking-widest">
                            系統展示：
                        </div>
                        <Link to="/login?demo=coach" className="sm:w-auto" target="_blank" rel="noopener noreferrer">
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto border-2 border-[#c1ff00] text-[#c1ff00] hover:bg-[#c1ff00] hover:text-black font-black text-xl px-12 py-8 uppercase tracking-widest transition-all"
                            >
                                <PlayCircle className="mr-3 w-6 h-6" />
                                教練端
                            </Button>
                        </Link>
                        <Link to="/shohoku-basketball/p/3ss/login" className="sm:w-auto" target="_blank" rel="noopener noreferrer">
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto border-2 border-[#c1ff00] text-[#c1ff00] hover:bg-[#c1ff00] hover:text-black font-black text-xl px-12 py-8 uppercase tracking-widest transition-all"
                            >
                                選手端
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
