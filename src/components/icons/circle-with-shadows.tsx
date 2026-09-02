const CircleWithShadows = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="24" cy="24" r="24" fill="white" fillOpacity="0.26" />
      <circle cx="24" cy="24" r="18" fill="white" fillOpacity="0.26" />
      <circle cx="24" cy="24" r="11.5" stroke="white" />
    </svg>
  );
};

export default CircleWithShadows;
