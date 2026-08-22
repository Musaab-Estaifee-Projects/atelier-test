// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   transpilePackages: ["streampixelsdk"],
//   webpack: (config, { isServer }) => {
//     if (!isServer) {
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         fs: false,
//         net: false,
//         tls: false,
//         crypto: false,
//         stream: false,
//         path: false,
//         os: false,
//         http: false,
//         https: false,
//         zlib: false,
//       };
//     }
//     return config;
//   },
// };

// export default nextConfig;

import type { NextConfig } from "next";
import type { Configuration as WebpackConfig } from "webpack";
import webpack from "webpack";

/**
 * Streampixel Web SDK expects CRA-style Node polyfills.
 * Next 16 defaults to Turbopack, which does NOT apply `webpack` config.
 * Use `next dev --webpack` / `next build --webpack` (see package.json).
 */
const nextConfig: NextConfig = {
  transpilePackages: ["streampixelsdk"],

  // Silences the Turbopack-vs-webpack warning if you ever start without --webpack.
  // Real polyfills only apply when running with Webpack (see scripts below).
  turbopack: {},

  webpack: (config: WebpackConfig, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        assert: require.resolve("assert"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        os: require.resolve("os-browserify"),
        url: require.resolve("url"),
        zlib: require.resolve("browserify-zlib"),
        path: require.resolve("path-browserify"),
        process: require.resolve("process/browser"),
        buffer: require.resolve("buffer"),
      };

      config.plugins = config.plugins ?? [];
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
      );
    }

    // Optional: same as CRA ignoreWarnings for noisy source maps
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      /Failed to parse source map/,
    ];

    return config;
  },
};

export default nextConfig;
