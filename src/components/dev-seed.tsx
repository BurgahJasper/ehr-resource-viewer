import { useState } from "react";
import { Button } from "@/components/ui/button";
import { seedDemoDocs } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import type { Firestore } from "firebase/firestore";

export function DevSeed({ db }: { db: Firestore }) {
  if (process.env.NEXT_PUBLIC_ALLOW_DEMO_SEED !== "true") return null;

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <Button
        disabled={loading || done}
        onClick={async () => {
          setLoading(true);
          try {
            await seedDemoDocs(db, 24);
            setDone(true);
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Seeding…
          </>
        ) : done ? "Seeded!" : "Seed demo data"}
      </Button>
      <p className="text-sm text-muted-foreground">
        Populates Firestore with example docs.
      </p>
    </div>
  );
}
