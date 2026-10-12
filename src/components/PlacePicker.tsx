import { useEffect, useRef } from "react";

// Declare the custom element in the JSX.IntrinsicElements interface
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "gmpx-place-picker": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { ref?: React.Ref<any>, placeholder?: string };
    }
  }
}

type PlacePickerProps = {
  placeholder?: string;
  onPlaceChange: (data: { address: string; lat: number; lng: number }) => void;
};

export function PlacePicker({ placeholder = "Enter an address", onPlaceChange }: PlacePickerProps) {
  const pickerRef = useRef<any>(null);

  useEffect(() => {
    const pickerEl = pickerRef.current;
    if (pickerEl) {
      // Listen for the custom event that fires when a place is selected.
      const handlePlaceChanged = (e: CustomEvent) => {
        // Here we assume e.detail contains the place data.
        // Adjust this extraction based on the actual event detail structure.
        const { address, lat, lng } = e.detail;
        onPlaceChange({ address, lat, lng });
      };

      pickerEl.addEventListener("place_changed", handlePlaceChanged as EventListener);
      return () => {
        pickerEl.removeEventListener("place_changed", handlePlaceChanged as EventListener);
      };
    }
  }, [onPlaceChange]);

  return <gmpx-place-picker ref={pickerRef} placeholder={placeholder}></gmpx-place-picker>;
}
