import { Link } from 'react-router-dom';
import { Mail, ExternalLink } from "lucide-react";

export function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 py-20 lg:py-24 relative overflow-hidden">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="relative">
                                <div className="w-14 h-14 bg-[#c1ff00] flex items-center justify-center shadow-lg">
                                    <span className="text-black font-black text-3xl">S</span>
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#c1ff00] animate-pulse"></div>
                            </div>
                            <span className="text-4xl font-black text-white tracking-tight uppercase">
                                SPORT<span className="text-[#c1ff00]">REPO</span>
                            </span>
                        </div>
                        <p className="text-gray-400 text-lg leading-relaxed max-w-md mb-8 font-bold">
                            專為基層運動隊伍打造的訓練負荷與健康管理平台。用最簡單的方式，開始運動科學訓練。
                        </p>
                        <div className="inline-block px-4 py-2 bg-white/5 border border-[#c1ff00] text-[#c1ff00] font-black text-xs uppercase tracking-widest shadow-inner">
                            START YOUR SCIENCE BASED TRAINING TODAY
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-white font-black mb-8 uppercase tracking-widest text-xl">聯絡我們</h3>
                        <div className="space-y-6">
                            <a
                                href="mailto:sportrepotw@gmail.com"
                                className="flex items-center gap-4 text-gray-400 hover:text-[#c1ff00] transition-colors group"
                            >
                                <div className="w-12 h-12 bg-white/5 group-hover:bg-[#c1ff00]/10 flex items-center justify-center transition-all">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <span className="text-base font-bold">sportrepotw@gmail.com</span>
                            </a>
                        </div>
                    </div>

                    {/* Creator */}
                    <div>
                        <h3 className="text-white font-black mb-8 uppercase tracking-widest text-xl">開發設計</h3>
                        <div className="space-y-4">
                            <p className="text-gray-400 text-lg font-black uppercase tracking-tight">KOME (胖虎)</p>
                            <a
                                href="https://www.threads.net/@panwhooo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-[#c1ff00] hover:text-[#d4ff33] transition-colors group"
                            >
                                <span className="text-base font-black uppercase tracking-widest underline underline-offset-4">@PANWHOOO</span>
                                <ExternalLink className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-white/10 pt-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <p className="text-gray-600 text-sm font-black uppercase tracking-widest">
                            © 2026 SportRepo. Powered by Advanced Sports Science.
                        </p>
                        <div className="flex gap-12">
                            <Link to="#" className="text-gray-600 hover:text-[#c1ff00] transition-colors text-sm font-black uppercase tracking-widest">
                                Privacy Policy
                            </Link>
                            <Link to="#" className="text-gray-600 hover:text-[#c1ff00] transition-colors text-sm font-black uppercase tracking-widest">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Decorative Grid */}
                <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5 translate-x-1/2 translate-y-1/2">
                    <div className="grid grid-cols-4 gap-2 w-full h-full">
                        {[...Array(16)].map((_, i) => (
                            <div key={i} className="bg-[#c1ff00]"></div>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
