import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import NoteViewClient from "./NoteViewClient";

type Props = {
    params: Promise<{ id: string }>;
};

// Next.js static metadata generation
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params;

    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
        const res = await fetch(`${apiUrl}/public/notes/${id}`, {
            next: { revalidate: 60 }, // cache for 60 seconds
        });

        if (!res.ok) {
            return {
                title: "Note Not Found",
            };
        }

        const data = await res.json();
        if (!data.success || !data.data) {
            return {
                title: "Note Not Found",
            };
        }

        const note = data.data;
        const title = note.subject ? `${note.categoryEmoji} ${note.subject}` : `${note.categoryEmoji} A Petty Revenge Note`;
        const description = note.content.substring(0, 150) + (note.content.length > 150 ? "..." : "");

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: "website",
                url: `/note/${id}`,
                siteName: "Petty Revenge Notes",
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
            },
        };
    } catch (error) {
        return {
            title: "Petty Revenge Note",
        };
    }
}

export default async function NotePage({ params }: Props) {
    const { id } = await params;
    return (
        <div className="relative min-h-screen" style={{ backgroundColor: "#1a0f00" }}>
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(180deg, transparent, transparent 27px, rgba(80,50,10,0.07) 27px, rgba(80,50,10,0.07) 28px)",
                }}
            />
            <div className="relative mx-auto max-w-2xl px-4 py-20">
                <NoteViewClient noteId={id} />
            </div>
        </div>
    );
}
