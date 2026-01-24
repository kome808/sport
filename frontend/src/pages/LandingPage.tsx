import { Link } from 'react-router-dom';
import { ArrowRight, Smartphone, Activity, BarChart3, ShieldCheck, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
            {/* Navbar */}
            <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-lg">
                            SR
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">SportRepo</span>
                    </div>
                    <nav className="hidden gap-6 md:flex">
                        <a href="#features" className="text-sm font-medium hover:text-blue-600 transition-colors">功能特色</a>
                        <a href="#how-it-works" className="text-sm font-medium hover:text-blue-600 transition-colors">運作流程</a>
                        <a href="#about" className="text-sm font-medium hover:text-blue-600 transition-colors">為何選擇我們</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <Link to="/login">
                            <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                                教練 / 家長登入
                            </Button>
                        </Link>
                        <Link to="/team/setup">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                建立隊伍
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="flex flex-col items-center text-center space-y-8">
                            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-800">
                                <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
                                專為基層運動隊伍打造
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                                用最簡單的方式，<br className="hidden sm:inline" />
                                開始運動科學訓練
                            </h1>

                            <p className="mx-auto max-w-[700px] text-lg text-slate-600 md:text-xl leading-relaxed">
                                透過手機，讓選手每日 1 分鐘快速回報。
                                <br />
                                教練即時掌握訓練負荷，提早發現風險，真正做到保護選手、穩定成長。
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                                <Link to="/team/setup">
                                    <Button size="lg" className="h-12 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 w-full sm:w-auto">
                                        立即開始使用
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link to="/login?demo=coach">
                                    <Button size="lg" variant="outline" className="h-12 px-8 text-lg bg-white hover:bg-slate-50 border-slate-200 w-full sm:w-auto text-slate-700">
                                        <PlayCircle className="mr-2 h-5 w-5 text-orange-500" />
                                        教練演示
                                    </Button>
                                </Link>
                                <Link to="/doraemon-baseball/login">
                                    <Button size="lg" variant="ghost" className="h-12 px-8 text-lg hover:bg-slate-100 text-slate-500 w-full sm:w-auto">
                                        選手演示
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="pt-12 text-sm text-slate-500">
                                <p className="mb-4 font-medium uppercase tracking-wider text-xs">三大關鍵效益</p>
                                <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 font-medium text-slate-700">
                                    <span className="flex items-center"><ShieldCheck className="mr-2 h-4 w-4 text-green-500" /> 預防運動傷害</span>
                                    <span className="flex items-center"><BarChart3 className="mr-2 h-4 w-4 text-blue-500" /> 數據輔助決策</span>
                                    <span className="flex items-center"><Smartphone className="mr-2 h-4 w-4 text-orange-500" /> 零硬體門檻</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Abstract Background Elements */}
                    <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl"></div>
                    <div className="absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-orange-400/10 blur-3xl"></div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-white">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">核心功能特色</h2>
                            <p className="max-w-[700px] text-slate-500 md:text-lg">
                                我們移除了所有複雜的門檻，只留下對教練最有幫助的核心功能。
                            </p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-3">
                            {/* Feature 1 */}
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
                                <CardContent className="pt-8 px-8 pb-8 flex flex-col items-center text-center space-y-4">
                                    <div className="p-4 rounded-full bg-blue-100 text-blue-600 mb-2">
                                        <Smartphone className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-bold">零硬體成本監控</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        不需心率帶或 GPS。透過每日回報晨間心跳 (RHR)、身心狀態與 RPE，系統自動計算 ACWR 負荷指標。
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Feature 2 */}
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
                                <CardContent className="pt-8 px-8 pb-8 flex flex-col items-center text-center space-y-4">
                                    <div className="p-4 rounded-full bg-green-100 text-green-600 mb-2">
                                        <Activity className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-bold">視覺化傷痛地圖</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        哪裡痛點哪裡。直覺式人體圖像點選，教練一秒掌握全隊傷兵狀況，避免帶傷訓練。
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Feature 3 */}
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
                                <CardContent className="pt-8 px-8 pb-8 flex flex-col items-center text-center space-y-4">
                                    <div className="p-4 rounded-full bg-orange-100 text-orange-600 mb-2">
                                        <BarChart3 className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-bold">成長歷程數據</h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        自動累積個人與團隊訓練紀錄。教練用來調整課表，家長用來理解孩子，建立三方信任。
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>

                {/* Pain Points Section */}
                <section className="py-24 bg-slate-50">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid gap-12 lg:grid-cols-2 items-center">
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                                    基層運動隊伍，<br />最常遇到的現實問題
                                </h2>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">❌</div>
                                        <div>
                                            <h4 className="font-bold text-lg">教練的困境</h4>
                                            <p className="text-slate-600">選手常說「還可以」，但實際的疲勞與風險，往往在受傷後才被發現。</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">❌</div>
                                        <div>
                                            <h4 className="font-bold text-lg">家長的不安</h4>
                                            <p className="text-slate-600">孩子每天高強度訓練，卻缺乏一個能理解身體負荷與訓練狀況的管道。</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0 mt-1">❌</div>
                                        <div>
                                            <h4 className="font-bold text-lg">導入門檻過高</h4>
                                            <p className="text-slate-600">傳統科學化訓練仰賴昂貴穿戴裝置，對基層經費是沈重負擔。</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                {/* Placeholder for UI Screenshot or Abstract Graphic */}
                                <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl p-6 flex items-center justify-center text-white/90">
                                    <div className="text-center space-y-4">
                                        <Activity className="h-20 w-20 mx-auto opacity-80" />
                                        <div className="text-2xl font-bold">SportRepo Dashboard</div>
                                        <p className="opacity-70">紅黃綠燈號，一目瞭然</p>
                                    </div>
                                </div>
                                <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-orange-500 rounded-full blur-3xl opacity-20"></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                    <div className="container px-4 md:px-6 mx-auto text-center relative z-10">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mb-6">
                            讓科學化訓練成為<br />基層球隊的標準配備
                        </h2>
                        <p className="mx-auto max-w-[600px] text-slate-300 md:text-xl mb-10">
                            減少受傷，是我們給選手最好的禮物。<br />
                            從今天開始，只要一支手機，就能讓訓練更安全。
                        </p>
                        <Link to="/team/setup">
                            <Button size="lg" className="h-14 px-10 text-xl font-bold bg-blue-600 hover:bg-blue-500 border-none">
                                立即免費開始
                                <ArrowRight className="ml-2 h-6 w-6" />
                            </Button>
                        </Link>
                    </div>
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] bg-blue-600/20 rounded-full blur-[100px]"></div>
                </section>
            </main>

            <footer className="border-t bg-white py-12">
                <div className="container px-4 md:px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded bg-slate-900 text-white flex items-center justify-center text-xs font-bold">SR</div>
                        <span className="font-bold text-slate-900">SportRepo</span>
                    </div>
                    <div className="text-sm text-slate-500 text-center md:text-right">
                        <p>© 2026 SportRepo. All rights reserved.</p>
                        <p className="mt-1">聯絡信箱：sportrepotw@gmail.com</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
