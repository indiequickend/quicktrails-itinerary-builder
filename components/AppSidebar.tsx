// components/Sidebar.tsx
import Link from "next/link";
import { useRouter } from "next/router";
import { usePathname } from 'next/navigation';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from "@/components/ui/card";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
    LayoutGrid,
    Settings2,
    ReceiptIndianRupee,
    Binoculars,
    MapPinned,
    School,
    Route
} from "lucide-react"
import { useSettings } from "@/contexts/SettingsContext";
import Image from "next/image";


interface AppSidebarProps {
    user: { name?: string; email: string; avatarUrl?: string };
    companyName?: string;
    companyLogoUrl?: string;
    onLogout: () => void;
}

export function AppSidebar({
    user,
    onLogout,
}: AppSidebarProps) {
    const { replace } = useRouter();
    const pathname = usePathname();

    const { settings } = useSettings()

    const NAV_LINKS = [
        { label: 'Home', href: '/', icon: <LayoutGrid /> },
        { label: 'Hotels', href: '/hotels', icon: <School /> },
        { label: 'Activities', href: '/activities', icon: <Binoculars /> },
        { label: 'Destinations', href: '/destinations', icon: <MapPinned /> },
        { label: 'Itineraries', href: '/itineraries', icon: <Route /> },
        { label: 'Quotations', href: '/quotations', icon: <ReceiptIndianRupee /> },
        { label: 'Settings', href: '/settings', icon: <Settings2 /> },
    ];

    return (
        <>
            <Sidebar>
                <SidebarHeader>
                    {settings?.companyName && (
                        <div className="flex flex-col items-center space-x-3 mb-4">
                            {settings?.logoUrl && (
                                <Image
                                    width={0}
                                    height={0}
                                    src={settings?.logoUrl}
                                    alt={settings?.companyName}
                                    className="object-contain w-50 mx-2"
                                />

                            )}
                            <span className="text-lg font-semibold">
                                {settings?.companyName}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center px-4 space-x-3">
                        <Avatar className="w-10 h-10 ring-2 ring-white-600">
                            <AvatarFallback>
                                {(user.name ?? user.email)[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <p className="font-semibold text-sm">
                                {user.name}
                            </p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarGroup>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {NAV_LINKS.map(({ label, href, icon }) => (
                                    <SidebarMenuItem key={label} >
                                        <SidebarMenuButton
                                            asChild
                                            className="min-w-8 duration-200 ease-linear hover:bg-primary/2 active:bg-primary/50 active:text-primary-foreground"
                                            isActive={pathname == href}
                                        >
                                            <Link href={href}>
                                                {icon}
                                                <span>{label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <Button
                                variant="outline"
                                className="w-full duration-200 ease-linear hover:bg-red-400 hover:text-white"
                                onClick={async () => {
                                    await onLogout();
                                    replace("/login");
                                }}
                            >
                                <span>Logout</span>
                            </Button>

                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>

        </>

    );
}
