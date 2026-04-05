export interface PlateParams {
  // Plate dimensions
  length: number;
  width: number;
  thickness: number;
  cornerRadius: number;

  // Border
  borderWidth: number;
  borderHeight: number;

  // Blue strip
  blueStripHeight: number;

  // Hole
  holeDiameter: number;
  holeX: number;
  holeY: number;

  // Main text (plate number)
  text: string;
  textSize: number;
  textX: number;
  textY: number;
  textSpacing: number;
  textFit: "shrink" | "wrap";

  // Country text
  countryText: string;
  countryTextSize: number;
  countryTextSpacing: number;
  countryTextX: number;
  countryTextY: number;

  // BR text
  brText: string;
  brTextSize: number;
  brTextX: number;
  brTextY: number;

  // Flag
  showFlag: boolean;
  flagStyle: "flat" | "relief";
  flagCountry: string; // matches CountryTemplate.name

  // Colors (preview only, STL has no color)
  baseColor: string;
  borderColor: string;
  stripColor: string;
}

export const DEFAULT_PARAMS: PlateParams = {
  length: 70,
  width: 22,
  thickness: 2,
  cornerRadius: 3,

  borderWidth: 1.5,
  borderHeight: 1,

  blueStripHeight: 5.4,

  holeDiameter: 3,
  holeX: -31,
  holeY: 0,

  text: "ABC1B34",
  textSize: 9,
  textX: 0,
  textY: 0,
  textSpacing: 1.05,
  textFit: "shrink",

  countryText: "BRASIL",
  countryTextSize: 3.0,
  countryTextSpacing: 1.15,
  countryTextX: 0,
  countryTextY: 0,

  brText: "BR",
  brTextSize: 2.5,
  brTextX: -30,
  brTextY: -7,

  showFlag: true,
  flagStyle: "flat",
  flagCountry: "Brasil",

  baseColor: "#ffffff",
  borderColor: "#333333",
  stripColor: "#003DA5",
};

export type FlagBuilder = (
  width: number,
  height: number,
  depth: number,
  style: "flat" | "relief",
) => import("three").Group;

export interface CountryTemplate {
  name: string;
  countryText: string;
  brText: string;
  flag?: FlagBuilder;
}

// Lazy import to avoid circular deps — flag builder is set at runtime
import { buildBrazilFlag } from "./flag-brazil";
import { buildArgentinaFlag } from "./flag-argentina";

export const COUNTRY_TEMPLATES: CountryTemplate[] = [
  { name: "Brasil", countryText: "BRASIL", brText: "BR", flag: buildBrazilFlag },
  { name: "Argentina", countryText: "ARGENTINA", brText: "RA", flag: buildArgentinaFlag },
  { name: "Uruguai", countryText: "URUGUAY", brText: "UY" },
  { name: "Paraguai", countryText: "PARAGUAY", brText: "PY" },
  { name: "Venezuela", countryText: "VENEZUELA", brText: "VE" },
  { name: "Bolivia", countryText: "BOLIVIA", brText: "BOL" },
  { name: "Colombia", countryText: "COLOMBIA", brText: "CO" },
  { name: "Equador", countryText: "ECUADOR", brText: "EC" },
  { name: "Peru", countryText: "PERU", brText: "PE" },
  { name: "Chile", countryText: "CHILE", brText: "RCH" },
  { name: "Guiana", countryText: "GUYANA", brText: "GUY" },
  { name: "Suriname", countryText: "SURINAME", brText: "SME" },
];
