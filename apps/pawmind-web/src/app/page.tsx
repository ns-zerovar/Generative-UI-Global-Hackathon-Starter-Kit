"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchBodyMapMarkers } from "@/lib/api";
import { ChatPanel } from "@/components/pawmind/ChatPanel";
import { Dashboard } from "@/components/pawmind/Dashboard";
import type { BodyMarker } from "@/components/pawmind/DogBodyMap";

export default function PawMindHome() {
  const markersQuery = useQuery({
    queryKey: ["body-map"],
    queryFn: fetchBodyMapMarkers,
    refetchInterval: 120_000,
  });

  const markers: BodyMarker[] = (markersQuery.data?.markers ?? []) as BodyMarker[];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
        <Dashboard markers={markers} />
        <ChatPanel />
      </motion.div>
    </main>
  );
}
