// // ChauffeurAutocomplete.tsx
// "use client";

// import React, { useState, useEffect } from "react";
// import { Check, ChevronsUpDown } from "lucide-react";

// import { cn } from "@/lib/utils";
// import { Button } from "@/components/ui/button";
// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";

// import BASE_URL from "@/config/apiConfig";
// import { toast } from "sonner";

// interface Chauffeur {
//   id: number;
//   name: string;
// }

// interface ChauffeurAutocompleteProps {
//   value: Chauffeur | null;
//   onSelect: (chauffeur: Chauffeur) => void;
// }

// export function ChauffeurAutocomplete({
//   value,
//   onSelect,
// }: ChauffeurAutocompleteProps) {
//   const [open, setOpen] = useState(false);
//   const [query, setQuery] = useState("");
//   const [allChauffeurs, setAllChauffeurs] = useState<Chauffeur[]>([]);

//   // Fetch chauffeurs on mount.
//   useEffect(() => {
//     async function fetchChauffeurs() {
//       try {
//         const token = localStorage.getItem("authToken");
//         if (!token) {
//           console.error("Authentication token is missing.");
//           return;
//         }
//         const response = await fetch(`${BASE_URL}/api/user/chauffeurs`, {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${token}`,
//           },
//         });
//         if (!response.ok) {
//           console.error("Failed to fetch chauffeurs", response.statusText);
//           return;
//         }
//         const data = await response.json();
//         const fetchedChauffeurs: Chauffeur[] = Array.isArray(data.data)
//           ? data.data.map((item: any) => ({
//               id: item.id,
//               name: `${item.first_name}`,
//             }))
//           : [];
//         setAllChauffeurs(fetchedChauffeurs);
//       } catch (error) {
//         console.error("Error fetching chauffeurs:", error);
//       }
//     }
//     fetchChauffeurs();
//   }, []);

//   // Filter chauffeurs based on query.
//   const filteredChauffeurs =
//     query.length > 0
//       ? allChauffeurs.filter(
//           (chauffeur) =>
//             chauffeur.name.toLowerCase().includes(query.toLowerCase()) ||
//             String(chauffeur.id).includes(query)
//         )
//       : allChauffeurs;

//   return (
//     <Popover open={open} onOpenChange={setOpen}>
//       <PopoverTrigger asChild>
//         <Button
//           variant="outline"
//           role="combobox"
//           aria-expanded={open}
//           className="w-[200px] justify-between"
//           onClick={() => setOpen(true)}
//         >
//           {value ? value.name : "Select chauffeur..."}
//           <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
//         </Button>
//       </PopoverTrigger>
//       <PopoverContent className="w-[200px] p-0">
//         <Command>
//           <CommandInput
//             placeholder="Search chauffeur..."
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//           />
//           <CommandList>
//             {filteredChauffeurs.length === 0 ? (
//               <CommandEmpty>No chauffeur found.</CommandEmpty>
//             ) : (
//               <CommandGroup>
//                 {filteredChauffeurs.map((chauffeur) => (
//                   <CommandItem
//                     key={chauffeur.id}
//                     value={chauffeur.name}
//                     onSelect={(currentValue: string) => {
//                       const selected = allChauffeurs.find(
//                         (ch) =>
//                           ch.name.toLowerCase() === currentValue.toLowerCase()
//                       );
//                       if (selected) {
//                         onSelect(selected);
//                         setOpen(false);
//                         setQuery("");
//                       }
//                     }}
//                   >
//                     <Check
//                       className={cn(
//                         "mr-2 h-4 w-4",
//                         value?.id === chauffeur.id ? "opacity-100" : "opacity-0"
//                       )}
//                     />
//                     {chauffeur.name} (ID: {chauffeur.id})
//                   </CommandItem>
//                 ))}
//               </CommandGroup>
//             )}
//           </CommandList>
//         </Command>
//       </PopoverContent>
//     </Popover>
//   );
// }
