import { LOGO_MARK } from "@/lib/logo";

export async function GET() {
  const match = LOGO_MARK.match(/^data:image\/png;base64,(.+)$/);
  if (!match) {
    return new Response("Icon unavailable", { status: 500 });
  }

  const bytes = Buffer.from(match[1], "base64");

  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
