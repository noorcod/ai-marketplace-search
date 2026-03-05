export type ModelVariants = {
  modelId: number;
  modelTitle: string;
  variant: string;
};

export type ModelFilters = {
  [key: string]: {
    values: any[];
    key: string;
    label: string;
    alias: string;
    unit: string;
    inputType: string;
  };
};
