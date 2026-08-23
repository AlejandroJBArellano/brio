"use client";

import {
  Baby,
  Banknote,
  BookOpen,
  Briefcase,
  Building2,
  Car,
  Clapperboard,
  Coffee,
  Coins,
  CreditCard,
  Dog,
  DollarSign,
  Dumbbell,
  Gamepad2,
  Gift,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  Music,
  Palette,
  PiggyBank,
  Pill,
  Plane,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tag,
  Utensils,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";
import React from "react";

// Map of canonical icon keys & common emojis to Lucide React components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  // Accounts / Financial
  "credit-card": CreditCard,
  "credit": CreditCard,
  "💳": CreditCard,
  "landmark": Landmark,
  "bank": Landmark,
  "🏦": Landmark,
  "🏛️": Landmark,
  "banknote": Banknote,
  "cash": Banknote,
  "💵": Banknote,
  "money": Banknote,
  "💰": Coins,
  "coins": Coins,
  "piggy-bank": PiggyBank,
  "wallet": Wallet,
  "building": Building2,
  "building-2": Building2,
  "🏢": Building2,
  "briefcase": Briefcase,
  "💼": Briefcase,
  "smartphone": Smartphone,
  "📱": Smartphone,

  // Categories
  "utensils": Utensils,
  "food": Utensils,
  "restaurant": Utensils,
  "🍔": Utensils,
  "🍣": Utensils,
  "coffee": Coffee,
  "cafe": Coffee,
  "☕": Coffee,
  "car": Car,
  "transport": Car,
  "🚗": Car,
  "home": Home,
  "house": Home,
  "🏠": Home,
  "laptop": Laptop,
  "tech": Laptop,
  "💻": Laptop,
  "pill": Pill,
  "health": Pill,
  "pharmacy": Pill,
  "💊": Pill,
  "shopping-bag": ShoppingBag,
  "shopping": ShoppingBag,
  "🛍️": ShoppingBag,
  "receipt": Receipt,
  "services": Receipt,
  "bills": Receipt,
  "dog": Dog,
  "pets": Dog,
  "🐾": Dog,
  "plane": Plane,
  "travel": Plane,
  "✈️": Plane,
  "book-open": BookOpen,
  "education": BookOpen,
  "books": BookOpen,
  "📚": BookOpen,
  "dumbbell": Dumbbell,
  "fitness": Dumbbell,
  "gym": Dumbbell,
  "🏋️": Dumbbell,
  "gamepad-2": Gamepad2,
  "games": Gamepad2,
  "gaming": Gamepad2,
  "🎮": Gamepad2,
  "zap": Zap,
  "electricity": Zap,
  "energy": Zap,
  "⚡": Zap,
  "clapperboard": Clapperboard,
  "entertainment": Clapperboard,
  "cinema": Clapperboard,
  "movies": Clapperboard,
  "🍿": Clapperboard,
  "gift": Gift,
  "gifts": Gift,
  "🎁": Gift,
  "baby": Baby,
  "family": Baby,
  "👶": Baby,
  "sparkles": Sparkles,
  "beauty": Sparkles,
  "care": Sparkles,
  "✨": Sparkles,
  "wrench": Wrench,
  "tools": Wrench,
  "maintenance": Wrench,
  "🛠️": Wrench,
  "heart-pulse": HeartPulse,
  "medical": HeartPulse,
  "🩺": HeartPulse,
  "music": Music,
  "audio": Music,
  "🎸": Music,
  "palette": Palette,
  "art": Palette,
  "🎨": Palette,
  "tag": Tag,
  "🏷️": Tag,
  "shield": ShieldCheck,
  "dollar": DollarSign,
};

export interface FinanceIconProps {
  icon?: string | null;
  className?: string;
  defaultIcon?: React.ComponentType<{ className?: string }>;
}

export function FinanceIcon({
  icon,
  className = "h-4 w-4",
  defaultIcon: DefaultIcon = Tag,
}: FinanceIconProps) {
  if (!icon) {
    return <DefaultIcon className={className} />;
  }

  const key = icon.trim().toLowerCase();
  const IconComponent = ICON_MAP[key] || ICON_MAP[icon.trim()];

  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // If it's a raw single or multi-byte unicode emoji that wasn't mapped, render span with text
  if (/\p{Extended_Pictographic}/u.test(icon)) {
    return <span className="inline-block leading-none text-base select-none">{icon}</span>;
  }

  return <DefaultIcon className={className} />;
}

// Predefined Icon Sets for Account and Category Pickers
export const LUCIDE_ACCOUNT_ICONS = [
  { id: "credit-card", label: "Tarjeta de Crédito", icon: CreditCard },
  { id: "landmark", label: "Banco / Débito", icon: Landmark },
  { id: "banknote", label: "Efectivo", icon: Banknote },
  { id: "wallet", label: "Billetera", icon: Wallet },
  { id: "building-2", label: "Institución / Corporativa", icon: Building2 },
  { id: "briefcase", label: "Negocio / Empresa", icon: Briefcase },
  { id: "coins", label: "Ahorros / Monedas", icon: Coins },
  { id: "piggy-bank", label: "Alcancía", icon: PiggyBank },
  { id: "smartphone", label: "Billetera Digital", icon: Smartphone },
];

export const LUCIDE_CATEGORY_ICONS = [
  { id: "utensils", label: "Comida / Restaurantes", icon: Utensils },
  { id: "coffee", label: "Café / Antojos", icon: Coffee },
  { id: "shopping-bag", label: "Compras / Supermercado", icon: ShoppingBag },
  { id: "car", label: "Transporte / Auto", icon: Car },
  { id: "home", label: "Hogar / Renta", icon: Home },
  { id: "receipt", label: "Servicios / Facturas", icon: Receipt },
  { id: "zap", label: "Electricidad / Luz", icon: Zap },
  { id: "laptop", label: "Tecnología / Software", icon: Laptop },
  { id: "pill", label: "Farmacia / Salud", icon: Pill },
  { id: "heart-pulse", label: "Médico / Clínica", icon: HeartPulse },
  { id: "dumbbell", label: "Gimnasio / Deporte", icon: Dumbbell },
  { id: "dog", label: "Mascotas", icon: Dog },
  { id: "plane", label: "Viajes / Vuelos", icon: Plane },
  { id: "book-open", label: "Educación / Libros", icon: BookOpen },
  { id: "clapperboard", label: "Cine / Streaming", icon: Clapperboard },
  { id: "gamepad-2", label: "Juegos / Gaming", icon: Gamepad2 },
  { id: "music", label: "Música / Eventos", icon: Music },
  { id: "gift", label: "Regalos", icon: Gift },
  { id: "sparkles", label: "Cuidado Personal", icon: Sparkles },
  { id: "wrench", label: "Mantenimiento / Taller", icon: Wrench },
  { id: "baby", label: "Familia / Niños", icon: Baby },
  { id: "palette", label: "Arte / Creatividad", icon: Palette },
  { id: "shield", label: "Seguros / Protección", icon: ShieldCheck },
  { id: "tag", label: "Otros / General", icon: Tag },
];
