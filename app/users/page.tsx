import { Separator } from "@/components/ui/separator";
import { TypographyH2 } from "@/components/ui/typography";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import UsersCard from "./users-card";

interface Profile {
  id: string;
  display_name: string;
  biography: string | null;
  email: string
}

export default async function UsersList() {
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/");
  }

  const sessionId = session.user.id;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("id", { ascending: false })
    .neq("id", sessionId);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <TypographyH2>Users List</TypographyH2>
      </div>
      <Separator className="my-4" />
      <div className="flex flex-wrap justify-center">
        <ul>
          {profiles?.map((profile: Profile) => (
          <li key={profile.id}>
            <UsersCard profile={profile} />
          </li>
          ))}
        </ul>
      </div>
    </>
  );
}
