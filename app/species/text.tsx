"use client";

import { createBrowserSupabaseClient } from "@/lib/client-utils"
import { useState, useEffect } from "react";
import SpeciesCard from "../species/species-card";
import type { Database } from "@/lib/schema";
import { Separator } from "@/components/ui/separator";
import Loading from "../loading";
import { toast } from "@/components/ui/use-toast";

type Profiles = Database["public"]["Tables"]["profiles"]["Row"];

type Species = Database["public"]["Tables"]["species"]["Row"];

export default function UsersCard({ profile, userId }: { profile: Profiles; userId: string }) {
  const [ species, setSpecies ] = useState<Species[]>([])
  const [ loading, setLoading ] = useState<boolean>(false);
  const supabase = createBrowserSupabaseClient();

  useEffect(()=> {
    setLoading(true)
    const fetchAuthorsSpecies = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase
        .from("species")
        .select("*")
        .eq("author", profile.id);

      if (error) {
        setLoading(false)
        return toast({
          title: "Something went wrong.",
          description: error.message,
          variant: "destructive",
        });
      }

      if (data) {
        setSpecies(data);
        setLoading(false);
      }
    };

    void fetchAuthorsSpecies();
  }, [profile.id, supabase])


  return (
    <div>
      {loading ? (
        <Loading/>
      ): (
        <>
        <div className="">
          <h3>{profile.display_name}</h3>
          <p>{profile.biography}</p>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-wrap justify-center">
          {species?.map((species) => <SpeciesCard key={species.id} species={species} userId={userId} />)}
        </div>
      </>
      )}
    </div>
  )
}
