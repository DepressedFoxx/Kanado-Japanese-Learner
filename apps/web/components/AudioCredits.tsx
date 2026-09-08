"use client";

import { useEffect, useState } from "react";

interface ManifestEntry {
  credit: string;
}

export function AudioCredits() {
  const [credits, setCredits] = useState<string[]>([]);

  useEffect(() => {
    fetch("/audio/manifest.json")
      .then((response) => response.json())
      .then((data) => {
        const entries = Object.values(data.entries || {}) as ManifestEntry[];
        const uniqueCredits = new Set(entries.map((entry) => entry.credit));
        setCredits([...uniqueCredits]);
      })
      .catch(() => undefined);
  }, []);

  if (!credits.length) return null;

  return (
    <footer style={{ textAlign: "center", padding: 16, fontSize: 12 }}>
      Phát âm: {credits.join(" · ")} ·{" "}
      <a href="https://voicevox.hiroshiba.jp/">VOICEVOX</a> ·{" "}
      <a href="/audio/LICENSE.md">Điều kiện sử dụng audio</a>
    </footer>
  );
}
