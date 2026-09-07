export const ENDPOINTS = {
  GET_ALL_PROJECTS: "/projects",
  GET_SINGLE_PROJECT: (code: string) => `/projects/${code}`,
  SEARCH_APARTMENTS: "/apartments/search",
} as const;
