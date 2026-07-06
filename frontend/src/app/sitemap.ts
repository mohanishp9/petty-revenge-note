import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://petty-revenge-note.vercel.app'

  let notesSitemap: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    // Fetch the top 100 most liked notes for indexing
    const res = await fetch(`${apiUrl}/public/notes?limit=100&sort=mostLiked`, { next: { revalidate: 3600 } });
    const data = await res.json();
    
    if (data.success && data.data) {
      notesSitemap = data.data.map((note: any) => ({
        url: `${baseUrl}/note/${note._id}`,
        lastModified: new Date(note.updatedAt || note.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
    }
  } catch (error) {
    console.error("Failed to fetch notes for sitemap", error);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/home`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...notesSitemap,
  ]
}
