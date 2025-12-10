interface UnsplashResponse {
  urls?: {
    full?: string;
    regular?: string;
    small?: string;
  };
}

export async function fetchUnsplashImages(
  topic: string,
  count: number,
  accessKey: string | null
): Promise<string[]> {
  if (!accessKey || count <= 0) return [];

  try {
    const res = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(
        topic || "quiz"
      )}&count=${Math.min(count, 20)}&orientation=landscape&content_filter=high`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error("Unsplash API error:", res.status, await res.text());
      return [];
    }

    const data = (await res.json()) as UnsplashResponse | UnsplashResponse[];
    const items = Array.isArray(data) ? data : [data];

    return items
      .map((item) => item.urls?.regular || item.urls?.full || item.urls?.small)
      .filter(Boolean) as string[];
  } catch (error) {
    console.error("Failed to fetch Unsplash images:", error);
    return [];
  }
}
