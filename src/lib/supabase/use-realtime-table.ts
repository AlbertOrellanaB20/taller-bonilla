"use client";

import { useEffect, useRef } from "react";
import { createClient } from "./client";

/**
 * Se suscribe a cambios en vivo (INSERT/UPDATE/DELETE) de una tabla de
 * Supabase y llama a `onChange` cuando algo cambia, para que la pantalla se
 * actualice sola sin recargar (CLAUDE.md: tiempo real en órdenes, inventario
 * y facturación). `onChange` normalmente vuelve a pedir los datos al server.
 */
export function useRealtimeTable(tables: string[], onChange: () => void) {
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`realtime:${tables.join(",")}`);

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => onChangeRef.current(),
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(",")]);
}
