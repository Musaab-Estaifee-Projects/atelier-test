const Star = (props: React.SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 10.624C5.85622 10.6239 10.6041 5.86798 10.6049 0.00148368H11.395C11.395 5.86865 16.1433 10.6254 22 10.6254L21.9999 11.4181C16.1572 11.4182 11.4178 16.1522 11.3951 22H10.6045C10.5826 16.1516 5.84316 11.4168 0 11.4168V10.624Z"
        fill="white"
      />
      <path
        d="M10.6049 0.00148368H10.6036L10.605 0L10.6049 0.00148368Z"
        fill="white"
      />
    </svg>
  );
};

export default Star;
