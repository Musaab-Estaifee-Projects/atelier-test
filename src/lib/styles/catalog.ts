/** Ready-made interior styles on the Select Style screen. */
export type CatalogStyle = {
  slug: string;
  name: string;
  image: string;
  description: string;
  swatches: [string, string, string];
};

const SHARED_COPY =
  "A luxurious direction reflecting raw monolithic symmetry and timeless European proportions, crafted with modern precision.";

export const CATALOG_STYLES: CatalogStyle[] = [
  {
    slug: "reef",
    name: "REEF style",
    image: "/images/styles/reef.png",
    description: SHARED_COPY,
    swatches: ["#f9ecdb", "#8fc4f0", "#42270b"],
  },
  {
    slug: "dubai",
    name: "Dubai style",
    image: "/images/styles/dubai.png",
    description: SHARED_COPY,
    swatches: ["#bab1aa", "#3e4227", "#564b45"],
  },
  {
    slug: "organic",
    name: "Organic style",
    image: "/images/styles/organic.png",
    description: SHARED_COPY,
    swatches: ["#ece0c8", "#beb1a8", "#413c38"],
  },
  {
    slug: "new-classic",
    name: "New classic Style",
    image: "/images/styles/new-classic.png",
    description: SHARED_COPY,
    swatches: ["#f9ecdb", "#8fc4f0", "#42270b"],
  },
  {
    slug: "andalusian",
    name: "Andalusian Style",
    image: "/images/styles/andalusian.png",
    description: SHARED_COPY,
    swatches: ["#bab1aa", "#3e4227", "#564b45"],
  },
];
