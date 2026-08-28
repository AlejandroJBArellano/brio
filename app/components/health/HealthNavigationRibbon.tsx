"use client";

import { Dumbbell, Flame, FlaskConical, Salad } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface HealthNavTab {
  href: string;
  label: string;
  icon: typeof Flame;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
  iconColor: string;
}

const TABS: HealthNavTab[] = [
  {
    href: "/health",
    label: "Ritmo & Hábitos",
    icon: Flame,
    activeColor: "text-[#121110]",
    activeBg: "bg-[#D99B43]",
    activeBorder: "border-[#D99B43]",
    iconColor: "text-[#D99B43]",
  },
  {
    href: "/health/training",
    label: "Entrenamiento",
    icon: Dumbbell,
    activeColor: "text-[#121110]",
    activeBg: "bg-[#D99B43]",
    activeBorder: "border-[#D99B43]",
    iconColor: "text-[#D99B43]",
  },
  {
    href: "/health/nutrition",
    label: "Nutrición",
    icon: Salad,
    activeColor: "text-[#121110]",
    activeBg: "bg-[#7EA35A]",
    activeBorder: "border-[#7EA35A]",
    iconColor: "text-[#7EA35A]",
  },
  {
    href: "/health/biometrics",
    label: "Biometría & Labs",
    icon: FlaskConical,
    activeColor: "text-[#121110]",
    activeBg: "bg-[#4EAB9E]",
    activeBorder: "border-[#4EAB9E]",
    iconColor: "text-[#4EAB9E]",
  },
];

export function HealthNavigationRibbon() {
  const pathname = usePathname();

  const isTabActive = (href: string) => {
    if (href === "/health") {
      return pathname === "/health";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-xl border border-[#2A2723] bg-[#181715] shadow-xs">
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[#121110] border border-[#2A2723]">
        {TABS.map((tab) => {
          const active = isTabActive(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? `${tab.activeBg} ${tab.activeColor} font-bold shadow-xs`
                  : "text-[#8E867B] hover:text-[#DDD6C9] hover:bg-[#22201D]"
              }`}
            >
              <Icon
                className={`h-3.5 w-3.5 ${
                  active ? "text-[#121110]" : tab.iconColor
                }`}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
