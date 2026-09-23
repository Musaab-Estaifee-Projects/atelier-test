export const ENDPOINTS = {
  GET_ALL_PROJECTS: "/projects",
  GET_SINGLE_PROJECT: (code: string) => `/projects/${code}`,
  SEARCH_APARTMENTS: "/apartments/search",
  GET_LAYOUT_CATALOG: (layoutCode: string) => `/layouts/${layoutCode}/catalog`,
  CREATE_CUSTOMER: "/customers",
  CREATE_DESIGN: "/designs",
  GET_DESIGN: (designCode: string) => `/designs/${designCode}`,
  GET_DESIGN_CONFIGURATION: (designCode: string) =>
    `/designs/${designCode}/configuration`,
  CONFIRM_DESIGN: (designCode: string) => `/designs/${designCode}/confirm`,
  DESIGN_SUMMARY: (designCode: string) => `/designs/${designCode}/summary`,
  PREPARE_RENDERS: (designCode: string) =>
    `/designs/${designCode}/prepare-renders`,
  GET_RENDERS: (designCode: string) => `/designs/${designCode}/renders`,
  RENDER_RETRIES: (designCode: string) =>
    `/designs/${designCode}/render-retries`,
} as const;
