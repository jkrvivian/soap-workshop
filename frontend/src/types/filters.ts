// Material filter configurations
export const MATERIAL_FILTERS = {
  all: {
    key: "all",
    label: "全部",
    categories: [],
  },
  oil: {
    key: "oil",
    label: "油脂",
    categories: ["油脂"],
  },
  essential_oil: {
    key: "essential_oil",
    label: "精油",
    categories: ["精油"],
  },
  chem: {
    key: "chem",
    label: "鹼 & 添加物",
    categories: ["添加物", "鹼"],
  },
} as const;

export type MaterialFilterType = keyof typeof MATERIAL_FILTERS;

// Product filter configurations
export const PRODUCT_FILTERS = {
  all: {
    key: "all",
    label: "全部",
    categories: [],
  },
  face: {
    key: "face",
    label: "洗顏",
    categories: ["洗顏"],
  },
  hair: {
    key: "hair",
    label: "洗髮",
    categories: ["洗髮"],
  },
  body: {
    key: "body",
    label: "沐浴",
    categories: ["沐浴"],
  },
  house: {
    key: "house",
    label: "家事",
    categories: ["家事"],
  },
} as const;

export type ProductFilterType = keyof typeof PRODUCT_FILTERS;

export const MATERIAL_CATEGORIES = ["油脂", "精油", "添加物", "鹼液"] as const;

export const PRODUCT_CATEGORIES = ["洗顏", "洗髮", "沐浴", "家事"] as const;
