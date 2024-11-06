import { 
  BarChartIcon, 
  BoxIcon, 
  CloudIcon, 
  CodeIcon, 
  CpuIcon, 
  DatabaseIcon, 
  GaugeIcon, 
  GitBranchIcon, 
  GlobeIcon, 
  LayersIcon, 
 
  LockIcon, 
  RocketIcon, 
  ServerIcon, 
  ShieldIcon, 
  Sparkle, 
  SparklesIcon,
  WrenchIcon
} from "lucide-react";

export const NAV_LINKS = [
  {
    title: "Platform",
    href: "/dashboard/platform",
    menu: [
      {
        title: "Edge Deployments",
        tagline: "Deploy globally in milliseconds with our edge network",
        href: "/dashboard/platform/edge",
        icon: Sparkle,
      },
      {
        title: "Auto Scaling",
        tagline: "Automatic scaling based on real-time demand",
        href: "/dashboard/platform/scaling",
        icon: GaugeIcon,
      },
      {
        title: "Container Orchestration",
        tagline: "Advanced container management and deployment",
        href: "/dashboard/platform/containers",
        icon: BoxIcon,
      },
      {
        title: "Zero-Downtime Updates",
        tagline: "Deploy updates without interruption",
        href: "/dashboard/platform/zero-downtime",
        icon: RocketIcon,
      },
    ],
  },
  {
    title: "Features",
    href: "/dashboard/features",
    menu: [
      {
        title: "Global CDN",
        tagline: "Ultra-fast content delivery worldwide",
        href: "/dashboard/features/cdn",
        icon: GlobeIcon,
      },
      {
        title: "Build Pipeline",
        tagline: "Optimized build system for any framework",
        href: "/dashboard/features/builds",
        icon: GitBranchIcon,
      },
      {
        title: "Security Shield",
        tagline: "Enterprise-grade security and DDoS protection",
        href: "/dashboard/features/security",
        icon: ShieldIcon,
      },
      {
        title: "Database Clusters",
        tagline: "Managed database solutions with auto-scaling",
        href: "/dashboard/features/databases",
        icon: DatabaseIcon,
      },
    ],
  },
  {
    title: "Solutions",
    href: "/dashboard/solutions",
    menu: [
      {
        title: "Framework Optimization",
        tagline: "Tailored solutions for Next.js, Remix, and more",
        href: "/dashboard/solutions/frameworks",
        icon: SparklesIcon,
      },
      {
        title: "Infrastructure",
        tagline: "Enterprise-grade cloud infrastructure",
        href: "/dashboard/solutions/infrastructure",
        icon: ServerIcon,
      },
      {
        title: "Edge Computing",
        tagline: "Serverless functions at the edge",
        href: "/dashboard/solutions/edge-computing",
        icon: CpuIcon,
      },
      {
        title: "API Gateway",
        tagline: "Managed API routing and protection",
        href: "/dashboard/solutions/api-gateway",
        icon: LayersIcon,
      },
    ],
  },
  {
    title: "Enterprise",
    href: "/dashboard/enterprise",
    menu: [
      {
        title: "Custom Solutions",
        tagline: "Tailored enterprise deployment solutions",
        href: "/dashboard/enterprise/solutions",
        icon: WrenchIcon,
      },
      {
        title: "Security & Compliance",
        tagline: "Enterprise security and regulatory compliance",
        href: "/dashboard/enterprise/security",
        icon: LockIcon,
      },
      {
        title: "Analytics",
        tagline: "Advanced metrics and performance insights",
        href: "/dashboard/enterprise/analytics",
        icon: BarChartIcon,
      },
      {
        title: "Private Cloud",
        tagline: "Dedicated infrastructure solutions",
        href: "/dashboard/enterprise/private-cloud",
        icon: CloudIcon,
      },
    ],
  },
  {
    title: "Developers",
    href: "/dashboard/developers",
    menu: [
      {
        title: "Documentation",
        tagline: "Comprehensive guides and API references",
        href: "/dashboard/developers/docs",
        icon: CodeIcon,
      },
      {
        title: "CLI Tools",
        tagline: "Powerful command-line deployment tools",
        href: "/dashboard/developers/cli",
        icon: CodeIcon,
      },
      {
        title: "API Reference",
        tagline: "Full API documentation and examples",
        href: "/dashboard/developers/api",
        icon: CodeIcon,
      },
    ],
  },
  {
    title: "Pricing",
    href: "/dashboard/pricing",
  },
  {
    title: "Status",
    href: "/dashboard/status",
  }
];
