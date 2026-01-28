import { Link } from 'react-router-dom';
import { Mail, ExternalLink, Info } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

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

                            <Dialog>
                                <DialogTrigger asChild>
                                    <button className="flex items-center gap-4 text-gray-400 hover:text-[#c1ff00] transition-colors group w-full text-left">
                                        <div className="w-12 h-12 bg-white/5 group-hover:bg-[#c1ff00]/10 flex items-center justify-center transition-all">
                                            <Info className="w-6 h-6" />
                                        </div>
                                        <span className="text-base font-bold">關於本站</span>
                                    </button>
                                </DialogTrigger>
                                <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-4xl overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="text-[#c1ff00] font-black text-2xl uppercase tracking-tighter mb-4">
                                            關於 SPORT<span className="text-white">REPO</span>
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-6 text-gray-300 leading-relaxed text-lg">
                                        <p>
                                            台灣的基層運動一直面臨到專項運動訓練過度、運動傷害的問題。隨著運動科學觀念逐漸普及，越來越多人開始注意到如何更有效的進行訓練。
                                        </p>
                                        <p>
                                            而各種訓練的基礎在於能夠了解選手的身體負荷，然而大多數的運動隊伍都還是靠著感覺在訓練選手，而選手自己也不一定可以清楚理解表達，就經常遇到受傷的問題。
                                        </p>
                                        <p>
                                            而經費一直是基層運動隊伍最大的困擾，要持續追蹤監控訓練負荷除了引進運科設備外，有沒有什麼方式可以更簡單不需要負責設備就可以做到。
                                        </p>
                                        <p>
                                            因為這樣的念頭，加上自己也是棒球科班球員的家長，平常也關注基層運動，就開始著手發展這樣的系統。
                                        </p>
                                        <p>
                                            自己在軟體業工作擔任UX企劃經理，透過AI協助蒐集分析國內外文獻有哪些方法可以做到快速方便的評估方式。
                                        </p>
                                        <p>
                                            然後開始規劃這個平台的功能，再透過vibe coding逐步打造出SportRepo平台。
                                        </p>
                                        <p className="border-t border-white/5 pt-6 font-bold text-white">
                                            本平台提供運動隊伍教練、家長使用，累積數據開始運動科學第一步，更希望我們的選手能夠減少運動傷害機率，喜歡也享受運動！
                                        </p>
                                    </div>
                                </DialogContent>
                            </Dialog>
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
