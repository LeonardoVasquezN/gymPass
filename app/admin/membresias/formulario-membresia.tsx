"use client";

import { useEffect, useState } from "react";
import { crearMembresia } from "./actions";

type ClienteFormulario = {
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  ultimaFechaVencimiento: string | null;
};

type Props = {
  clientes: ClienteFormulario[];
  hoy: string;
};

function sumarMeses(inicioTexto: string, meses: number): string {
  const inicio = new Date(`${inicioTexto}T00:00:00.000Z`);
  const dia = inicio.getUTCDate();

  inicio.setUTCDate(1);
  inicio.setUTCMonth(inicio.getUTCMonth() + meses);

  const ultimoDia = new Date(
    Date.UTC(
      inicio.getUTCFullYear(),
      inicio.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  inicio.setUTCDate(Math.min(dia, ultimoDia));
  inicio.setUTCDate(inicio.getUTCDate() - 1);

  return inicio.toISOString().slice(0, 10);
}

function obtenerInicio(
  hoy: string,
  ultimaFechaVencimiento: string | null
): string {
  if (!ultimaFechaVencimiento) return hoy;

  const diaSiguiente = new Date(
    `${ultimaFechaVencimiento}T00:00:00.000Z`
  );

  diaSiguiente.setUTCDate(diaSiguiente.getUTCDate() + 1);

  const siguienteTexto = diaSiguiente.toISOString().slice(0, 10);

  return siguienteTexto > hoy ? siguienteTexto : hoy;
}

function fechaLegible(fecha: string): string {
  if (!fecha) return "—";

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T00:00:00.000Z`));
}

export default function FormularioMembresia({
  clientes,
  hoy,
}: Props) {
  const [clienteId, setClienteId] = useState("");
  const [tipoDuracion, setTipoDuracion] = useState<"meses" | "personalizada">("meses");
  const [duracionMeses, setDuracionMeses] = useState("1");
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  const clienteSeleccionado = clientes.find(
    (cliente) => cliente.id === clienteId
  );

  const fechaInicio = obtenerInicio(
    hoy,
    clienteSeleccionado?.ultimaFechaVencimiento ?? null
  );

  const vencimientoCalculado =
    tipoDuracion === "meses"
      ? sumarMeses(fechaInicio, Number(duracionMeses))
      : fechaVencimiento;

  useEffect(() => {
    if (fechaVencimiento && fechaVencimiento < fechaInicio) {
      setFechaVencimiento("");
    }
  }, [fechaInicio, fechaVencimiento]);

  const campo =
    "mt-2 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

  return (
    <form
      action={crearMembresia}
      className="mt-6 grid gap-5 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <label
          htmlFor="clienteId"
          className="block text-sm font-medium text-gray-200"
        >
          Cliente
        </label>

        <select
          id="clienteId"
          name="clienteId"
          required
          value={clienteId}
          onChange={(event) => setClienteId(event.target.value)}
          className={campo}
        >
          <option value="">Selecciona un cliente</option>

          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.apellidos}, {cliente.nombres} · DNI{" "}
              {cliente.dni}
            </option>
          ))}
        </select>

        {clientes.length === 0 && (
          <p className="mt-2 text-sm text-gray-400">
            No hay clientes activos para registrar membresías.
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor="tipoDuracion"
          className="block text-sm font-medium text-gray-200"
        >
          Tipo de duración
        </label>

        <select
          id="tipoDuracion"
          name="tipoDuracion"
          value={tipoDuracion}
          onChange={(event) =>
            setTipoDuracion(
              event.target.value as "meses" | "personalizada"
            )
          }
          className={campo}
        >
          <option value="meses">Rápida: por meses</option>
          <option value="personalizada">
            Personalizada: elegir vencimiento
          </option>
        </select>
      </div>

      <div className="sm:col-span-2 rounded-xl border border-gray-800 bg-gray-900 p-4">
        <p className="text-sm text-gray-400">
          Fecha de inicio calculada
        </p>

        <p className="mt-1 font-semibold text-white">
          {fechaLegible(fechaInicio)}
        </p>

        <p className="mt-2 text-xs text-gray-500">
          {clienteSeleccionado?.ultimaFechaVencimiento &&
          clienteSeleccionado.ultimaFechaVencimiento >= hoy
            ? "Se conservarán los días de la membresía anterior."
            : "La nueva membresía comienza hoy."}
        </p>
      </div>

      {tipoDuracion === "meses" ? (
        <div className="sm:col-span-2">
          <label
            htmlFor="duracionMeses"
            className="block text-sm font-medium text-gray-200"
          >
            Duración
          </label>

          <select
            id="duracionMeses"
            name="duracionMeses"
            value={duracionMeses}
            onChange={(event) =>
              setDuracionMeses(event.target.value)
            }
            className={campo}
          >
            <option value="1">1 mes</option>
            <option value="2">2 meses</option>
            <option value="3">3 meses</option>
            <option value="6">6 meses</option>
            <option value="12">12 meses (1 año)</option>
          </select>

          <p className="mt-2 text-sm text-gray-400">
            Vencimiento calculado:{" "}
            <strong className="text-lime-300">
              {fechaLegible(vencimientoCalculado)}
            </strong>
          </p>
        </div>
      ) : (
        <div className="sm:col-span-2">
          <label
            htmlFor="fechaVencimiento"
            className="block text-sm font-medium text-gray-200"
          >
            Último día de vigencia
          </label>

          <input
            id="fechaVencimiento"
            name="fechaVencimiento"
            type="date"
            min={fechaInicio}
            required
            value={fechaVencimiento}
            onChange={(event) =>
              setFechaVencimiento(event.target.value)
            }
            className={campo}
          />

          <p className="mt-2 text-sm text-gray-400">
            Elige una fecha igual o posterior al inicio calculado.
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor="monto"
          className="block text-sm font-medium text-gray-200"
        >
          Monto pagado (S/)
        </label>

        <input
          id="monto"
          name="monto"
          type="number"
          min="0.01"
          max="99999999.99"
          step="0.01"
          required
          className={campo}
        />
      </div>

      <div>
        <label
          htmlFor="metodoPago"
          className="block text-sm font-medium text-gray-200"
        >
          Método de pago
        </label>

        <select
          id="metodoPago"
          name="metodoPago"
          required
          defaultValue="EFECTIVO"
          className={campo}
        >
          <option value="EFECTIVO">Efectivo</option>
          <option value="YAPE">Yape</option>
          <option value="PLIN">Plin</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="TARJETA">Tarjeta</option>
          <option value="OTRO">Otro</option>
        </select>
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor="observaciones"
          className="block text-sm font-medium text-gray-200"
        >
          Observaciones (opcional)
        </label>

        <textarea
          id="observaciones"
          name="observaciones"
          rows={3}
          maxLength={1000}
          className={campo}
        />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={clientes.length === 0}
          className="w-full rounded-xl bg-lime-400 px-5 py-3 font-semibold text-gray-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Registrar membresía
        </button>
      </div>
    </form>
  );
}