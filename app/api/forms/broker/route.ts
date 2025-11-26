// app/api/forms/broker/route.ts
import { NextResponse } from "next/server";
import { forwardOrStore } from "@/utils/storeBrokerPayload";


export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // ✅ Validate required field(s)
    if (!payload?.email) {
      return new NextResponse(
        JSON.stringify({ ok: false, error: "Email is required." }),
        { status: 400 }
      );
    }

    // ✅ Forward or store
    const result = await forwardOrStore("broker", payload);

    return new NextResponse(
      JSON.stringify({ ok: true, ...result }),
      { status: 200 }
    );
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ ok: false, error: e?.message || "Failed" }),
      { status: 500 }
    );
  }
}
