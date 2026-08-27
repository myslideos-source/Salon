import { redirect } from "next/navigation";

// Abwesenheiten sind jetzt Teil von "Team und Ressourcen" — alte Links bleiben gültig.
export default function SalonAbsencesRedirectPage() {
  redirect("/app/team");
}
