import { BarChart3, Building2, ChevronDown, DollarSign, FileSpreadsheet, FolderKanban, Home, PieChart, Users, Wallet, LineChart, UserCircle2, Calculator, BookOpen, ArrowLeftRight, BarChart2, Target, Users2, Receipt, Coins, Share2, FileText } from "lucide-react"
import Image from "next/image"
import logoLight from '@/images/company/logo-v7-black.png'
import logoDark from '@/images/company/logo-v7-white.png'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shadcnui/components/ui/avatar'
import Link from 'next/link'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarFooter,
} from "@/modules/shadcnui/components/ui/sidebar"

const menuItems = [
  {
    label: "Dashboard",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: Home
      }
    ]
  },
  {
    label: "Cap Table",
    items: [
      {
        label: "My Cap Table",
        href: "/dashboard/cap-table/my",
        icon: PieChart
      },
      {
        label: "Rounds",
        href: "/dashboard/cap-table/rounds",
        icon: Target
      },
      {
        label: "Shareholders",
        href: "/dashboard/cap-table/shareholders",
        icon: Users
      },
      {
        label: "Securities",
        href: "/dashboard/cap-table/securities",
        icon: Share2
      },
      {
        label: "Stock Options",
        href: "/dashboard/cap-table/stock-options",
        icon: ArrowLeftRight
      },
      {
        label: "Transactions",
        href: "/dashboard/cap-table/transactions",
        icon: Receipt
      }
    ]
  },
  {
    label: "Companies",
    items: [
      {
        label: "All Companies",
        href: "/dashboard/companies",
        icon: Building2
      },
      {
        label: "Income Statement",
        href: "/dashboard/companies/financials/income",
        icon: FileSpreadsheet
      },
      {
        label: "Balance Sheet",
        href: "/dashboard/companies/financials/balance",
        icon: FileSpreadsheet
      },
      {
        label: "Cash Flow",
        href: "/dashboard/companies/financials/cash-flow",
        icon: FileSpreadsheet
      },
      {
        label: "Revenue Metrics",
        href: "/dashboard/companies/metrics/revenue",
        icon: LineChart
      },
      {
        label: "Customer Metrics",
        href: "/dashboard/companies/metrics/customer",
        icon: Users2
      },
      {
        label: "Operational Metrics",
        href: "/dashboard/companies/metrics/operational",
        icon: BarChart2
      }
    ]
  },
  {
    label: "Portfolio",
    items: [
      {
        label: "Investments",
        href: "/dashboard/portfolio/investments",
        icon: Wallet
      },
      {
        label: "Cash Flow",
        href: "/dashboard/portfolio/cash-flow",
        icon: DollarSign
      },
      {
        label: "Fees",
        href: "/dashboard/portfolio/fees",
        icon: Coins
      }
    ]
  }
]

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex h-[60px] items-center px-6">
        <div className='flex items-center'>
          <Link href='/dashboard' className='flex items-center justify-center px-4'>
            <Image
              src={logoLight}
              alt='V7 Capital'
              width={120}
              height={32}
              className='block dark:hidden'
            />
            <Image
              src={logoDark}
              alt='V7 Capital'
              width={120}
              height={32}
              className='hidden dark:block'
            />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild>
                      <a href={item.href}>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href="/settings">
                <UserCircle2 className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
} 