import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Vercel Cron llama esta ruta una vez al día (ver vercel.json) solo para
// que Supabase vea actividad y no pause el proyecto por inactividad — eso
// fue lo que rompió la demo con el profesor la primera vez.
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("rol").select("id_rol").limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, checkedAt: new Date().toISOString() });
  } catch (error) {
    console.error("keep-alive: no se pudo consultar Supabase", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
