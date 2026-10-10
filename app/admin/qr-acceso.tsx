"use client";

import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Printer, QrCode } from "lucide-react";

type Props = {
    slug: string;
    nombreGimnasio: string;
};

export default function QrAcceso({
    slug,
    nombreGimnasio,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [url, setUrl] = useState("");

    useEffect(() => {
        setUrl(
            `${window.location.origin}/checkin/${encodeURIComponent(slug)}`
        );
    }, [slug]);

    function descargarQR() {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const enlace = document.createElement("a");
        enlace.href = canvas.toDataURL("image/png");
        enlace.download = `qr-acceso-${slug}.png`;
        enlace.click();
    }

    function imprimirQR() {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ventana = window.open(
            "",
            "_blank",
            "width=600,height=700"
        );

        if (!ventana) {
            window.alert(
                "Permite las ventanas emergentes para imprimir el QR."
            );
            return;
        }

        const documento = ventana.document;
        documento.title = `QR de acceso - ${nombreGimnasio}`;

        const contenido = documento.createElement("main");
        contenido.style.cssText =
            "font-family:Arial,sans-serif;text-align:center;padding:32px;color:#111";

        const titulo = documento.createElement("h1");
        titulo.textContent = nombreGimnasio;

        const descripcion = documento.createElement("p");
        descripcion.textContent =
            "Escanea este código para registrar tu asistencia.";

        const imagen = documento.createElement("img");
        imagen.src = canvas.toDataURL("image/png");
        imagen.alt = "QR de acceso al gimnasio";
        imagen.style.cssText =
            "width:260px;height:260px;max-width:100%;";

        const enlace = documento.createElement("p");
        enlace.textContent = url;
        enlace.style.cssText = "overflow-wrap:anywhere;font-size:12px";

        contenido.append(titulo, descripcion, imagen, enlace);
        documento.body.replaceChildren(contenido);

        imagen.onload = () => {
            ventana.focus();
            ventana.print();
        };
    }

    return (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6">
            <div className="flex items-center gap-3">
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-emerald-400">
                    <QrCode className="h-5 w-5" />
                </div>

                <div>
                    <h2 className="text-lg font-bold text-white">
                        QR de acceso
                    </h2>
                    <p className="text-sm text-slate-400">
                        {nombreGimnasio}
                    </p>
                </div>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
                <div className="rounded-2xl bg-white p-4">
                    {url && (
                        <QRCodeCanvas
                            ref={canvasRef}
                            value={url}
                            size={240}
                            level="H"
                            includeMargin
                        />
                    )}
                </div>

                <p className="max-w-xl break-all text-center text-sm text-slate-400">
                    {url || "Generando enlace..."}
                </p>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                    <button
                        type="button"
                        onClick={descargarQR}
                        disabled={!url}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        Descargar PNG
                    </button>

                    <button
                        type="button"
                        onClick={imprimirQR}
                        disabled={!url}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir QR
                    </button>
                </div>
            </div>
        </section>
    );
}