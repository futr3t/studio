
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6 md:px-8">
        <Link href="/" className="flex items-center space-x-2 text-primary">
          <ShieldCheck className="h-8 w-8" />
          <span className="font-bold text-xl font-headline">ChefCheck</span>
        </Link>
        <nav className="flex items-center space-x-1 ml-6"> {/* Added ml-6 for spacing */}
          {navItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === item.href
                  ? "text-primary hover:text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
