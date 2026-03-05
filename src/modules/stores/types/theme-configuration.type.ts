export type ThemeConfig = {
  themeType: string;
  bannerConfig: {
    bannerType: 'primaryImage' | 'secondaryImage' | string;
    images?: {
      key: string | null;
      originalname: string | null;
    }[];
  }[];
  topCategories: any[]; // Replace `any` with a specific type if known
  listingSectionConfig: {
    sectionName: string;
    sectionItems: number[];
  }[];
};
