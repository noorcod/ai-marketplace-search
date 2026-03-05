export type FilterMap<T> = {
  key: keyof T | null;
  label: keyof T;
  type: 'checkbox' | 'radio' | 'range';
  unit: string | null;
  alias?: string;
};
