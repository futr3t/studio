
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
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoIcon } from "@/components/icons/logo-icon";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PasswordChangeForm } from "@/components/auth/PasswordChangeForm";

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
  const { user, signOut } = useAuth();

  const userRole = user?.user_metadata?.role as 'admin' | 'staff' | undefined;
  const userName = user?.user_metadata?.name || user?.user_metadata?.username || user?.email?.replace('@chefcheck.local', '') || 'User';

  const navItems = userRole === 'admin' 
    ? [...navItemsBase, settingsNavItem] 
    : navItemsBase;

  return (
    <header className="sticky top-0 z-50 w-full nav-enhanced border-b">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2 text-primary flex-shrink-0">
          <ShieldCheck className="h-6 w-6 md:h-8 md:w-8" />
          <span className="font-bold text-lg md:text-xl font-headline">ChefCheck</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 py-1 h-8">
                <Avatar className="h-6 w-6">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm font-medium">{userName}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="font-medium">
                <div className="flex flex-col space-y-1">
                  <span>{userName}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {userRole === 'admin' ? 'Administrator' : 'Staff Member'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <PasswordChangeForm />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={signOut}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
