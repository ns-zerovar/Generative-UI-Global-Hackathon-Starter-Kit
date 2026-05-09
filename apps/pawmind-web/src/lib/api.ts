const BASE = process.env.NEXT_PUBLIC_PAWMIND_API_URL ?? "http://127.0.0.1:8010";

export async function streamChat(
  messages: { role: string; content: string }[],
  message: string,
  onDelta: (t: string) => void,
): Promise<void> {
  const res = await fetch(`${BASE}/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, message }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Chat failed: ${res.status}`);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onDelta(dec.decode(value, { stream: true }));
  }
}

export async function fetchDashboardSummary() {
  const res = await fetch(`${BASE}/dashboard/summary`);
  if (!res.ok) throw new Error("dashboard");
  return res.json();
}

export async function fetchBodyMapMarkers() {
  const res = await fetch(`${BASE}/body-map/markers`);
  if (!res.ok) throw new Error("body map");
  return res.json();
}

export async function syncNotionToQdrant() {
  const res = await fetch(`${BASE}/sync/notion-to-qdrant`, { method: "POST" });
  if (!res.ok) throw new Error("sync");
  return res.json();
}

export async function uploadClinicalDoc(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${BASE}/ingest/document`, { method: "POST", body: fd });
  if (!res.ok) throw new Error("upload");
  return res.json();
}
