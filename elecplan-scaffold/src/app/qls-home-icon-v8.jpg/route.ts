export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const source = new URL("/qls-apple-touch-icon.png?v=7", url.origin);
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) return new Response("Icon unavailable", { status: 502 });
  return new Response(await response.arrayBuffer(), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
