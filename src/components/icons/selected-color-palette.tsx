const SelectedColorPalette = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="41"
      height="41"
      viewBox="0 0 41 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      {...props}
    >
      <path
        d="M20.2705 0.368164C31.2621 0.368164 40.1728 9.27895 40.1729 20.2705C40.1729 31.2621 31.2621 40.1729 20.2705 40.1729C9.27895 40.1728 0.368164 31.2621 0.368164 20.2705C0.368224 9.27899 9.27899 0.368224 20.2705 0.368164Z"
        stroke="white"
        strokeWidth="0.737113"
      />
      <rect
        x="2.21133"
        y="2.21094"
        width="36.1186"
        height="36.1186"
        rx="18.0593"
        fill="url(#pattern0_25598_3532)"
      />
      <rect
        x="1.84278"
        y="1.84238"
        width="36.8557"
        height="36.8557"
        rx="18.4278"
        stroke="white"
        strokeOpacity="0.2"
        strokeWidth="0.737113"
      />
      <defs>
        <pattern
          id="pattern0_25598_3532"
          patternContentUnits="objectBoundingBox"
          width="1"
          height="1"
        >
          <use
            xlinkHref="#image0_25598_3532"
            transform="translate(-0.0517241) scale(0.0172414)"
          />
        </pattern>
        <image
          id="image0_25598_3532"
          width="64"
          height="58"
          preserveAspectRatio="none"
          xlinkHref="data:image/png;base64,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"
        />
      </defs>
    </svg>
  );
};

export default SelectedColorPalette;
