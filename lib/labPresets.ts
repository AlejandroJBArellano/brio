/**
 * Catálogo de Biomarcadores y metadatos clínicos para el dashboard de salud de Brio OS.
 */

import { BiomarkerCategoryKey } from "./types";

export interface BiomarkerCategoryMeta {
  key: BiomarkerCategoryKey;
  label: string;
  shortLabel: string;
  icon: string;
  color: string; // Tailwind color token
  description: string;
}

export const BIOMARKER_CATEGORIES_META: Record<BiomarkerCategoryKey, BiomarkerCategoryMeta> = {
  renal: {
    key: "renal",
    label: "Función Renal & Electrolitos",
    shortLabel: "Renal",
    icon: "Activity",
    color: "cyan",
    description: "Filtración glomerular, equilibrio hidroelectrolítico, glucosa y urea.",
  },
  cardio: {
    key: "cardio",
    label: "Riesgo Cardiovascular & Perfil Lipídico",
    shortLabel: "Cardiovascular",
    icon: "Heart",
    color: "rose",
    description: "Colesterol total, HDL, LDL directo, triglicéridos, sd-LDL y PCR ultrasensible.",
  },
  hepatic: {
    key: "hepatic",
    label: "Funcionamiento Hepático & Enzimas",
    shortLabel: "Hepático",
    icon: "Sparkles",
    color: "amber",
    description: "Transaminasas (AST, ALT), GGT, albúmina, fosfatasa alcalina y LDH.",
  },
  iron: {
    key: "iron",
    label: "Metabolismo de Hierro",
    shortLabel: "Hierro",
    icon: "Zap",
    color: "blue",
    description: "Hierro sérico, capacidad de fijación (UIBC, TIBC) y porcentaje de saturación.",
  },
  immuno: {
    key: "immuno",
    label: "Respuesta Inmunológica",
    shortLabel: "Inmunología",
    icon: "Shield",
    color: "indigo",
    description: "Inmunoglobulinas humorales IgG, IgA e IgM en suero.",
  },
  hematology: {
    key: "hematology",
    label: "Biometría Hemática Completa",
    shortLabel: "Hematología",
    icon: "Droplet",
    color: "red",
    description: "Serie roja (hemoglobina, hematócrito, eritrocitos), plaquetas y serie blanca diferencial.",
  },
  urinalysis: {
    key: "urinalysis",
    label: "Examen General de Orina (EGO)",
    shortLabel: "Orina (EGO)",
    icon: "FlaskConical",
    color: "yellow",
    description: "Parámetros físicos, químicos y sedimento microscópico.",
  },
};

export interface BiomarkerTemplate {
  category: BiomarkerCategoryKey;
  name: string;
  code?: string;
  unit?: string;
  refMin?: number;
  refMax?: number;
  refText?: string;
  notes?: string;
}

/**
 * Plantilla estándar de biomarcadores comunes para registro de estudios de laboratorio clínico.
 */
export const DEFAULT_BIOMARKER_TEMPLATES: BiomarkerTemplate[] = [
  // 1. RENAL & METABÓLICO
  { category: "renal", name: "Glucosa en Suero", code: "GLU", unit: "mg/dL", refMin: 70, refMax: 99, refText: "70 - 99 mg/dL" },
  { category: "renal", name: "Nitrógeno de Urea (BUN)", code: "BUN", unit: "mg/dL", refMin: 6.5, refMax: 23.4, refText: "6.5 - 23.4 mg/dL" },
  { category: "renal", name: "Urea", code: "UREA", unit: "mg/dL", refMin: 14, refMax: 50, refText: "14 - 50 mg/dL" },
  { category: "renal", name: "Creatinina en Suero", code: "CREAT", unit: "mg/dL", refMin: 0.7, refMax: 1.3, refText: "0.7 - 1.3 mg/dL" },
  { category: "renal", name: "Tasa de Filtración Glomerular (TFGe)", code: "TFGE", unit: "mL/min/1.73m2", refMin: 90, refMax: 150, refText: ">= 90 mL/min/1.73m2" },
  { category: "renal", name: "Ácido Úrico", code: "AC_URICO", unit: "mg/dL", refMin: 3.5, refMax: 7.2, refText: "3.5 - 7.2 mg/dL" },
  { category: "renal", name: "Sodio Sérico", code: "NA", unit: "mEq/L", refMin: 136, refMax: 145, refText: "136 - 145 mEq/L" },
  { category: "renal", name: "Potasio Sérico", code: "K", unit: "mEq/L", refMin: 3.5, refMax: 5.1, refText: "3.5 - 5.1 mEq/L" },
  { category: "renal", name: "Cloro Sérico", code: "CL", unit: "mEq/L", refMin: 98, refMax: 107, refText: "98 - 107 mEq/L" },
  { category: "renal", name: "Calcio Total", code: "CA", unit: "mg/dL", refMin: 8.6, refMax: 10.2, refText: "8.6 - 10.2 mg/dL" },
  { category: "renal", name: "Fósforo Sérico", code: "PHOS", unit: "mg/dL", refMin: 2.5, refMax: 4.5, refText: "2.5 - 4.5 mg/dL" },
  { category: "renal", name: "Magnesio Sérico", code: "MG", unit: "mg/dL", refMin: 1.6, refMax: 2.6, refText: "1.6 - 2.6 mg/dL" },

  // 2. CARDIOVASCULAR & LIPÍDICO
  { category: "cardio", name: "Colesterol Total", code: "CHOL", unit: "mg/dL", refMin: 100, refMax: 200, refText: "< 200 mg/dL" },
  { category: "cardio", name: "Colesterol HDL (Bueno)", code: "HDL", unit: "mg/dL", refMin: 40, refMax: 80, refText: "> 40 mg/dL" },
  { category: "cardio", name: "Colesterol LDL Calculado", code: "LDL", unit: "mg/dL", refMin: 50, refMax: 100, refText: "< 100 mg/dL" },
  { category: "cardio", name: "Colesterol No-HDL", code: "NO_HDL", unit: "mg/dL", refMin: 50, refMax: 130, refText: "< 130 mg/dL" },
  { category: "cardio", name: "Triglicéridos", code: "TRIG", unit: "mg/dL", refMin: 30, refMax: 150, refText: "< 150 mg/dL" },
  { category: "cardio", name: "Proteína C Reactiva Ultrasensible (hs-CRP)", code: "HS_CRP", unit: "mg/L", refMin: 0, refMax: 1.0, refText: "< 1.0 mg/L" },
  { category: "cardio", name: "Índice Aterogénico (Col/HDL)", code: "IND_AT", unit: "ratio", refMin: 2.0, refMax: 4.5, refText: "< 4.5" },

  // 3. HEPÁTICO & ENZIMAS
  { category: "hepatic", name: "TGO / AST (Aspartato Aminotransferasa)", code: "AST", unit: "U/L", refMin: 10, refMax: 40, refText: "10 - 40 U/L" },
  { category: "hepatic", name: "TGP / ALT (Alanina Aminotransferasa)", code: "ALT", unit: "U/L", refMin: 10, refMax: 41, refText: "10 - 41 U/L" },
  { category: "hepatic", name: "GGT (Gamma Glutamil Transferasa)", code: "GGT", unit: "U/L", refMin: 8, refMax: 61, refText: "8 - 61 U/L" },
  { category: "hepatic", name: "Fosfatasa Alcalina (ALP)", code: "ALP", unit: "U/L", refMin: 40, refMax: 129, refText: "40 - 129 U/L" },
  { category: "hepatic", name: "Bilirrubina Total", code: "TBIL", unit: "mg/dL", refMin: 0.2, refMax: 1.2, refText: "0.2 - 1.2 mg/dL" },
  { category: "hepatic", name: "Bilirrubina Directa", code: "DBIL", unit: "mg/dL", refMin: 0.0, refMax: 0.3, refText: "0.0 - 0.3 mg/dL" },
  { category: "hepatic", name: "Proteínas Totales", code: "PROT_TOT", unit: "g/dL", refMin: 6.4, refMax: 8.3, refText: "6.4 - 8.3 g/dL" },
  { category: "hepatic", name: "Albúmina en Suero", code: "ALB", unit: "g/dL", refMin: 3.5, refMax: 5.2, refText: "3.5 - 5.2 g/dL" },
  { category: "hepatic", name: "Deshidrogenasa Láctica (LDH)", code: "LDH", unit: "U/L", refMin: 125, refMax: 220, refText: "125 - 220 U/L" },

  // 4. METABOLISMO DE HIERRO
  { category: "iron", name: "Hierro Sérico", code: "FE", unit: "mcg/dL", refMin: 65, refMax: 175, refText: "65 - 175 mcg/dL" },
  { category: "iron", name: "Capacidad Total de Fijación (TIBC)", code: "TIBC", unit: "mcg/dL", refMin: 250, refMax: 450, refText: "250 - 450 mcg/dL" },
  { category: "iron", name: "Porcentaje de Saturación de Transferrina", code: "SAT_FE", unit: "%", refMin: 20, refMax: 50, refText: "20 - 50 %" },
  { category: "iron", name: "Ferritina Sérica", code: "FERR", unit: "ng/mL", refMin: 30, refMax: 400, refText: "30 - 400 ng/mL" },

  // 5. INMUNOLOGÍA
  { category: "immuno", name: "Inmunoglobulina G (IgG)", code: "IGG", unit: "mg/dL", refMin: 700, refMax: 1600, refText: "700 - 1600 mg/dL" },
  { category: "immuno", name: "Inmunoglobulina A (IgA)", code: "IGA", unit: "mg/dL", refMin: 70, refMax: 400, refText: "70 - 400 mg/dL" },
  { category: "immuno", name: "Inmunoglobulina M (IgM)", code: "IGM", unit: "mg/dL", refMin: 40, refMax: 230, refText: "40 - 230 mg/dL" },

  // 6. BIOMETRÍA HEMÁTICA
  { category: "hematology", name: "Hemoglobina", code: "HGB", unit: "g/dL", refMin: 13.8, refMax: 17.2, refText: "13.8 - 17.2 g/dL" },
  { category: "hematology", name: "Hematocrito", code: "HCT", unit: "%", refMin: 40, refMax: 52, refText: "40 - 52 %" },
  { category: "hematology", name: "Eritrocitos (Glóbulos Rojos)", code: "RBC", unit: "M/uL", refMin: 4.5, refMax: 5.9, refText: "4.5 - 5.9 M/uL" },
  { category: "hematology", name: "Leucocitos Totales (Glóbulos Blancos)", code: "WBC", unit: "k/uL", refMin: 4.5, refMax: 11.0, refText: "4.5 - 11.0 k/uL" },
  { category: "hematology", name: "Plaquetas", code: "PLT", unit: "k/uL", refMin: 150, refMax: 450, refText: "150 - 450 k/uL" },
  { category: "hematology", name: "Neutrófilos %", code: "NEUT_PCT", unit: "%", refMin: 40, refMax: 70, refText: "40 - 70 %" },
  { category: "hematology", name: "Linfocitos %", code: "LYMPH_PCT", unit: "%", refMin: 20, refMax: 45, refText: "20 - 45 %" },

  // 7. EXAMEN GENERAL DE ORINA
  { category: "urinalysis", name: "Densidad Específica", code: "SG", unit: "ratio", refMin: 1.005, refMax: 1.030, refText: "1.005 - 1.030" },
  { category: "urinalysis", name: "pH Urinario", code: "PH_URINE", unit: "pH", refMin: 5.0, refMax: 8.0, refText: "5.0 - 8.0" },
  { category: "urinalysis", name: "Proteínas en Orina", code: "PROT_URINE", refText: "Negativo" },
  { category: "urinalysis", name: "Glucosa en Orina", code: "GLU_URINE", refText: "Negativo" },
];
