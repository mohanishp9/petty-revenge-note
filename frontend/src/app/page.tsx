// app/page.tsx
import HomePage from "./(public)/home/HomePage";
import type { getAllNotesResponse } from "@/features/publicNote/types";

export const revalidate = 60; // revalidate every 60 seconds (optional ISR)

async function getInitialNotes(): Promise<getAllNotesResponse | null> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    // We fetch the anonymous feed with page 1, limit 12
    const res = await fetch(`${apiUrl}/public/notes?page=1&limit=12`, {
      next: { revalidate: 60 },
    });
    
    if (!res.ok) {
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch initial notes:", error);
    return null;
  }
}

export default async function Home() {
  const initialData = await getInitialNotes();
  return <HomePage initialData={initialData ?? undefined} />;
}