"use client";

import { Separator } from "@/components/ui/separator";
import { TypographyH2 } from "@/components/ui/typography";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import { redirect } from "next/navigation";
import AddSpeciesDialog from "./add-species-dialog";
import SpeciesCard from "./species-card";
import { useEffect, useState } from "react";
import Loading from "../loading";
import Searchbar from "./searchbar";
import type { Database } from "@/lib/schema";

export default function SpeciesList() {
  type Species = Database["public"]["Tables"]["species"]["Row"];

  const [loading, setLoading] = useState(true);
  const [species, setSpecies] = useState<Species[]>([]);
  const [filteredSpecies, setFilteredSpecies] = useState<Species[]>([]);
  const [userId,setUserId] = useState<string>("");

  useEffect(()=>{
    const fetchSpecies = async () => {
      const supabase = createBrowserSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        // this is a protected route - only users who are signed in can view this route
        redirect("/");
      }

      // Obtain the ID of the currently signed-in user
      const sessionId = session.user.id;
      setUserId(sessionId)

      const { data: speciesData, error } = await supabase.from("species").select("*").order("id", { ascending: false });

      if (error) {
        console.error("Error fetching species:", error);
      } else {
        setSpecies(speciesData || []);
        setFilteredSpecies(speciesData || []);
      }
      setLoading(false);
    };

    void fetchSpecies();

}, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    const searchValue = species.filter((speciesItem) => {
      if (value === "") {
        return true;
      } else {
        return (
          speciesItem.scientific_name.toLowerCase().includes(value) ||
          speciesItem.common_name?.toLowerCase().includes(value) ||
          speciesItem.description?.toLowerCase().includes(value)
        );
      }
    });

    setFilteredSpecies(searchValue);
  };

  if (loading) {
    return <Loading/>
  }
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <TypographyH2>Species List</TypographyH2>
        <Searchbar onChange={onChange}/>
        <AddSpeciesDialog userId={userId} />
      </div>
      <Separator className="my-4" />
      <div className="flex flex-wrap justify-center">
        {filteredSpecies?.map((speciesItem) => (
          <SpeciesCard key={speciesItem.id} species={speciesItem} userId={userId} />
        ))}
      </div>
    </>
  );
}
