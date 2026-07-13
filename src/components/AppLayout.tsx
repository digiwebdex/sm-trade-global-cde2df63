import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, FileText, FilePlus, Truck,
  Settings, LogOut, UserCog, Database
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const navItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Customers', url: '/customers', icon: Users },
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Bill', url: '/invoices', icon: FileText },
  { title: 'Quotations', url: '/quotations', icon: FilePlus },
  { title: 'Challans', url: '/challans', icon: Truck },
];

const adminItems = [
  { title: 'User Management', url: '/users', icon: UserCog },
  { title: 'Company Settings', url: '/settings', icon: Settings },
  { title: 'Backups', url: '/backups', icon: Database },
];

function AppSidebarContent() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileNav = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0 no-print">
      <div className="p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="text-center">
            <h2 className="text-sm font-bold text-sidebar-foreground leading-tight">S. M. Trade</h2>
            <p className="text-xs text-sidebar-foreground/70">International</p>
          </div>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      onClick={closeMobileNav}
                      className="hover:bg-sidebar-accent/50 text-sidebar-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {(!collapsed || isMobile) && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
              Admin
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        onClick={closeMobileNav}
                        className="hover:bg-sidebar-accent/50 text-sidebar-foreground"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {(!collapsed || isMobile) && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <div className="mt-auto p-3 border-t border-sidebar-border">
        {(!collapsed || isMobile) && (
          <div className="mb-2 px-2">
            <p className="text-xs text-sidebar-foreground/70 truncate">{user?.name}</p>
            <p className="text-xs text-sidebar-primary capitalize">{user?.role}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full text-sidebar-foreground hover:bg-sidebar-accent/50 justify-start"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {(!collapsed || isMobile) && 'Logout'}
        </Button>
      </div>
    </Sidebar>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full max-w-[100vw] overflow-x-hidden">
        <AppSidebarContent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-card px-3 sm:px-4 no-print sticky top-0 z-30">
            <SidebarTrigger className="mr-2 sm:mr-4 shrink-0" />
            <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate">
              S. M. Trade International
            </h1>
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto min-w-0">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
