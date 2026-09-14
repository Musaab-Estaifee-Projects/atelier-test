"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { CheckIcon, ChevronDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { countriesData } from "@/constants/countries-data";

type PhoneInputVariant = "default" | "atelier";

const PhoneInputVariantContext =
  React.createContext<PhoneInputVariant>("default");

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
    variant?: PhoneInputVariant;
  };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<
    React.ComponentRef<typeof RPNInput.default>,
    PhoneInputProps
  >(({ className, onChange, placeholder, variant = "default", ...props }, ref) => {
    const [defaultCountry, setDefaultCountry] =
      useState<RPNInput.Country>("AE");
    const [currentCountry, setCurrentCountry] =
      useState<RPNInput.Country>("AE");

    useEffect(() => {
      const fetchCountry = async () => {
        try {
          const response = await fetch("https://ipapi.co/json/");
          if (!response.ok) throw new Error("Failed to fetch location");
          const data = await response.json();
          const countryCode = data.country_code as RPNInput.Country;
          if (countryCode && RPNInput.isSupportedCountry(countryCode)) {
            setDefaultCountry(countryCode);
            setCurrentCountry(countryCode);
          } else {
            console.warn("Unsupported country code, falling back to AE");
            setDefaultCountry("AE");
          }
        } catch (error) {
          console.error("Error fetching country:", error);
          setDefaultCountry("AE");
        }
      };
      fetchCountry();
    }, []);

    const handleCountryChange = (country: RPNInput.Country) => {
      setCurrentCountry(country);
    };

    const getDialFormat = (countryCode: RPNInput.Country): string => {
      const country = countriesData.find((c) => c.code === countryCode);
      return country?.dial_format || placeholder || "Phone number";
    };

    const dynamicPlaceholder = getDialFormat(currentCountry);

    return (
      <PhoneInputVariantContext.Provider value={variant}>
        <RPNInput.default
          ref={ref}
          className={cn(
            "flex",
            variant === "atelier" ? "w-full items-center gap-2" : "gap-4",
            className,
          )}
          flagComponent={FlagComponent}
          countrySelectComponent={(countrySelectProps) => (
            <CountrySelect
              {...countrySelectProps}
              onCountryChange={handleCountryChange}
            />
          )}
          inputComponent={InputComponent}
          smartCaret={false}
          international
          defaultCountry={defaultCountry}
          placeholder={dynamicPlaceholder}
          onChange={(value) => onChange?.(value || ("" as RPNInput.Value))}
          {...props}
        />
      </PhoneInputVariantContext.Provider>
    );
  });
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => {
  const variant = React.useContext(PhoneInputVariantContext);
  return (
    <Input
      className={cn(
        variant === "atelier"
          ? "h-auto rounded-none border-0 bg-transparent p-0 text-[12px] leading-[1.2] text-white shadow-none placeholder:text-[12px] placeholder:font-normal placeholder:text-white/28 focus-visible:outline-none! focus-visible:ring-0!"
          : "h-9 rounded-none border-x-0 border-t-0 border-b border-black text-base! text-black shadow-none duration-300 transition-colors placeholder:text-base placeholder:font-medium placeholder:leading-[110%] placeholder:text-black/50 focus-visible:outline-none! focus-visible:ring-0!",
        className,
      )}
      {...props}
      ref={ref}
    />
  );
});
InputComponent.displayName = "InputComponent";

const ServiceInputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    className={cn(
      "border-white focus:border-white border-b border-t-0 border-x-0 shadow-none rounded-none h-7 text-white text-base focus-visible:outline-none! focus-visible:ring-0! duration-300 transition-colors placeholder:text-white/65! selection:bg-white selection:text-black",
      className,
    )}
    {...props}
    ref={ref}
  />
));
ServiceInputComponent.displayName = "ServiceInputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
  onCountryChange?: (country: RPNInput.Country) => void;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
  onCountryChange,
}: CountrySelectProps) => {
  const variant = React.useContext(PhoneInputVariantContext);
  const [searchValue, setSearchValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const atelier = variant === "atelier";

  const handleCountrySelect = (country: RPNInput.Country) => {
    onChange(country);
    if (onCountryChange) {
      onCountryChange(country);
    }
  };

  return (
    <Popover onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "flex cursor-pointer gap-2 bg-transparent pr-1! pl-0! shadow-none hover:bg-transparent! focus-visible:outline-none! focus-visible:ring-0!",
            atelier
              ? "h-auto rounded-none border-0 pb-0 text-white"
              : "h-9 rounded-none border-x-0 border-t-0 border-b border-black pb-3 text-sm text-black duration-300 transition-colors ease-out focus-visible:border-black!",
            !atelier && isOpen && "border-black",
            disabled && "cursor-not-allowed opacity-50",
          )}
          disabled={disabled}
        >
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />

          <ChevronDown
            className={cn(
              "-mr-2 size-4.5 opacity-50 transition-transform duration-300 ease-in-out",
              isOpen && "rotate-180",
              disabled ? "hidden" : "opacity-100",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-80 w-70 rounded-none p-0 md:w-75">
        <Command>
          <CommandInput
            placeholder="Search country..."
            value={searchValue}
            onValueChange={setSearchValue}
            className="selection:bg-primary selection:text-primary-foreground"
          />
          <CommandList className="">
            <ScrollArea className="h-72" data-lenis-prevent>
              <CommandEmpty>No country found.</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CountrySelectOption
                      key={value}
                      country={value}
                      countryName={label}
                      selectedCountry={selectedCountry}
                      onChange={handleCountrySelect}
                    />
                  ) : null,
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
}: CountrySelectOptionProps) => {
  return (
    <CommandItem
      className="gap-2 rounded-none"
      onSelect={() => onChange(country)}
    >
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-sm text-foreground/50">{`+${RPNInput.getCountryCallingCode(
        country,
      )}`}</span>
      <CheckIcon
        className={`ml-auto size-4 ${
          country === selectedCountry ? "opacity-100" : "opacity-0"
        }`}
      />
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex w-[29.7px] h-5 overflow-hidden rounded-none  bg-foreground/20 [&_svg]:size-full!">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };
