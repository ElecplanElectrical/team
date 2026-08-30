import lockedHome0 from "@/lib/locked-home-0";
import lockedHomeGap from "@/lib/locked-home-gap";
import lockedHome1 from "@/lib/locked-home-1";
import lockedHome2 from "@/lib/locked-home-2";
import lockedHome3 from "@/lib/locked-home-3";
import lockedHome4 from "@/lib/locked-home-4";
import lockedHome5 from "@/lib/locked-home-5";
import lockedHome6 from "@/lib/locked-home-6";
import lockedHome7 from "@/lib/locked-home-7";
import lockedHome8 from "@/lib/locked-home-8";
import lockedHome9 from "@/lib/locked-home-9";

const approvedHome = [
  lockedHome0,
  lockedHomeGap,
  lockedHome1,
  lockedHome2,
  lockedHome3,
  lockedHome4,
  lockedHome5,
  lockedHome6,
  lockedHome7,
  lockedHome8,
  lockedHome9,
].join("");

export const dynamic = "force-static";

export function GET() {
  const bytes = Buffer.from(approvedHome, "base64");
  const riff = bytes.subarray(0, 4).toString("ascii");
  const webp = bytes.subarray(8, 12).toString("ascii");
  const expectedLength = bytes.length >= 8 ? bytes.readUInt32LE(4) + 8 : 0;

  if (riff !== "RIFF" || webp !== "WEBP" || expectedLength !== bytes.length) {
    return new Response(
      `Invalid approved homepage artwork: riff=${riff} webp=${webp} expected=${expectedLength} actual=${bytes.length}`,
      { status: 500, headers: { "Content-Type": "text/plain", "Cache-Control": "no-store" } },
    );
  }

  return new Response(bytes, {
    headers: {
      "Content-Type": "image/webp",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
