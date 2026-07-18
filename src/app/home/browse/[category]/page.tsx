import { redirect } from "next/navigation";

/**
 * The Browse tab was removed (see task #17) but this route can still be
 * reached via an old bookmark or indexed link — redirect to the home feed
 * instead of rendering a blank screen.
 */
export default function BrowseCategoryRoute() {
  redirect("/home");
}
