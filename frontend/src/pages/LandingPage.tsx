/**
 * Landing Page - 產品首頁
 * 展示產品核心價值與功能特色
 */

import { Link } from 'react-router-dom';
import {
    Activity,
    Heart,
    Target,
    Clock,
    Shield,
    Zap,
    ChevronRight,
    BarChart3,
    Users,
    Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
    {
        icon: Activity,
        title: 'ACWR 訓練監控',
        description: '科學化訓練負荷監測，預防運動傷害，優化訓練週期。',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
    },
    {
        icon: Heart,
        title: '身心狀態追蹤',
        description: '每日 Wellness 問卷與晨間心率記錄，全面掌握球員狀態。',
        color: 'text-danger',
        bgColor: 'bg-danger/10',
    },
    {
        icon: Target,
        title: 'MBO 目標管理',
        description: '設定個人化訓練目標，追蹤進度，激勵持續成長。',
        color: 'text-system',
        bgColor: 'bg-system/10',
    },
    {
        icon: Clock,
        title: '25秒快速回報',
        description: '簡化填報流程，球員輕鬆完成每日訓練回報。',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
    },
    {
        icon: Shield,
        title: '傷病預警系統',
        description: '智慧分析訓練數據，提早預警高風險球員。',
        color: 'text-danger',
        bgColor: 'bg-danger/10',
    },
    {
        icon: Zap,
        title: 'AI 訓練建議',
        description: '整合 AI 分析，提供個人化訓練強度與恢復建議。',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
    },
];

const stats = [
    { label: '活躍球隊', value: '500+' },
    { label: '球員使用', value: '10,000+' },
    { label: '訓練紀錄', value: '1M+' },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background">
            {/* 導航列 */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                            ST
                        </div>
                        <span className="font-bold text-xl">運動訓練平台</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/login">
                            <Button variant="ghost">登入</Button>
                        </Link>
                        <Link to="/register">
                            <Button className="bg-[#7367F0] text-white hover:bg-[#5E50EE] border-0">免費註冊</Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-system/5" />
                <div className="container mx-auto px-4 py-20 md:py-32 relative">
                    <div className="max-w-3xl mx-auto text-center">
                        <Badge variant="secondary" className="mb-4">
                            🚀 專為基層運動球隊打造
                        </Badge>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                            科學化訓練管理
                            <span className="text-primary block mt-2">守護每位球員健康</span>
                        </h1>
                        <p className="text-lg md:text-xl text-muted-foreground mb-8" style={{ maxWidth: '42rem', marginInline: 'auto' }}>
                            結合運動科學與現代技術，提供訓練負荷監控、疲勞管理、傷病預警等功能，幫助教練做出更好的訓練決策。
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-[#7367F0] text-white hover:bg-[#5E50EE] border-0">
                                    開始免費試用
                                    <ChevronRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8">
                                觀看示範
                            </Button>
                        </div>
                    </div>

                    {/* 儀表板預覽圖 */}
                    <div className="mt-16 relative max-w-5xl mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
                        <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
                            <div className="bg-muted/50 p-4 flex items-center gap-8">
                                <div className="flex gap-2">
                                    <div className="h-3 w-3 rounded-full bg-red-400" />
                                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                                    <div className="h-3 w-3 rounded-full bg-green-400" />
                                </div>
                                <div className="flex-1 flex justify-center gap-8 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4" /> 戰情室
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Users className="h-4 w-4" /> 球員管理
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Bell className="h-4 w-4" /> 警訊中心
                                    </span>
                                </div>
                            </div>
                            <div className="p-8 bg-muted/30 h-64 flex items-center justify-center text-muted-foreground">
                                <div className="text-center">
                                    <BarChart3 className="h-16 w-16 mx-auto mb-4 text-primary/50" />
                                    <p>儀表板預覽</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 數據統計 */}
            <section className="border-y bg-muted/30">
                <div className="container mx-auto px-4 py-12">
                    <div className="grid grid-cols-3 gap-8 text-center">
                        {stats.map((stat) => (
                            <div key={stat.label}>
                                <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 功能特色 */}
            <section className="py-20 md:py-32">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能</h2>
                        <p className="text-lg text-muted-foreground" style={{ maxWidth: '42rem', marginInline: 'auto' }}>
                            基於運動科學研究，打造全方位的訓練管理解決方案
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <Card key={feature.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                                    <CardHeader>
                                        <div className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                                            <Icon className={`h-6 w-6 ${feature.color}`} />
                                        </div>
                                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-base">{feature.description}</CardDescription>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 md:py-32 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">
                        準備好開始了嗎？
                    </h2>
                    <p className="text-lg opacity-90 mb-8" style={{ maxWidth: '36rem', marginInline: 'auto' }}>
                        立即註冊，免費體驗完整功能，讓您的球隊訓練更科學、更安全。
                    </p>
                    <Link to="/register">
                        <Button size="lg" variant="secondary" className="text-lg px-8">
                            免費開始使用
                            <ChevronRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t py-12">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                                ST
                            </div>
                            <span className="font-semibold">運動訓練平台</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © 2026 Sports Training Platform. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
