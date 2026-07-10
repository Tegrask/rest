import { orderBroadcaster } from "@/lib/sse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: { type: string; order: unknown }) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
          );
        } catch (error) {
          console.error("SSE enqueue error", error);
        }
      };

      const unsubscribe = orderBroadcaster.subscribe(send);

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        controller.close();
      });

      controller.enqueue(encoder.encode(":ok\n\n"));
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
