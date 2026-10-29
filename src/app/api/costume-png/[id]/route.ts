import { SOURCE_ORIGIN } from "@/components/sites/costume-gallery/source";

export const dynamic = "force-dynamic";

const ID = /^[A-Z]{3}-\d{4}$/;

/**
 * Streams an original PNG from the source origin so the lightbox's download link
 * stays same-origin and the `download` attribute is honoured.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ID.test(id)) {
    return new Response("Invalid costume id", { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${SOURCE_ORIGIN}png/${id}.png`, {
      cache: "no-store",
    });
  } catch {
    return new Response("Upstream unreachable", { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    return new Response("Upstream error", { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${id}.png"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
