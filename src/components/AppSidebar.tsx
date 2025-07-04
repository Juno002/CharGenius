
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Home, UserSquare, Sparkles, Users, Settings } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

const navItems = [
    { href: '/', labelKey: 'mobileNav.home', icon: Home },
    { href: '/edit', labelKey: 'mobileNav.editor', icon: UserSquare },
    { href: '/tools', labelKey: 'mobileNav.suite', icon: Sparkles },
    { href: '/gallery', labelKey: 'mobileNav.goToGallery', icon: Users },
    { href: '/settings', labelKey: 'mobileNav.settings', icon: Settings },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { t } = useTranslation();

    return (
        <aside className="hidden md:flex flex-col w-16 items-center gap-4 border-r bg-sidebar/50 backdrop-blur-xl p-2">
            <Link href="/" className="flex h-12 w-12 items-center justify-center rounded-lg text-primary" title="CharGenius Home">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7">
                    <path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2z" />
                    <path d="M12 12a2 2 0 1 0-2-2" />
                    <path d="m14 14 6 6" />
                </svg>
                <span className="sr-only">CharGenius</span>
            </Link>
            <nav className="flex flex-col items-center gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    return (
                        <Tooltip key={item.labelKey}>
                            <TooltipTrigger asChild>
                                <Link href={item.href}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("rounded-lg", isActive && "bg-accent text-accent-foreground")}
                                        aria-label={t(item.labelKey)}
                                    >
                                        <item.icon className="h-5 w-5" />
                                    </Button>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={5}>{t(item.labelKey)}</TooltipContent>
                        </Tooltip>
                    );
                })}
            </nav>
        </aside>
    );
}
