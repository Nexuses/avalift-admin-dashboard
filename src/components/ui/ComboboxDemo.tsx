"use client";
import BASE_URL from "@/config/apiConfig";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface Chauffeur {
  id: number;
  user_type: string;
  latitude: number;
  longitude: number;
}

export function ChauffeurCombobox() {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [chauffeurs, setChauffeurs] = React.useState<Chauffeur[]>([]);
  const [loading, setLoading] = React.useState(false);
  const token = localStorage.getItem("authToken");

  // Function to fetch nearby chauffeurs from the API.
  const fetchChauffeurs = async () => {
    setLoading(true);
    try {
      const payload = {
        latitude: 10.7911,
        longitude: 76.7542,
        radius: 100000,
        user_type: "chauffeur",
      };
      const response = await fetch(`${BASE_URL}/api/location/getnearbyuser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // If needed, include the token:
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.success) {
        setChauffeurs(data.data);
      } else {
        console.error("Failed to fetch nearby chauffeurs:", data);
        setChauffeurs([]);
      }
    } catch (error) {
      console.error("Error fetching chauffeurs:", error);
      setChauffeurs([]);
    }
    setLoading(false);
  };

  // Fetch chauffeurs when the combobox opens.
  React.useEffect(() => {
    if (open) {
      fetchChauffeurs();
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value ? value : "Select Chauffeur..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search chauffeur..." className="h-9" />
          <CommandList>
            {loading && <CommandEmpty>Loading...</CommandEmpty>}
            {!loading && chauffeurs.length === 0 && (
              <CommandEmpty>No chauffeurs found.</CommandEmpty>
            )}
            <CommandGroup>
              {chauffeurs.map((chauffeur) => {
                const label = `Chauffeur ${chauffeur.id}`;
                return (
                  <CommandItem
                    key={chauffeur.id}
                    value={chauffeur.id.toString()}
                    onSelect={() => {
                      setValue(label);
                      setOpen(false);
                    }}
                  >
                    {label}
                    <Check
                      className={cn(
                        "ml-auto",
                        value === chauffeur.id.toString() ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
