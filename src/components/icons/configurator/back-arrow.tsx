const BackArrow = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="6"
      height="10"
      viewBox="0 0 6 10"
      fill="none"
      {...props}
    >
      <path
        d="M5.34863 0.423828L0.848633 4.92383L5.34863 9.42383"
        stroke="#00272D"
        strokeWidth="1.2"
      />
    </svg>
  );
};

export default BackArrow;
