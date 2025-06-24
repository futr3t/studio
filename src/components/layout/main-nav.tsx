
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Factory,
  Truck,
  Thermometer,
  Sparkles,
  SettingsIcon,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/icons/logo-icon";
import { useData } from "@/context/DataContext";

const navItemsBase = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/production", label: "Production", icon: Factory },
  { href: "/deliveries", label: "Deliveries", icon: Truck },
  { href: "/temperatures", label: "Temperatures", icon: Thermometer },
  { href: "/cleaning", label: "Cleaning", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: FileText },
];

const settingsNavItem = { href: "/settings", label: "Settings", icon: SettingsIcon };

export function MainNav() {
  const pathname = usePathname();
  const { currentUser } = useData();

  const navItems = currentUser?.role === 'admin' 
    ? [...navItemsBase, settingsNavItem] 
    : navItemsBase;

  return (
    <header className="sticky top-0 z-50 w-full nav-enhanced border-b">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2 text-primary flex-shrink-0">
          <ShieldCheck className="h-6 w-6 md:h-8 md:w-8" />
          <span className="font-bold text-lg md:text-xl font-headline">ChefCheck</span>
        </Link>
        <nav className="flex items-center gap-1 ml-2 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "text-xs md:text-sm font-medium transition-all duration-200 flex-shrink-0 px-2 md:px-3 button-enhanced",
                pathname === item.href
                  ? "text-primary hover:text-primary bg-primary/10 border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/50"
              )}
            >
              <Link href={item.href} className="flex items-center">
                <item.icon className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
