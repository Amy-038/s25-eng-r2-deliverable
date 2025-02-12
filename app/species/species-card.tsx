"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { createBrowserSupabaseClient } from "@/lib/client-utils";
import type { Database } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, type BaseSyntheticEvent, type MouseEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loading from "../loading";

type Species = Database["public"]["Tables"]["species"]["Row"];

const kingdoms = z.enum(["Animalia", "Plantae", "Fungi", "Protista", "Archaea", "Bacteria"]);

const speciesSchema = z.object({
  scientific_name: z
    .string()
    .trim()
    .min(1)
    .transform((val) => val?.trim()),
  common_name: z
    .string()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  kingdom: kingdoms,
  total_population: z.number().int().positive().min(1).nullable(),
  image: z
    .string()
    .url()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  description: z
    .string()
    .nullable()
    .transform((val) => (!val || val.trim() === "" ? null : val.trim())),
  endangered: z.boolean().nullable(),
  author: z
    .string()
    .trim()
    .transform((val) => val?.trim()),
});

type FormData = z.infer<typeof speciesSchema>;

export default function SpeciesCard({ species, userId }: { species: Species; userId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState<boolean>(false);
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  const defaultValues: FormData = {
    scientific_name: species.scientific_name,
    common_name: species.common_name,
    kingdom: species.kingdom,
    total_population: species.total_population ?? null,
    image: species.image,
    description: species.description,
    endangered: species.endangered ?? false,
    author: species.author,
  };

  const form = useForm<FormData>({
    resolver: zodResolver(speciesSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    const fetchAuthorDisplayName = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data, error } = await supabase.from("profiles").select("display_name").eq("id", species.author).single();

      if (error) {
        return toast({
          title: "Something went wrong.",
          description: error.message,
          variant: "destructive",
        });
      }

      if (data) {
        setAuthorName(data.display_name);
      }
    };

    void fetchAuthorDisplayName();
  }, [species.author]);

  const onSubmit = async (input: FormData) => {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase
      .from("species")
      .update({
        author: userId,
        common_name: input.common_name,
        description: input.description,
        kingdom: input.kingdom,
        scientific_name: input.scientific_name,
        total_population: input.total_population,
        image: input.image,
        endangered: input.endangered,
      })
      .eq("id", species.id);

    router.refresh();

    if (error) {
      setLoading(false);
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    form.reset(defaultValues);
    setLoading(false);
    setIsEditing(false);
    router.refresh();

    return toast({
      title: input.scientific_name + "information updated successfully!",
    });
  };

  const startEditing = (e: MouseEvent) => {
    e.preventDefault();
    form.reset(defaultValues);
    setIsEditing(true);
  };

  const handleCancel = (e: MouseEvent) => {
    e.preventDefault();
    form.reset(defaultValues);
    setIsEditing(false);
  };

  const onDelete = async () => {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("species").delete().eq("id", species.id);

    if (error) {
      setLoading(false);
      return toast({
        title: "Something went wrong.",
        description: error.message,
        variant: "destructive",
      });
    }

    router.refresh();
    setLoading(false);

    return toast({
      title: "Species deleted",
    });
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="m-4 w-72 min-w-72 flex-none rounded border-2 p-3 shadow">
      {species.image && (
        <div className="relative h-40 w-full">
          <Image src={species.image} alt={species.scientific_name} fill style={{ objectFit: "cover" }} />
        </div>
      )}
      <h3 className="mt-3 text-2xl font-semibold">{species.scientific_name}</h3>
      <h4 className="text-lg font-light italic">{species.common_name}</h4>
      <p>{species.description ? species.description.slice(0, 150).trim() + "..." : ""}</p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="mt-3 w-full">Learn More</Button>
        </DialogTrigger>
        <DialogContent className="max-h-screen overflow-y-auto sm:max-w-[600px]">
          {species.author !== userId ? (
            <>
              <p>Scientific Name: {species.scientific_name}</p>
              <p>Common Name: {species.common_name}</p>
              <p>Total Population: {species.total_population}</p>
              <p>Kingdom: {species.kingdom}</p>
              <p>Description: {species.description}</p>
              <p>Endangered: {species.endangered ? "Yes" : "No"}</p>
              <p>Created by: {authorName}</p>
            </>
          ) : (
            <Form {...form}>
              <form onSubmit={(e: BaseSyntheticEvent) => void form.handleSubmit(onSubmit)(e)}>
                <div className="grid w-full items-center gap-4">
                  <FormField
                    control={form.control}
                    name="scientific_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scientific Name</FormLabel>
                        <FormControl>
                          <Input readOnly={!isEditing} placeholder={defaultValues.scientific_name} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="common_name"
                    render={({ field }) => {
                      // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                      const { value, ...rest } = field;
                      return (
                        <FormItem>
                          <FormLabel>Common Name</FormLabel>
                          <FormControl>
                            <Input
                              readOnly={!isEditing}
                              value={value ?? ""}
                              placeholder={defaultValues.common_name ?? ""}
                              {...rest}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="kingdom"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kingdom</FormLabel>
                        <Select
                          disabled={!isEditing}
                          onValueChange={(value) => field.onChange(kingdoms.parse(value))}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={defaultValues.kingdom} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              {kingdoms.options.map((kingdom, index) => (
                                <SelectItem key={index} value={kingdom}>
                                  {kingdom}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="total_population"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Population</FormLabel>
                        <FormControl>
                          <Input
                            readOnly={!isEditing}
                            type="number"
                            value={field.value ?? ""}
                            placeholder={defaultValues.total_population?.toString() ?? ""}
                            onChange={(event) => field.onChange(+event.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => {
                      // We must extract value from field and convert a potential defaultValue of `null` to "" because inputs can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                      const { value, ...rest } = field;
                      return (
                        <FormItem>
                          <FormLabel>Image URL</FormLabel>
                          <FormControl>
                            <Input
                              readOnly={!isEditing}
                              value={value ?? ""}
                              placeholder={defaultValues.image ?? ""}
                              {...rest}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => {
                      // We must extract value from field and convert a potential defaultValue of `null` to "" because textareas can't handle null values: https://github.com/orgs/react-hook-form/discussions/4091
                      const { value, ...rest } = field;
                      return (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              readOnly={!isEditing}
                              value={value ?? ""}
                              placeholder={defaultValues.description ?? ""}
                              className="resize-none"
                              {...rest}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  <FormField
                    control={form.control}
                    name="endangered"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Endangered</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => field.onChange(value === "true")} // Convert string to boolean
                            value={field.value ? "true" : "false"} // Convert boolean to string
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="endangered-yes" />
                              <label htmlFor="endangered-yes">Yes</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="endangered-no" />
                              <label htmlFor="endangered-no">No</label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isEditing && species.author === userId ? (
                    <>
                      <Button disabled={loading} type="submit" className="mr-2">
                        {loading ? "Updating species information..." : "Update species information"}
                      </Button>
                      <Button disabled={loading} variant="secondary" onClick={handleCancel}>
                        Cancel
                      </Button>
                      <Button
                        className="rounded bg-destructive px-4 py-2 text-destructive-foreground"
                        disabled={loading}
                        onClick={() => void onDelete()}
                      >
                        {loading ? "Deleting..." : "Delete"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={startEditing} disabled={loading}>
                        Edit Species
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
