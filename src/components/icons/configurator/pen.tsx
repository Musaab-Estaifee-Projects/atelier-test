const Pen = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      preserveAspectRatio="none"
      overflow="visible"
      style={{ display: "block" }}
      width="10.5"
      height="10.5"
      viewBox="0 0 10.5 10.5"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g id="lucide/pen" clipPath="url(#clip0_0_18)">
        <path
          id="Vector"
          d="M9.26338 2.9802C9.49469 2.74895 9.62467 2.43528 9.62471 2.1082C9.62475 1.78112 9.49485 1.46742 9.2636 1.23611C9.03235 1.0048 8.71868 0.874827 8.3916 0.874786C8.06452 0.874745 7.75082 1.00464 7.51951 1.23589L1.68063 7.07608C1.57905 7.17736 1.50393 7.30206 1.46188 7.4392L0.883945 9.3432C0.872638 9.38104 0.871784 9.42123 0.881474 9.45951C0.891163 9.4978 0.911035 9.53274 0.938981 9.56064C0.966927 9.58854 1.0019 9.60836 1.0402 9.61799C1.0785 9.62761 1.11869 9.6267 1.15651 9.61533L3.06095 9.03783C3.19796 8.99616 3.32265 8.92149 3.42407 8.82039L9.26338 2.9802Z"
          stroke="#F2E9D8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_0_18">
          <rect width="10.5" height="10.5" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default Pen;
