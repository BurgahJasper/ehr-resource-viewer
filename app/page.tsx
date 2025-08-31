"use client";

import { useEffect, useState } from "react";
import { initFirebase, ensureAnonAuth, resourcesQuery } from "@/src/lib/firebase";
import { onSnapshot } from "firebase/firestore";
import { ResourceWrapper } from "@/src/types/ehr";
import { ResourceTable } from "@/src/components/resource-table";
import { DevSeed } from "@/src/components/dev-seed";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  const [{ db, auth }] = useState(() => initFirebase());
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ResourceWrapper[]>([]);

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
        <DevSeed db={db} />
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
