import config from "../config/config";

interface Data {
  type: string;
  query?: string; // make query optional
}

const createUrl = (data: Data): string => {
  const { appUrl } = config;
  // Ensure there is exactly one slash between appUrl and type
  const base = appUrl.endsWith("/") ? appUrl : appUrl + "/";
  const query = data.query ? `?${data.query}` : "";
  return `${base}${data.type}${query}`;
};

export { createUrl };
