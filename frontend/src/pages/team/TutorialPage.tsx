import { BookOpen, Users, UserCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

import { useParams } from 'react-router-dom';
import { useTeam } from '@/hooks/useTeam';

export default function TutorialPage() {
    const { teamSlug } = useParams<{ teamSlug: string }>();
    const { data: team } = useTeam(teamSlug || '');

    return (
        <div className="container mx-auto py-8 px-4 space-y-6">
            {/* 頁面標題 */}
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-black">使用教學</h1>
                    <p className="text-black font-medium">快速上手運動訓練管理平台</p>
                </div>
            </div>

            {/* Tab 切換 */}
            <Tabs defaultValue="coach" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 rounded-2xl bg-muted/30">
                    <TabsTrigger value="coach" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <Users className="h-4 w-4 mr-2" />
                        教練端
                    </TabsTrigger>
                    <TabsTrigger value="player" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <UserCircle className="h-4 w-4 mr-2" />
                        球員端
                    </TabsTrigger>
                    <TabsTrigger value="faq" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        常見問答
                    </TabsTrigger>
                </TabsList>

                {/* 教練端教學 */}
                <TabsContent value="coach" className="space-y-6 mt-6">
                    <CoachTutorial team={team} teamSlug={teamSlug} />
                </TabsContent>

                {/* 球員端教學 */}
                <TabsContent value="player" className="space-y-6 mt-6">
                    <PlayerTutorial />
                </TabsContent>

                {/* 常見問答 */}
                <TabsContent value="faq" className="space-y-6 mt-6">
                    <FAQSection />
                </TabsContent>
            </Tabs>
        </div>
    );
}

// 教練端教學組件
function CoachTutorial({ team, teamSlug }: { team: any; teamSlug?: string }) {
    const loginUrl = `${window.location.origin}/${teamSlug}/login`;
    const defaultPassword = teamSlug === 'shohoku-basketball' ? 'demo123' : '1234';

    return (
        <>
            {/* ... (建立球隊流程) */}
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                    <CardTitle className="text-2xl font-black text-black">1. 建立球隊流程</CardTitle>
                    <CardDescription className="font-medium">從註冊到開始使用的完整步驟</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-4">
                        <StepCard
                            number="1"
                            title="註冊/登入帳號"
                            description="本平台全面採用 Google 帳號快速登入，無需記憶額外密碼，安全又方便。"
                        />
                        <StepCard
                            number="2"
                            title="建立球隊"
                            description="填寫球隊名稱、URL 代碼與運動項目，系統會自動建立專屬的球隊空間。"
                        />
                        <StepCard
                            number="3"
                            title="新增球員"
                            description="使用批次新增功能，一次輸入多位球員的基本資料（姓名、背號、位置等）。"
                        />
                        <StepCard
                            number="4"
                            title="開始使用"
                            description="進入儀表板查看球隊概況，追蹤球員訓練負荷與健康狀態。"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ... (批次新增球員) */}
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-500/5">
                    <CardTitle className="text-2xl font-black text-black">2. 批次新增球員</CardTitle>
                    <CardDescription className="font-medium">快速建立完整的球員名單</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-4">
                        <FeatureCard
                            icon="📝"
                            title="表格式輸入"
                            description="類似 Excel 的表格介面，可快速填寫多位球員資料。"
                        />
                        <FeatureCard
                            icon="➕"
                            title="彈性新增"
                            description="隨時點擊「新增一行」按鈕增加更多球員欄位。"
                        />
                        <FeatureCard
                            icon="💾"
                            title="一鍵儲存"
                            description="填寫完成後點擊「儲存所有球員」，系統會自動批次建立。"
                        />
                        <FeatureCard
                            icon="🔄"
                            title="資料驗證"
                            description="系統會自動檢查必填欄位，確保資料完整性。"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* ... (儀表板功能) */}
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-500/5">
                    <CardTitle className="text-2xl font-black text-black">3. 儀表板功能</CardTitle>
                    <CardDescription className="font-medium">全隊訓練負荷一目了然</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid md:grid-cols-3 gap-6">
                        <DashboardFeature
                            title="球隊概況"
                            description="即時查看球員總數、今日回報率、高風險球員數量等關鍵指標。"
                            color="bg-blue-500"
                        />
                        <DashboardFeature
                            title="風險預警"
                            description="系統自動計算 ACWR、PSI 等疲勞指標，標示高風險球員。"
                            color="bg-red-500"
                        />
                        <DashboardFeature
                            title="傷病追蹤"
                            description="查看未解決的疼痛回報，及時關注球員健康狀況。"
                            color="bg-yellow-500"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 球員啟用與登入引導 */}
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-purple-500/5">
                    <CardTitle className="text-2xl font-black text-black">4. 球員啟用與登入引導</CardTitle>
                    <CardDescription className="font-medium">教練請依照以下步驟引導球員開始使用系統</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-4">
                        <InvitationStep
                            number="1"
                            title="提供球隊登入網址與通行碼"
                            description={
                                <div className="space-y-2">
                                    <p>將球隊專屬網址與通行碼分享給球員，登入時需先輸入通行碼驗證。</p>
                                    <div className="bg-white/50 p-3 rounded-xl border border-purple-200 text-sm space-y-1">
                                        <p className="flex justify-between">
                                            <span className="text-purple-600 font-bold">登入網址：</span>
                                            <span className="font-mono bg-purple-100 px-2 rounded">{loginUrl}</span>
                                        </p>
                                        <p className="flex justify-between">
                                            <span className="text-purple-600 font-bold">球隊通行碼：</span>
                                            <span className="font-mono bg-purple-100 px-2 rounded">{team?.invitation_code || '尚未設定'}</span>
                                        </p>
                                    </div>
                                </div>
                            }
                        />
                        <InvitationStep
                            number="2"
                            title="球員認領名字"
                            description="球員成功進入網址並輸入通行碼後，在列表中找到並點擊自己的名字（認領帳號）。"
                        />
                        <InvitationStep
                            number="3"
                            title="輸入預設密碼"
                            description={
                                <div className="space-y-2">
                                    <p>首次登入時，請球員輸入系統預設密碼。</p>
                                    <div className="bg-white/50 p-3 rounded-xl border border-purple-200 text-sm flex justify-between">
                                        <span className="text-purple-600 font-bold">系統預設密碼：</span>
                                        <span className="font-mono bg-purple-100 px-2 rounded">{defaultPassword}</span>
                                    </div>
                                </div>
                            }
                        />
                        <InvitationStep
                            number="4"
                            title="修改密碼與保存連結"
                            description="登入後系統會要求修改密碼。請球員將登入後的「個人專屬短網址」加入書籤，下次直接使用該網址登入。"
                        />
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

// 球員端教學組件
function PlayerTutorial() {
    return (
        <>
            {/* 球員登入流程 */}
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                    <CardTitle className="text-2xl font-black text-black">1. 球員登入流程</CardTitle>
                    <CardDescription className="font-medium">三步驟快速開始使用</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-4">
                        <StepCard
                            number="1"
                            title="取得專屬登入頁"
                            description="向教練索取球隊的專屬登入頁面網址，並在列表中點選您的名字。"
                        />
                        <StepCard
                            number="2"
                            title="輸入密碼登入"
                            description="首次登入請輸入教練提供的預設密碼，登入後系統會提示您修改個人密碼。"
                        />
                        <StepCard
                            number="3"
                            title="開始回報"
                            description="成功登入後，即可開始填寫每日訓練回報表。"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 每日回報 */}
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-500/5">
                    <CardTitle className="text-2xl font-black text-black">2. 每日訓練回報</CardTitle>
                    <CardDescription className="font-medium">記錄您的訓練狀態與身體感受</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-4">
                        <ReportItem
                            icon="💪"
                            title="訓練強度"
                            description="拖動滑桿評估今日訓練的強度（1-10分）。"
                        />
                        <ReportItem
                            icon="😴"
                            title="疲勞程度"
                            description="記錄訓練後的疲勞感受，幫助教練調整訓練計畫。"
                        />
                        <ReportItem
                            icon="🛌"
                            title="睡眠品質"
                            description="評估昨晚的睡眠狀況，影響恢復效果的重要指標。"
                        />
                        <ReportItem
                            icon="🩹"
                            title="肌肉痠痛"
                            description="點選身體部位標示痠痛位置，及早發現潛在傷病。"
                        />
                        <ReportItem
                            icon="😊"
                            title="心情狀態"
                            description="選擇表情符號反映今日心情，心理健康同樣重要。"
                        />
                        <ReportItem
                            icon="📝"
                            title="備註欄位"
                            description="可額外填寫任何想告知教練的訊息或特殊狀況。"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 查看個人數據 */}
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-500/5">
                    <CardTitle className="text-2xl font-black text-black">3. 查看個人數據</CardTitle>
                    <CardDescription className="font-medium">追蹤自己的訓練進度</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <DataFeature
                            title="疲勞監測"
                            description="查看 ACWR、PSI、RHR 等科學化疲勞指標，了解自己的訓練負荷狀態。"
                        />
                        <DataFeature
                            title="歷史紀錄"
                            description="瀏覽過去的回報紀錄，觀察訓練強度與身體反應的變化趨勢。"
                        />
                        <DataFeature
                            title="疼痛報告"
                            description="查看自己提交的疼痛回報，追蹤傷病恢復進度。"
                        />
                        <DataFeature
                            title="圖表分析"
                            description="透過視覺化圖表，更直觀地理解自己的訓練數據。"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 疼痛回報功能 */}
            <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-red-500/10 to-red-500/5">
                    <CardTitle className="text-2xl font-black text-black">4. 疼痛回報功能</CardTitle>
                    <CardDescription className="font-medium">及時回報身體不適</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-4">
                        <PainReportStep
                            number="1"
                            title="選擇疼痛部位"
                            description="在人體圖上點選疼痛的部位（例如: 右膝、左肩）。"
                        />
                        <PainReportStep
                            number="2"
                            title="評估疼痛程度"
                            description="使用 1-10 分的量表評估疼痛強度。"
                        />
                        <PainReportStep
                            number="3"
                            title="描述症狀"
                            description="填寫疼痛的具體感受（例如: 刺痛、鈍痛、腫脹）。"
                        />
                        <PainReportStep
                            number="4"
                            title="提交報告"
                            description="教練會收到通知，並可能調整您的訓練計畫或建議就醫。"
                        />
                    </div>
                </CardContent>
            </Card>
        </>
    );
}

// 常見問答組件
function FAQSection() {
    return (
        <Card className="rounded-3xl border-none shadow-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="text-2xl font-black text-black">常見問答 (FAQ)</CardTitle>
                <CardDescription className="font-medium">快速解答您的疑問</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {/* 帳號管理 */}
                    <AccordionItem value="account-1" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            如何註冊/登入教練帳號？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            本系統支援 Google 帳號一鍵登入。點擊首頁的「登入」或「註冊」按鈕，選擇您的 Google 帳號即可快速啟用，無需填寫其他資料。
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="account-2" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            球員如何登入？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            球員需透過球隊專屬的登入網址，在列表中認領自己的名字並輸入預設密碼。首次登入後請務必修改密碼以確保安全。
                        </AccordionContent>
                    </AccordionItem>

                    {/* 功能操作 */}
                    <AccordionItem value="feature-1" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            如何批次新增多位球員？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            進入「球員管理」頁面，點擊「批次新增球員」按鈕。在表格中填寫球員資料（姓名為必填），完成後點擊「儲存所有球員」即可。
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="feature-2" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            儀表板上的「風險名單」是什麼？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            系統自動偵測指出「晨間心跳 RHR」、「身心狀態 WELLNESS」、「今日訓練負荷 sRPE」或「急慢性負荷比 ACWR」中任一指標異常的球員
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="feature-3" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            球員可以修改已提交的回報嗎？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            當天與前一天都可以再次填寫送出
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="feature-5" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            如果沒有每天填寫會怎樣？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium space-y-2">
                            <p>系統預設將「未填寫資料」的日期視為「休息日」(負荷為 0)。</p>
                            <p className="text-red-500 font-bold">⚠️ 注意事項：</p>
                            <ul className="list-disc pl-5">
                                <li>如果您是有訓練卻忘記填寫，會導致慢性負荷被低估。</li>
                                <li>當您下次補填時，急慢性負荷比 (ACWR) 可能會異常飆升，導致誤判為高風險。</li>
                                <li>建議：若當天真的休息可留白；若有訓練請務必填寫，即使是估算值也好，以確保數據準確性。</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="feature-4" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            如何邀請其他教練加入球隊？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            在「球隊設定」頁面中，啟用「教練團隊邀請」功能並設定邀請碼。將邀請連結或邀請碼分享給其他教練，他們即可加入您的球隊。
                        </AccordionContent>
                    </AccordionItem>

                    {/* 資料安全 */}
                    <AccordionItem value="security-1" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            我的資料安全嗎？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            我們使用 Supabase 作為資料庫服務，所有資料都經過加密傳輸與儲存。此外，系統設有嚴格的權限控制，確保只有授權的教練與球員能存取相關資料。
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="security-2" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            球員的個人資料會被分享給其他人嗎？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            不會。球員的個人資料僅限於所屬球隊的教練查看，不會對外公開或分享給第三方。
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="security-3" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            如何刪除球隊或球員資料？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            在「球員管理」頁面中，可以選擇球員並點擊「刪除」按鈕（此為軟刪除，資料會標記為「已畢業」狀態）。如需完全刪除球隊，請聯繫系統管理員。
                        </AccordionContent>
                    </AccordionItem>

                    {/* 技術支援 */}
                    <AccordionItem value="support-1" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            遇到技術問題該怎麼辦？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            請透過系統內的「意見回饋」功能回報問題，或直接聯繫技術支援團隊。我們會盡快協助您解決問題。
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="support-2" className="border rounded-2xl px-6 bg-white shadow-sm">
                        <AccordionTrigger className="font-bold text-black hover:no-underline">
                            系統支援哪些裝置？
                        </AccordionTrigger>
                        <AccordionContent className="text-black font-medium">
                            本平台支援桌面電腦（Windows、Mac）、平板與手機（iOS、Android）。建議使用最新版本的 Chrome、Safari 或 Edge 瀏覽器以獲得最佳體驗。
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </CardContent>
        </Card>
    );
}

// 輔助組件
function StepCard({ number, title, description }: { number: string; title: string; description: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                {number}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-black text-lg">{title}</h3>
                <div className="text-black font-medium mt-1">{description}</div>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white border-2 border-muted hover:border-primary/30 transition-colors">
            <div className="text-4xl mb-3">{icon}</div>
            <h3 className="font-bold text-black text-lg mb-2">{title}</h3>
            <p className="text-black font-medium text-sm">{description}</p>
        </div>
    );
}

function DashboardFeature({ title, description, color }: { title: string; description: string; color: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white border-2 border-muted hover:shadow-lg transition-shadow">
            <div className={`h-12 w-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center mb-4`}>
                <div className={`h-6 w-6 rounded-full ${color}`}></div>
            </div>
            <h3 className="font-bold text-black text-lg mb-2">{title}</h3>
            <p className="text-black font-medium text-sm">{description}</p>
        </div>
    );
}

function InvitationStep({ number, title, description }: { number: string; title: string; description: React.ReactNode }) {
    return (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-purple-50 border-2 border-purple-200">
            <div className="h-10 w-10 rounded-full bg-purple-500 text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                {number}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-black text-lg">{title}</h3>
                <div className="text-black font-medium mt-1">{description}</div>
            </div>
        </div>
    );
}

function ReportItem({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div className="p-5 rounded-2xl bg-blue-50 border-2 border-blue-200">
            <div className="text-3xl mb-2">{icon}</div>
            <h3 className="font-bold text-black mb-1">{title}</h3>
            <p className="text-black font-medium text-sm">{description}</p>
        </div>
    );
}

function DataFeature({ title, description }: { title: string; description: string }) {
    return (
        <div className="p-6 rounded-2xl bg-green-50 border-2 border-green-200">
            <h3 className="font-bold text-black text-lg mb-2">{title}</h3>
            <p className="text-black font-medium text-sm">{description}</p>
        </div>
    );
}

function PainReportStep({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className="flex items-start gap-4 p-5 rounded-2xl bg-red-50 border-2 border-red-200">
            <div className="h-10 w-10 rounded-full bg-red-500 text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                {number}
            </div>
            <div>
                <h3 className="font-bold text-black text-lg">{title}</h3>
                <p className="text-black font-medium mt-1">{description}</p>
            </div>
        </div>
    );
}
