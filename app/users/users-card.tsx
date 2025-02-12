import type { Database } from "@/lib/schema";
import { Separator } from "@/components/ui/separator";


type Profiles = Database["public"]["Tables"]["profiles"]["Row"];

export default function UsersCard({ profile }: { profile: Profiles }) {
  return (
      <>
        <div className="">
          <h3>{profile.display_name} | {profile.email}</h3>
          <p>{profile.biography}</p>
        </div>
        <Separator className="my-4" />
      </>
  )
}
