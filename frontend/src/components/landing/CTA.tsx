import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTA() {
    return (
        <section className="py-24 lg:py-40 bg-[#c1ff00] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/20 to-transparent skew-y-[-3deg]"></div>

                {/* Checkered Patterns */}
                <div className="absolute top-10 right-10 w-48 h-48 opacity-20">
                    <div className="grid grid-cols-6 gap-1 w-full h-full">
                        {[...Array(36)].map((_, i) => (
                            <div key={i} className={`${i % 2 === 0 ? 'bg-black' : 'bg-white'}`}></div>
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-10 left-10 w-32 h-32 opacity-20">
                    <div className="grid grid-cols-4 gap-1 w-full h-full">
                        {[...Array(16)].map((_, i) => (
                            <div key={i} className={`${i % 2 === 0 ? 'bg-black' : 'bg-white'}`}></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 relative z-10">
                <div className="max-w-5xl mx-auto text-center space-y-12">
                    <h2 className="text-5xl sm:text-7xl lg:text-9xl font-black text-black leading-none tracking-tight uppercase">
                        SPORTREPO<br />
                        <span className="relative inline-block">
                            守護選手健康
                            <div className="absolute -bottom-2 lg:-bottom-4 left-0 right-0 h-3 lg:h-6 bg-black"></div>
                        </span>
                    </h2>

                    <p className="text-2xl lg:text-4xl text-black font-black max-w-3xl mx-auto leading-tight italic">
                        從今天開始，只要一支手機<br />就能讓團隊訓練邁向科學化管理
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center pt-10">
                        <Link to="/register">
                            <Button
                                size="lg"
                                className="w-full sm:w-auto bg-black hover:bg-zinc-800 text-[#c1ff00] font-black text-2xl px-16 py-10 uppercase tracking-widest shadow-[0_20px_50px_rgba(0,0,0,0.3)] group transition-all active:scale-95"
                            >
                                立即建立隊伍
                                <ArrowRight className="ml-4 w-8 h-8 group-hover:translate-x-3 transition-transform" />
                            </Button>
                        </Link>
                    </div>

                    <div className="pt-12 flex flex-wrap items-center justify-center gap-10 text-black/80">
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-black rounded-full"></div>
                            <span className="text-lg font-black uppercase tracking-wider">完全免費體驗</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-black rounded-full"></div>
                            <span className="text-lg font-black uppercase tracking-wider">零設備門檻</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 bg-black rounded-full"></div>
                            <span className="text-lg font-black uppercase tracking-wider">數據驅動成長</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
