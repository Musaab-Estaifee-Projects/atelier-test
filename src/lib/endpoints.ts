const seg = encodeURIComponent;

export const ENDPOINTS = {
  GET_ALL_PROJECTS: "/projects",
  GET_SINGLE_PROJECT: (code: string) => `/projects/${seg(code)}`,
  SEARCH_APARTMENTS: "/apartments/search",
  GET_LAYOUT_CATALOG: (layoutCode: string) =>
    `/layouts/${seg(layoutCode)}/catalog`,
  CREATE_CUSTOMER: "/customers",
  CREATE_DESIGN: "/designs",
  GET_DESIGN: (designCode: string) => `/designs/${seg(designCode)}`,
  GET_DESIGN_CONFIGURATION: (designCode: string) =>
    `/designs/${seg(designCode)}/configuration`,
  CONFIRM_DESIGN: (designCode: string) =>
    `/designs/${seg(designCode)}/confirm`,
  DESIGN_SUMMARY: (designCode: string) =>
    `/designs/${seg(designCode)}/summary`,
  PREPARE_RENDERS: (designCode: string) =>
    `/designs/${seg(designCode)}/prepare-renders`,
  GET_RENDERS: (designCode: string) => `/designs/${seg(designCode)}/renders`,
  RENDER_RETRIES: (designCode: string) =>
    `/designs/${seg(designCode)}/render-retries`,
} as const;
