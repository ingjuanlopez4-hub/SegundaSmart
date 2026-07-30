import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  redirect((await getCurrentUser()) ? "/app" : "/login");
}
