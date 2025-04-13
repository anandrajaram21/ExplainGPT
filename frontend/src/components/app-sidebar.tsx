"use client";

import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  Brain,
  ChartBar,
  Code,
  MessageSquare,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { ModelSelector } from "@/components/model-selector";

// Menu items.
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Attention",
    url: "/attention",
    icon: Brain,
  },
  {
    title: "Token Probs",
    url: "/token-probs",
    icon: ChartBar,
  },
  {
    title: "Playground",
    url: "/playground",
    icon: Code,
  },
  {
    title: "Chat",
    url: "/chat",
    icon: MessageSquare,
  },
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (url: string) => {
    router.push(url);
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <ModeToggle />
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    onClick={() => handleNavigation(item.url)}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarGroupContent>
            <ModelSelector />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
