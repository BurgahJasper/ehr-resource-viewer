"use client";

import { useEffect, useState } from "react";
import { initFirebase, ensureAnonAuth, resourcesQuery, seedDemoDocs } from "@/lib/firebase";
import { onSnapshot } from "firebase/firestore";
import { ResourceWrapper } from "@/types/ehr";
import { ResourceTable } from "@/components/resource-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Page() {
  const [{ db, auth }] = useState(() => initFirebase());
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ResourceWrapper[]>([]);
  const [seeding, setSeeding] = useState(false);
  const allowSeed = process.env.NEXT_PUBLIC_ALLOW_DEMO_SEED === "true";

  useEffect(() => {
    (async () => {
      await ensureAnonAuth(auth);
      const unsub = onSnapshot(resourcesQuery(db), (snap) => {
        const data: ResourceWrapper[] = snap.docs.map((d) => ({ ...(d.data() as any), __id: d.id }));
        setRows(data);
        setLoading(false);
      });
      return () => unsub();
    })();
  }, [db, auth]);

  return (
    <main className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">EHR Resources</h1>
        {allowSeed && (
          <div className="flex items-center gap-3">
            <Button
              disabled={seeding}
              onClick={async () => {
                setSeeding(true);
                try { await seedDemoDocs(db, 24); }
                finally { setSeeding(false); }
              }}
            >
              {seeding ? "Seeding…" : "Seed demo data"}
            </Button>
            <p className="text-sm text-muted-foreground">Populates Firestore with example docs.</p>
          </div>
        )}
      </header>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <ResourceTable data={rows} />
      )}
    </main>
  );
}
