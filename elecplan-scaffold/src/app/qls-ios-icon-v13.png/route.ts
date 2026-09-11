export const runtime = "edge";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const source = new URL("/apple-touch-icon.png?qls=13", url.origin);
  const response = await fetch(source, { cache: "no-store" });
  if (!response.ok) return new Response("QLS icon unavailable", { status: 502 });
  const bytes = await response.arrayBuffer();
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}
