// utils/normalizeCompany.ts
export const normalizeCompany = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, "") // remove all spaces
    .trim(); // remove leading/trailing spaces
};
