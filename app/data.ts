// app/data.ts

export type Procedure = {
  id: number;
  name: string;
  rank: number;
  priceKrw: number;
  description: string; // "WHO/WHEN/WHY" 요약
  category: "Lifting" | "Skin Booster" | "Filler" | "Laser";
  clinics: string[]; // 추천 병원 이름
  isHot?: boolean;
};

// 가상의 데이터베이스 (Mock Data)
export const initialProcedures: Procedure[] = [
  {
    id: 1,
    name: "Juvelook Volume",
    rank: 1,
    priceKrw: 450000,
    category: "Skin Booster",
    description: "Collagen booster for forehead/cheeks.",
    clinics: ["Amred Clinic", "Rejuel Clinic"],
    isHot: true,
  },
  {
    id: 2,
    name: "Titanium Lifting",
    rank: 2,
    priceKrw: 390000,
    category: "Lifting",
    description: "Immediate lifting & brightening. Zero downtime.",
    clinics: ["Shine Beam", "Dayone Clinic"],
  },
  {
    id: 3,
    name: "Inmode FX",
    rank: 3,
    priceKrw: 169000,
    category: "Lifting",
    description: "Double chin & jawline fat removal.",
    clinics: ["Muse Clinic", "Toxnfill"],
  },
  {
    id: 4,
    name: "Rejuran Healer",
    rank: 4,
    priceKrw: 250000,
    category: "Skin Booster",
    description: "Skin barrier repair & glass skin.",
    clinics: ["Rejuel Clinic", "PPEUM Clinic"],
  },
  {
    id: 5,
    name: "Ultherapy (300 Shots)",
    rank: 99, // 순위권 밖 예시
    priceKrw: 1100000,
    category: "Lifting",
    description: "Standard lifting procedure.",
    clinics: ["ID Dermatology", "MJ Dermatology"],
  },
];