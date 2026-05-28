"use client";

import { useEffect, useState } from "react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

type PingResponse = {
  ok: boolean;
  service: string;
  timestamp: string;
};

export default function Home() {
  const [status, setStatus] = useState("Checking backend...");

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${apiUrl}/ping`);
        if (!response.ok) {
          throw new Error("Backend responded with non-OK status");
        }

        const data = (await response.json()) as PingResponse;
        setStatus(
          data.ok
            ? `Connected to ${data.service} at ${data.timestamp}`
            : "Backend replied, but status is not OK",
        );
      } catch {
        setStatus("Cannot connect to backend API");
      }
    };

    checkBackend();
  }, []);

  return (
    <main className="min-h-screen p-10">
      <h1 className="text-2xl font-semibold">Client Frontend</h1>
      <p className="mt-3">API URL: {apiUrl}</p>
      <p className="mt-2">{status}</p>
    </main>
  );
}
