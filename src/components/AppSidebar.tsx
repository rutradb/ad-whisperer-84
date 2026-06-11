import { useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  LayoutDashboard, Megaphone, Layers, FileText, Image, Film,
  Users, Target, Settings, Calculator, Zap, Activity, PenTool,
  Clock, FlaskConical, ShieldCheck, Bell, BarChart3,
  Bot, ChevronDown, BookOpen, Plug, Store,
  Search, Lightbulb, Radar, Gauge, ListChecks,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = { title: string; url: string; icon: React.ElementType };

const groups: { label: string; icon: React.ElementType; items: NavItem[] }[] = [
  {
    label: "Visao Geral",
    icon: LayoutDashboard,
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Gestao",
    icon: Megaphone,
    items: [
      { title: "Campanhas", url: "/campaigns", icon: Megaphone },
      { title: "Grupos de Anuncios", url: "/adsets", icon: Layers },
      { title: "Anuncios", url: "/ads", icon: FileText },
      { title: "Palavras-chave", url: "/keywords", icon: Search },
      { title: "Assets", url: "/assets", icon: Image },
    ],
  },
  {
    label: "Biblioteca",
    icon: Film,
    items: [
      { title: "Publicos", url: "/audiences", icon: Users },
      { title: "Segmentacao", url: "/targeting", icon: Target },
      { title: "Conversoes", url: "/conversions", icon: Activity },
    ],
  },
  {
    label: "Inteligencia",
    icon: Bot,
    items: [
      { title: "Assistente IA", url: "/ai/agent", icon: Bot },
      { title: "Acoes da IA", url: "/ai/actions", icon: ListChecks },

      { title: "Otimizador", url: "/ai/optimizer", icon: Zap },
      { title: "Diagnostico", url: "/ai/diagnostic", icon: Activity },
      { title: "Varredura Estrategica", url: "/ai/strategic-scan", icon: Radar },
      { title: "Escala", url: "/ai/scale-calculator", icon: Calculator },
      { title: "Copy", url: "/ai/copy-generator", icon: PenTool },
      { title: "Regras Auto", url: "/ai/rules", icon: ShieldCheck },
      { title: "Estrategia IA", url: "/ai/strategy", icon: BookOpen },
      { title: "Testes A/B", url: "/ai/ab-test", icon: FlaskConical },
    ],
  },
  {
    label: "CRM & E-commerce",
    icon: Store,
    items: [
      { title: "CRM & E-commerce", url: "/crm", icon: Store },
      { title: "Integracoes", url: "/integrations", icon: Plug },
    ],
  },
  {
    label: "Monitoramento",
    icon: BarChart3,
    items: [
      { title: "Relatorios", url: "/reports", icon: BarChart3 },
      { title: "Historico", url: "/activity", icon: Clock },
      { title: "Auditoria IA", url: "/ai/audit", icon: Gauge },
    ],
  },
];

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.03, type: "spring" as const, stiffness: 300, damping: 24 },
  }),
};

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const activeGroupIndex = groups.findIndex((g) =>
    g.items.some((item) => pathname.startsWith(item.url))
  );

  const [openGroups, setOpenGroups] = useState<boolean[]>(
    () => groups.map((_, i) => i === activeGroupIndex || (activeGroupIndex === -1 && i === 0))
  );

  const toggleGroup = (i: number) => {
    setOpenGroups((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const renderItem = (item: NavItem, index: number) => {
    const isActive = pathname.startsWith(item.url);

    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild tooltip={collapsed ? item.title : undefined}>
          <NavLink
            to={item.url}
            end
            className={cn(
              "relative flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm font-medium",
              "text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-white/10",
              "transition-colors duration-150",
            )}
            activeClassName="!text-sidebar-foreground !bg-white/10"
          >
            {/* Animated active indicator pill */}
            {isActive && (
              <motion.div
                layoutId="sidebar-active-pill"
                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-white"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <motion.div
              className="flex w-full items-center gap-2.5"
              whileHover={{ x: 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <item.icon className={cn("h-4 w-4 shrink-0 text-sidebar-foreground", isActive && "text-sidebar-foreground")} />
              {!collapsed && <span className="truncate text-sidebar-foreground">{item.title}</span>}
            </motion.div>
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="sidebar-glass flex flex-col gap-0">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className={cn(
            "flex items-center gap-3 border-b border-white/10 px-4 py-4 shrink-0",
            collapsed && "justify-center"
          )}
        >
          <motion.div
            whileHover={{ scale: 1.08, rotate: 2 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 font-display text-sm font-bold text-white shadow-accent-glow"
          >
            G
          </motion.div>
          {!collapsed && (
            <div className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-bold tracking-tight text-white">Google Ads</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-white/75">Manager</span>
            </div>
          )}
        </motion.div>

        {/* Accordion nav */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {groups.map((group, gi) => {
            const isOpen = openGroups[gi];
            const GroupIcon = group.icon;
            const hasActive = group.items.some((item) => pathname.startsWith(item.url));

            return (
              <div key={group.label} className="mb-0.5">
                {/* Group header */}
                <motion.button
                  whileHover={{ x: collapsed ? 0 : 2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => !collapsed && toggleGroup(gi)}
                  className={cn(
                    "w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold",
                    "select-none transition-colors duration-150",
                    collapsed ? "justify-center" : "justify-between",
                    hasActive
                      ? "text-white"
                      : "text-white/80 hover:bg-white/5 hover:text-white",
                  )}
                  title={collapsed ? group.label : undefined}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <GroupIcon className="h-4 w-4 shrink-0 text-white" />
                    {!collapsed && (
                      <span className="truncate text-[11px] font-bold uppercase tracking-widest text-white/90">
                        {group.label}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <motion.div
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-white/80" />
                    </motion.div>
                  )}
                </motion.button>

                {/* Collapsible items */}
                {!collapsed && (
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{ overflow: "hidden" }}
                      >
                        <SidebarMenu className="pl-2 pb-1">
                          {group.items.map((item, i) => (
                            <motion.div
                              key={item.url}
                              custom={i}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                            >
                              {renderItem(item, i)}
                            </motion.div>
                          ))}
                        </SidebarMenu>
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}

                {/* Collapsed: show items directly */}
                {collapsed && (
                  <SidebarMenu>
                    {group.items.map((item, i) => renderItem(item, i))}
                  </SidebarMenu>
                )}
              </div>
            );
          })}
        </div>

        {/* Settings -- pinned to bottom */}
        <div className="shrink-0 px-2 py-3 border-t border-border/20">
          <SidebarMenu>
            {renderItem({ title: "Configuracoes", url: "/settings", icon: Settings }, 0)}
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
