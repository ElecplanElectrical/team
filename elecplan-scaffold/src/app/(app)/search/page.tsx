import TopBar from "@/components/TopBar";
import GlobalSearchView from "@/components/GlobalSearchView";

export default function SearchPage() {
  return <>
    <TopBar title="Search Elecplan" subtitle="Find an address, job or client" />
    <GlobalSearchView />
  </>;
}
