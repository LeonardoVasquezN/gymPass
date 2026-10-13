"use client";

import { guardarConfiguracion } from "./actions";

type FormularioConfiguracionProps = {
  nombre: string;
  telefono: string | null;
  qrYapeUrl: string | null;
  qrPlinUrl: string | null;
};

export default function FormularioConfiguracion({
nombre,
telefono,
qrYapeUrl,
qrPlinUrl,
}: FormularioConfiguracionProps) {
return ( 
  <form action={guardarConfiguracion} className="space-y-8">
    <section className="rounded-2xl border border-gray-200 bg- p-6 shadow-sm">
    <h2 className="text-lg font-semibold text-white-900">Datos del gimnasio </h2>
      <p className="mt-1 text-sm text-white-500">
        Actualiza la información básica de tu negocio.
      </p>

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="nombre"
            className="mb-2 block text-sm font-medium text-white-700"
          >
            Nombre del gimnasio
          </label>

          <input
            id="nombre"
            name="nombre"
            type="text"
            defaultValue={nombre}
            minLength={2}
            maxLength={120}
            required
            placeholder="Ej. GymPass Fitness"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div>
          <label
            htmlFor="telefono"
            className="mb-2 block text-sm font-medium text-white-700"
          >
            Teléfono de contacto
          </label>

          <input
            id="telefono"
            name="telefono"
            type="tel"
            defaultValue={telefono ?? ""}
            maxLength={20}
            placeholder="Ej. 987654321"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <p className="mt-2 text-xs text-gray-500">
            Este campo es opcional.
          </p>
        </div>
      </div>
    </section>

    <section className="rounded-2xl border border-gray-200 bg- p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-white-900">
        Códigos QR de pago
      </h2>

      <p className="mt-1 text-sm text-white-500">
        Sube las imágenes que se mostrarán cuando un cliente
        necesite pagar su membresía.
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-white-900">
            QR de Yape
          </h3>

          <div className="mt-4 flex min-h-40 items-center justify-center rounded-xl bg--50 p-4">
            {qrYapeUrl ? (
              <img
                src={qrYapeUrl}
                alt="Código QR de Yape actual"
                className="h-36 w-36 object-contain"
              />
            ) : (
              <p className="text-center text-sm text-gray-500">
                Todavía no has registrado un QR de Yape.
              </p>
            )}
          </div>

          <label
            htmlFor="qrYape"
            className="mb-2 mt-4 block text-sm font-medium text-gray-700"
          >
            {qrYapeUrl
              ? "Reemplazar imagen"
              : "Seleccionar imagen"}
          </label>

          <input
            id="qrYape"
            name="qrYape"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-purple-50 file:px-4 file:py-2 file:font-medium file:text-purple-700 hover:file:bg-purple-100"
          />

          <p className="mt-2 text-xs text-gray-500">
            PNG, JPG o WebP. Máximo 1 MB.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-white-900">
            QR de Plin
          </h3>

          <div className="mt-4 flex min-h-40 items-center justify-center rounded-xl bg--50 p-4">
            {qrPlinUrl ? (
              <img
                src={qrPlinUrl}
                alt="Código QR de Plin actual"
                className="h-36 w-36 object-contain"
              />
            ) : (
              <p className="text-center text-sm text-gray-500">
                Todavía no has registrado un QR de Plin.
              </p>
            )}
          </div>

          <label
            htmlFor="qrPlin"
            className="mb-2 mt-4 block text-sm font-medium text-gray-700"
          >
            {qrPlinUrl
              ? "Reemplazar imagen"
              : "Seleccionar imagen"}
          </label>

          <input
            id="qrPlin"
            name="qrPlin"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-medium file:text-blue-700 hover:file:bg-blue-100"
          />

          <p className="mt-2 text-xs text-gray-500">
            PNG, JPG o WebP. Máximo 1 MB.
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm text-gray-500">
        Si no seleccionas una imagen nueva, se conservará el QR actual.
      </p>
    </section>

    <div className="flex justify-end">
      <button
        type="submit"
        className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Guardar configuración
      </button>
    </div>
  </form>
  );
}