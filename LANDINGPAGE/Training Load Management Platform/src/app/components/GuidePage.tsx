import { motion } from "motion/react";
import { ArrowLeft, Activity, Heart, Brain, Zap, BookOpen, AlertCircle, TrendingUp, TrendingDown, ClipboardCheck, Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback.tsx";

interface GuidePageProps {
  onBack: () => void;
  images: {
    acwr: string;
    rhr: string;
    wellness: string;
    srpe: string;
  };
}

export function GuidePage({ onBack, images }: GuidePageProps) {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20 font-sans">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-12 text-[#c1ff00] hover:text-[#c1ff00] hover:bg-white/5 group pl-0 text-base font-bold"
          >
            <ArrowLeft className="mr-2 w-6 h-6 transition-transform group-hover:-translate-x-1" />
            返回首頁
          </Button>

          <header className="mb-24 text-center max-w-4xl mx-auto">
            <h1 className="text-5xl lg:text-7xl font-black mb-8 leading-tight tracking-tight">
              讀懂身體的訊號<br />
              <span className="text-[#c1ff00]">疲勞監測科學指南</span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-400 leading-relaxed font-medium max-w-4xl mx-auto">
              訓練與恢復同等重要，SportRepo 根據運動科學文獻<br className="hidden md:block" />
              以四項指標作為運動選手訓練負荷管理。
            </p>
          </header>

          {/* Section 1: ACWR */}
          <section className="mb-32">
            <div className="flex flex-col lg:flex-row gap-16 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-[#c1ff00]/10 rounded-xl">
                    <Activity className="w-10 h-10 text-[#c1ff00]" />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black">1. 訓練負荷比 (ACWR)</h2>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-[#c1ff00] font-black text-xl mb-4 uppercase tracking-widest">你的體能「存款」夠花嗎？</h3>
                    <p className="text-xl text-gray-300 leading-relaxed mb-6">
                      <strong className="text-white">急性：慢性負荷比率 (ACWR)</strong> 是目前國際運動科學界公認預測受傷風險最有效的指標。
                    </p>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#c1ff00] mt-2.5"></div>
                        <p className="text-lg text-gray-300"><strong className="text-white text-xl">長期負荷（慢性）：</strong> 過去 28 天累積的體能，好比你的 「存款」。</p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#c1ff00] mt-2.5"></div>
                        <p className="text-lg text-gray-300"><strong className="text-white text-xl">短期負荷（急性）：</strong> 最近 7 天的訓練壓力，好比你本週的 「花費」。</p>
                      </li>
                    </ul>
                  </div>

                  {/* Warning Box */}
                  <div className="bg-red-500/5 border-l-4 border-red-500 p-8 rounded-r-2xl">
                    <div className="flex items-center gap-3 mb-4 text-red-500">
                      <AlertCircle className="w-6 h-6" />
                      <h4 className="font-black text-xl italic">為什麼這很重要？</h4>
                    </div>
                    <p className="text-lg text-gray-300 leading-relaxed mb-4">
                      受傷風險增加 <span className="text-red-500 font-black text-2xl mx-1">5-7 倍</span>。當選手短期負荷突然暴增 (ACWR &gt; 2.0)，且長期體能基礎不足時，發生非接觸性傷害的風險極高。
                    </p>
                    <p className="text-base text-gray-400">
                      <span className="text-[#c1ff00] font-bold">Sweet Spot (甜蜜點)：</span> 當 ACWR 維持在 <span className="text-[#c1ff00] font-black text-xl">0.8 - 1.3</span> 之間，受傷率最低。
                    </p>
                  </div>

                  {/* Lights */}
                  <div className="grid grid-cols-1 gap-4 pt-4">
                    <div className="flex items-center gap-6 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-black text-xl">0.8 - 1.3 綠燈</span>
                          <span className="text-green-500 font-bold">最佳狀態</span>
                        </div>
                        <p className="text-gray-400">體能穩定成長，受傷風險極小。</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-black text-xl">1.3 - 1.5 / &lt; 0.8 黃燈</span>
                          <span className="text-yellow-500 font-bold">需注意</span>
                        </div>
                        <p className="text-gray-400">負荷增加過快，或長期訓練量不足導致體能流失。</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 p-5 bg-white/5 rounded-2xl border border-white/10">
                      <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-black text-xl">&gt; 1.5 紅燈</span>
                          <span className="text-red-500 font-bold">危險區</span>
                        </div>
                        <p className="text-gray-400">短期負荷極高，身體無法適應，建議立即調整。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-2/5 sticky top-32">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-[#c1ff00] rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                  <ImageWithFallback 
                    src="https://images.unsplash.com/photo-1730251446354-bc3570752717?q=80&w=1080" 
                    alt="Youth athlete training on track" 
                    className="relative rounded-3xl border border-white/10 w-full aspect-[4/5] object-cover"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: RHR */}
          <section className="mb-32">
            <div className="flex flex-col lg:flex-row-reverse gap-16 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-red-500/10 rounded-xl">
                    <Heart className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black">2. 晨間心跳 (RHR)</h2>
                </div>
                
                <div className="space-y-10">
                  <div>
                    <h3 className="text-red-500 font-black text-xl mb-4 uppercase tracking-widest">身體內部的氣象台</h3>
                    <p className="text-xl text-gray-300 leading-relaxed">
                      靜止心率反映自律神經系統與恢復狀態。建議每天早上起床、下床前測量 1 分鐘心跳。
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3 mb-4 text-[#c1ff00]">
                        <TrendingDown className="w-6 h-6" />
                        <h4 className="font-bold text-lg text-white">體能適應力</h4>
                      </div>
                      <p className="text-gray-400 text-base">觀察心跳是否穩定在 <span className="text-white font-bold">± 5 bpm</span> 以內，判斷恢復是否足夠。</p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center gap-3 mb-4 text-[#c1ff00]">
                        <ClipboardCheck className="w-6 h-6" />
                        <h4 className="font-bold text-lg text-white">負荷調整依據</h4>
                      </div>
                      <p className="text-gray-400 text-base">若心跳異常偏高，代表身體正處於高壓狀態，需減量訓練。</p>
                    </div>
                  </div>

                  {/* RHR Indicator Table */}
                  <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                    <div className="grid grid-cols-[100px_1fr] border-b border-white/10">
                      <div className="p-5 bg-green-500/10 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-green-500"></div>
                      </div>
                      <div className="p-5">
                        <p className="text-white font-bold text-lg mb-1">穩定 / 更低</p>
                        <p className="text-gray-400">低於 7 天平均值，代表恢復良好。</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[100px_1fr] border-b border-white/10">
                      <div className="p-5 bg-yellow-500/10 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                      </div>
                      <div className="p-5">
                        <p className="text-white font-bold text-lg mb-1">偏高 (5-9 bpm)</p>
                        <p className="text-gray-400">身體正在承受壓力，建議適度放鬆。</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-[100px_1fr]">
                      <div className="p-5 bg-red-500/10 flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-red-500"></div>
                      </div>
                      <div className="p-5">
                        <p className="text-white font-bold text-lg mb-1">極高 (&gt; 10 bpm)</p>
                        <p className="text-gray-400">強烈疲勞警訊，應考慮休息或檢查。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-2/5">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1682706841289-9d7ddf5eb999?q=80&w=1080" 
                  alt="Heart rate ECG pulse waveform on monitor" 
                  className="rounded-3xl border border-white/10 w-full aspect-square object-cover"
                />
              </div>
            </div>
          </section>

          {/* Section 3: Wellness */}
          <section className="mb-32">
            <div className="flex flex-col lg:flex-row gap-16 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Brain className="w-10 h-10 text-blue-500" />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black">3. 身心狀態 (Wellness)</h2>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-blue-500 font-black text-xl mb-4 uppercase tracking-widest">聽見身體的聲音</h3>
                    <p className="text-xl text-gray-300 leading-relaxed mb-8">
                      透過對疲勞感、睡眠品質、肌肉痠痛與壓力的主觀感受，科學證明它往往比昂貴的客觀測量更敏感。
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-white">
                          <ClipboardCheck className="w-6 h-6 text-blue-500" />
                          <h4 className="font-bold text-xl">主觀疲勞感</h4>
                        </div>
                        <p className="text-gray-400">排除訓練數據之外的生活壓力來源，全面評估選手狀態。</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-white">
                          <Info className="w-6 h-6 text-blue-500" />
                          <h4 className="font-bold text-xl">睡眠與情緒</h4>
                        </div>
                        <p className="text-gray-400">睡眠是最好的恢復，情緒則是過度訓練的第一道防線。</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <div className="flex-1 bg-green-500/10 border border-green-500/20 p-6 rounded-2xl text-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-4"></div>
                      <span className="text-white font-black text-xl block mb-2">綠燈</span>
                      <p className="text-gray-400 text-sm">分數平穩，身心平衡。</p>
                    </div>
                    <div className="flex-1 bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-4"></div>
                      <span className="text-white font-black text-xl block mb-2">紅燈</span>
                      <p className="text-gray-400 text-sm">低於平均，需注意壓力。</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="w-full lg:w-2/5">
                <ImageWithFallback 
                  src={images.wellness} 
                  alt="Wellness Questionnaire" 
                  className="rounded-3xl border border-white/10 w-full aspect-video lg:aspect-square object-cover"
                />
              </div>
            </div>
          </section>

          {/* Section 4: sRPE */}
          <section className="mb-32">
            <div className="flex flex-col lg:flex-row-reverse gap-16 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-yellow-500/10 rounded-xl">
                    <TrendingUp className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-black">4. 今日訓練負荷 (sRPE)</h2>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-yellow-500 font-black text-xl mb-4 uppercase tracking-widest">量化你的努力</h3>
                    <p className="text-xl text-gray-300 leading-relaxed mb-6">
                      將選手主觀感覺到的 「訓練辛苦程度 (0-10分)」乘以「訓練時間」。這是國際通用的黃金標準。
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
                    <div className="flex items-center gap-3 mb-6 text-[#c1ff00]">
                      <ClipboardCheck className="w-6 h-6" />
                      <h4 className="font-black text-xl">關鍵解讀標準</h4>
                    </div>
                    <ul className="space-y-6">
                      <li className="flex gap-4">
                        <span className="text-[#c1ff00] text-2xl font-black">01</span>
                        <p className="text-lg text-gray-300">訓練量應該像 <strong className="text-white">階梯一樣循序漸進</strong>，而不是像雲霄飛車忽高忽低。</p>
                      </li>
                      <li className="flex gap-4">
                        <span className="text-[#c1ff00] text-2xl font-black">02</span>
                        <p className="text-lg text-gray-300">若本週訓練總量比上週暴增 <strong className="text-white">超過 15%</strong>，即為高風險訊號。</p>
                      </li>
                    </ul>
                  </div>

                  <Button 
                    onClick={onBack}
                    className="w-full bg-[#c1ff00] hover:bg-[#d4ff33] text-black font-black py-8 text-xl uppercase tracking-widest rounded-xl shadow-[0_10px_30px_rgba(193,255,0,0.2)]"
                  >
                    立刻開始科學化管理 →
                  </Button>
                </div>
              </div>
              
              <div className="w-full lg:w-2/5">
                <ImageWithFallback 
                  src="https://images.unsplash.com/photo-1626337920103-ae64b9c688e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydCUyMGF0aGxldGUlMjByZXN0aW5nJTIwc2l0dGluZyUyMGJsYWNrJTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3Njk1NzE5NjF8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                  alt="Athlete Resting" 
                  className="rounded-3xl border border-white/10 w-full aspect-[3/4] object-cover shadow-2xl"
                />
              </div>
            </div>
          </section>

          {/* References */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-10 lg:p-16">
            <div className="flex items-center gap-4 mb-12 text-[#c1ff00]">
              <div className="p-3 bg-[#c1ff00]/10 rounded-xl">
                <BookOpen className="w-8 h-8" />
              </div>
              <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-wider">參考文獻 (Selected References)</h2>
            </div>
            
            <p className="text-gray-400 mb-10 text-lg">
              為了確保資訊的正確性與科學價值，SportRepo 系統的設計參考了多篇學術文獻：
            </p>
            
            <div className="grid grid-cols-1 gap-8 opacity-70">
              <div className="space-y-1 text-sm text-gray-400">
                <p className="text-white font-bold mb-1">[1] ACWR 與受傷風險</p>
                <p>Bowen, L., Gross, A. S., Gimpel, M., & Li, F. X. (2020). Spikes in acute:chronic workload ratio (ACWR) associated with a 5–7 times greater injury rate in English Premier League football players. <em className="italic">British Journal of Sports Medicine</em>, 54(12), 731–738.</p>
              </div>
              <div className="space-y-1 text-sm text-gray-400">
                <p className="text-white font-bold mb-1">[2] ACWR 最佳區間</p>
                <p>Qin, W., Li, R., & Chen, L. (2025). Acute to chronic workload ratio (ACWR) for predicting sports injury risk: a systematic review and meta-analysis. <em className="italic">BMC Sports Science, Medicine and Rehabilitation</em>, 17, 285.</p>
              </div>
              <div className="space-y-1 text-sm text-gray-400 border-t border-white/5 pt-8">
                <p className="text-white font-bold mb-1">[3] EWMA 模型優勢</p>
                <p>Murray, N. B., Gabbett, T. J., Townshend, A. D., & Blanch, P. (2017). Calculating acute:chronic workload ratios using exponentially weighted moving averages provides a more sensitive indicator of injury likelihood than rolling averages. <em className="italic">British Journal of Sports Medicine</em>, 51(9), 749–754.</p>
              </div>
              <div className="space-y-1 text-sm text-gray-400">
                <p className="text-white font-bold mb-1">[4] 主觀指標的優勢</p>
                <p>Saw, A. E., Main, L. C., & Gastin, P. B. (2016). Monitoring the athlete training response: subjective self-reported measures trump commonly used objective measures: a systematic review. <em className="italic">British Journal of Sports Medicine</em>, 50(5), 281-291.</p>
              </div>
              <div className="space-y-1 text-sm text-gray-400 border-t border-white/5 pt-8">
                <p className="text-white font-bold mb-1">[5] 靜止心率與過度訓練</p>
                <p>Jeukendrup, A. E., Hesselink, M. K., Snyder, A. C., Kuipers, H., & Keizer, H. A. (1992). Physiological changes in male competitive cyclists after two weeks of intensified training. <em className="italic">International Journal of Sports Medicine</em>, 13(7), 534–541.</p>
              </div>
              <div className="space-y-1 text-sm text-gray-400">
                <p className="text-white font-bold mb-1">[6] sRPE 的信效度</p>
                <p>Christen, J., Foster, C., Porcari, J. P., & Mikat, R. P. (2016). Temporal Robustness of the Session Rating of Perceived Exertion. <em className="italic">International Journal of Sports Physiology and Performance</em>, 11(8), 1088-1093.</p>
              </div>
              <div className="space-y-1 text-sm text-gray-400">
                <p className="text-white font-bold mb-1">[7] 身心狀態與疾病</p>
                <p>Thornton, H. R., Delaney, J. A., Duthie, G. M., et al. (2016). Predicting self-reported illness for professional team-sport athletes. <em className="italic">International Journal of Sports Physiology and Performance</em>, 11(4), 543-550.</p>
              </div>
            </div>
          </section>

          {/* New Footer based on reference */}
          <footer className="mt-32 pt-16 border-t border-white/10 grid grid-cols-1 md:grid-cols-3 gap-12 items-start">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#c1ff00] flex items-center justify-center font-black text-black text-xl rounded-md">S</div>
                <span className="text-2xl font-black tracking-tighter">SPORTREPO</span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-8">
                專為基層運動隊伍設計的訓練負荷管理平台，用一站式系統為科學化訓練。
              </p>
              <div className="bg-[#c1ff00] text-black text-xs font-black px-4 py-2 inline-block rounded-full uppercase tracking-widest">
                Make your science work training today
              </div>
            </div>
            
            <div className="md:col-span-2 grid grid-cols-2 gap-8">
              <div>
                <h5 className="text-white font-black mb-6 uppercase tracking-widest text-sm">聯絡我們</h5>
                <a href="mailto:sportrepo@gmail.com" className="text-gray-400 hover:text-[#c1ff00] transition-colors flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  sportrepo@gmail.com
                </a>
              </div>
              <div>
                <h5 className="text-white font-black mb-6 uppercase tracking-widest text-sm">實證設計</h5>
                <ul className="space-y-3">
                  <li className="text-[#c1ff00] font-black italic">SPORTREPO 1.0</li>
                  <li className="text-gray-400">基於 2025 最新運動科學研究</li>
                </ul>
              </div>
            </div>
          </footer>
          
          <div className="mt-20 text-center text-gray-600 text-xs border-t border-white/5 pt-8">
            <p>&copy; 2026 SPORTREPO. PROPERTY OF SPORTREPO SPORTS BUSINESS. ALL RIGHT RESERVED.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
