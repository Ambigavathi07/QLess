import { useEffect, useRef } from "react";
import { wsUrl } from "../lib/api";

export function useHospitalSocket(hospitalId, onEvent) {
    const ref = useRef(null);
    useEffect(() => {
        if (!hospitalId) return;
        let closed = false;
        let ws;
        let retry;

        function connect() {
            ws = new WebSocket(wsUrl(`/api/ws/hospital/${hospitalId}`));
            ref.current = ws;
            ws.onmessage = (e) => {
                try {
                    const payload = JSON.parse(e.data);
                    onEvent?.(payload);
                } catch (err) {
                    console.warn("[ws] invalid JSON payload", err);
                }
            };
            ws.onclose = () => {
                if (!closed) retry = setTimeout(connect, 2500);
            };
            ws.onerror = (err) => {
                console.warn("[ws] error", err);
                try { ws.close(); } catch (e) { console.warn("[ws] close failed", e); }
            };
        }
        connect();
        return () => {
            closed = true;
            if (retry) clearTimeout(retry);
            try { ws && ws.close(); } catch (e) { console.warn("[ws] cleanup close failed", e); }
        };
    }, [hospitalId]);
}
