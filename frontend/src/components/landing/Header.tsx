import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-white/10">
            <div className="container mx-auto px-4 lg:px-8">
                <div className="flex items-center justify-between h-16 lg:h-20">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-[#c1ff00] rounded flex items-center justify-center">
                                <span className="text-black font-black text-xl">S</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#c1ff00] rounded-full animate-pulse"></div>
                        </div>
                        <span className="text-2xl font-black text-white tracking-tight">
                            SPORT<span className="text-[#c1ff00]">REPO</span>
                            <span className="text-xs ml-1 text-gray-400 align-super">BETA</span>
                        </span>
                    </Link>

                    {/* Navigation */}
                    <div className="flex items-center gap-2 lg:gap-4">
                        <Link to="/science" className="hidden lg:block">
                            <Button
                                variant="ghost"
                                className="text-white hover:text-[#c1ff00] hover:bg-white/5 font-bold tracking-wide"
                            >
                                關於運動訓練負荷管理
                            </Button>
                        </Link>

                        {/* Desktop Auth Buttons */}
                        <div className="hidden lg:flex items-center gap-4">
                            <Link to="/login">
                                <Button
                                    variant="ghost"
                                    className="text-white hover:text-[#c1ff00] hover:bg-white/5 font-bold uppercase tracking-wide"
                                >
                                    登入
                                </Button>
                            </Link>
                            <Link to="/register">
                                <Button
                                    className="bg-[#c1ff00] hover:bg-[#d4ff33] text-black font-black uppercase tracking-wide px-6"
                                >
                                    免費註冊
                                </Button>
                            </Link>
                        </div>

                        {/* Mobile Menu */}
                        <div className="lg:hidden">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                                        <Menu className="h-6 w-6" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800 text-white">
                                    <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white cursor-pointer p-3">
                                        <Link to="/science" className="w-full flex items-center justify-center font-bold">
                                            訓練負荷
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white cursor-pointer p-3 border-t border-zinc-800">
                                        <Link to="/login" className="w-full flex items-center justify-center font-bold">
                                            登入
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-white cursor-pointer p-3">
                                        <Link to="/register" className="w-full flex items-center justify-center font-bold text-[#c1ff00]">
                                            免費註冊
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
