/* eslint-disable @typescript-eslint/no-unused-vars */
import { 
  ActivityIcon,
  BarChartIcon,
  BoxIcon,
  CloudIcon,
  CpuIcon,
  DatabaseIcon,
  GaugeIcon,
  GitBranchIcon,
  GlobeIcon,
  LayersIcon,

  LineChartIcon,
  LockIcon,
  LucideIcon,
  MonitorIcon,
  NetworkIcon,
  RocketIcon,
  ServerIcon,
  SettingsIcon,
  ShieldIcon,
  Sparkle,
  TerminalIcon,
  TimerIcon,
//
  UsersIcon,
  ZapIcon,
} from "lucide-react";

type Link = {
    href: string;
    label: string;
    icon: LucideIcon;
}

export const SIDEBAR_LINKS = [
  // Dashboard & Analytics
  {
    label: "Overview",
    href: "/dashboard",
    icon: BarChartIcon,
    category: "main"
  },
  {
    label: "Real-time Metrics",
    href: "/dashboard/metrics",
    icon: ActivityIcon,
    category: "main"
  },
  
  // Deployment & CI/CD
  {
    label: "Deployments",
    href: "/dashboard/deployments",
    icon: RocketIcon,
    category: "deployment"
  },
  {
    label: "Build Pipeline",
    href: "/dashboard/builds",
    icon: GitBranchIcon,
    category: "deployment"
  },
  {
    label: "Zero-Downtime Updates",
    href: "/dashboard/zero-downtime",
    icon: TimerIcon,
    category: "deployment"
  },

  // Infrastructure
  {
    label: "Edge Network",
    href: "/dashboard/edge",
    icon: GlobeIcon,
    category: "infrastructure",
    badge: "Global"
  },
  {
    label: "Container Fleet",
    href: "/dashboard/containers",
    icon: BoxIcon,
    category: "infrastructure"
  },
  {
    label: "Auto Scaling",
    href: "/dashboard/scaling",
    icon: GaugeIcon,
    category: "infrastructure",
    badge: "Smart"
  },
  {
    label: "Load Balancing",
    href: "/dashboard/load-balancing",
    icon: NetworkIcon,
    category: "infrastructure"
  },

  // Services
  {
    label: "Database Clusters",
    href: "/dashboard/databases",
    icon: DatabaseIcon,
    category: "services",
    badge: "HA"
  },
  {
    label: "Edge Functions",
    href: "/dashboard/functions",
    icon: Sparkle,
    category: "services"
  },
  {
    label: "API Gateway",
    href: "/dashboard/api",
    icon: LayersIcon,
    category: "services"
  },
  {
    label: "CDN & Caching",
    href: "/dashboard/cdn",
    icon: ZapIcon,
    category: "services"
  },

  // Security & Compliance
  {
    label: "Security Shield",
    href: "/dashboard/security",
    icon: ShieldIcon,
    category: "security",
    badge: "Pro"
  },
  {
    label: "Access Control",
    href: "/dashboard/access",
    icon: LockIcon,
    category: "security"
  },
  {
    label: "SSL Management",
    href: "/dashboard/ssl",
    icon: ShieldIcon,
    category: "security"
  },

  // Performance & Optimization
  {
    label: "Performance",
    href: "/dashboard/performance",
    icon: LineChartIcon,
    category: "optimization"
  },
  {
    label: "Resource Usage",
    href: "/dashboard/resources",
    icon: CpuIcon,
    category: "optimization"
  },

  // Infrastructure Management
  {
    label: "Infrastructure",
    href: "/dashboard/infrastructure",
    icon: ServerIcon,
    category: "platform"
  },
  {
    label: "Cloud Regions",
    href: "/dashboard/regions",
    icon: CloudIcon,
    category: "platform"
  },

  // Developer Tools
  {
    label: "CLI & SDK",
    href: "/dashboard/developers",
    icon: TerminalIcon,
    category: "developer"
  },
  {
    label: "API Console",
    href: "/dashboard/api-console",
    icon: MonitorIcon,
    category: "developer"
  },
  {
    label: "Dev Tools",
    href: "/dashboard/dev-tools",
    icon: Sparkle,
    category: "developer"
  },

  // Team & Settings
  {
    label: "Team",
    href: "/dashboard/team",
    icon: UsersIcon,
    category: "system"
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: SettingsIcon,
    category: "system"
  }
];

// You can use this to group links by category
export const SIDEBAR_CATEGORIES = {
  main: "Dashboard",
  deployment: "Deployment & CI/CD",
  infrastructure: "Infrastructure",
  services: "Services",
  security: "Security",
  optimization: "Optimization",
  platform: "Platform",
  developer: "Developer",
  system: "System"
};

export const FOOTER_LINKS = [
    {
        title: "Product",
        links: [
            { name: "Home", href: "/" },
            { name: "Features", href: "/" },
            { name: "Pricing", href: "/" },
            { name: "Contact", href: "/" },
            { name: "Download", href: "/" },
        ],
    },
    {
        title: "Resources",
        links: [
            { name: "Blog", href: "/blog" },
            { name: "Help Center", href: "/help-center" },
            { name: "Community", href: "/community" },
            { name: "Guides", href: "/guides" },
        ],
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy", href: "/privacy" },
            { name: "Terms", href: "/terms" },
            { name: "Cookies", href: "/cookies" },
        ],
    },
    {
        title: "Developers",
        links: [
            { name: "API Docs", href: "/api-docs" },
            { name: "SDKs", href: "/sdks" },
            { name: "Tools", href: "/tools" },
            { name: "Open Source", href: "/open-source" },
            { name: "Changelog", href: "/changelog" },
        ],
    },
];











