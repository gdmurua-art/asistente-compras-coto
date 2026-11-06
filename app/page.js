"use client";
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, Settings, Download, AlertCircle, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AsistenteCompras() {
  // --- REGLAS PRE-COMPRA ---
  const [descuentoMP, setDescuentoMP] = useState(25);
  const [topeReintegro, setTopeReintegro] = useState(10000);
  const [excluirAceites, setExcluirAceites] = useState(true);
  
  // --- ESTADO DEL PRODUCTO NUEVO ---
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [esOfertaCoto, setEsOfertaCoto] = useState(false);
  const [esAceite, setEsAceite] = useState(false);

  // --- LISTA DE PRODUCTOS ---
  const [productos, setProductos] = useState([]);
  const [pantalla, setPantalla] = useState('carrito'); // 'carrito' | 'reglas'

  // Cargar productos de localStorage al iniciar
  useEffect(() => {
    const guardados = localStorage.getItem('asistente_compras_items');
    if (guardados) {
      try { setProductos(JSON.parse(guardados)); } catch (e) {}
    }
  }, []);

  // Guardar en localStorage
  useEffect(() => {
    localStorage.setItem('asistente_compras_items', JSON.stringify(productos));
  }, [productos]);

  // --- CÁLCULOS EN TIEMPO REAL ---
  const calcularTotales = () => {
    let totalSinDesc = 0;
    let descMPTotal = 0;

    productos.forEach((p) => {
      const subtotalItem = p.precio * p.cantidad;
      totalSinDesc += subtotalItem;

      // Evaluar si aplica Mercado Pago (25%)
      const esExcluido = (excluirAceites && p.esAceite) || p.esOfertaCoto;
      if (!esExcluido) {
        descMPTotal += subtotalItem * (descuentoMP / 100);
      }
    });

    // Control del tope de reintegro
    const descMPAplicado = topeReintegro > 0 ? Math.min(descMPTotal, topeReintegro) : descMPTotal;
    const totalAPagar = totalSinDesc - descMPAplicado;
    const superoTope = topeReintegro > 0 && descMPTotal >= topeReintegro;

    return { totalSinDesc, descMPTotal: descMPAplicado, totalAPagar, superoTope };
  };

  const { totalSinDesc, descMPTotal, totalAPagar, superoTope } = calcularTotales();

  // --- ACCIONES DE PRODUCTOS ---
  const agregarProducto = (e) => {
    e.preventDefault();
    if (!nombre || !precio) return;

    const nuevoItem = {
      id: Date.now(),
      nombre,
      precio: parseFloat(precio),
      cantidad: parseInt(cantidad) || 1,
      esOfertaCoto,
      esAceite
    };

    setProductos([nuevoItem, ...productos]);
    setNombre('');
    setPrecio('');
    setCantidad(1);
    setEsOfertaCoto(false);
    setEsAceite(false);
  };

  const cambiarCantidad = (id, delta) => {
    setProductos(productos.map(p => {
      if (p.id === id) {
        const nuevaCant = p.cantidad + delta;
        return nuevaCant > 0 ? { ...p, cantidad: nuevaCant } : p;
      }
      return p;
    }));
  };

  const eliminarProducto = (id) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const vaciarLista = () => {
    if (confirm("¿Estás seguro de vaciar toda la lista?")) {
      setProductos([]);
    }
  };

  // --- EXPORTAR PDF ---
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("Lista de Compras - Coto", 14, 15);
    
    const filas = productos.map((p, index) => [
      index + 1,
      p.nombre,
      `$${p.precio.toFixed(2)}`,
      p.cantidad,
      `$${(p.precio * p.cantidad).toFixed(2)}`,
      ((excluirAceites && p.esAceite) || p.esOfertaCoto) ? 'No' : `Sí (${descuentoMP}%)`
    ]);

    doc.autoTable({
      head: [['#', 'Producto', 'Precio U.', 'Cant.', 'Subtotal', 'Desc. MP']],
      body: filas,
      startY: 20
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total sin descuento: $${totalSinDesc.toFixed(2)}`, 14, finalY);
    doc.text(`Descuento MP aplicado: $${descMPTotal.toFixed(2)}`, 14, finalY + 7);
    doc.text(`Total Final a Pagar: $${totalAPagar.toFixed(2)}`, 14, finalY + 14);

    doc.save("resumen_compra_coto.pdf");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-44 max-w-md mx-auto relative font-sans">
      {/* HEADER */}
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 flex justify-between items-center shadow-md">
        <h1 className="font-bold text-lg flex items-center gap-2">
          <ShoppingCart size={22} /> Asistente Coto
        </h1>
        <div className="flex gap-2">
          <button 
            onClick={() => setPantalla(pantalla === 'carrito' ? 'reglas' : 'carrito')}
            className="p-2 bg-blue-700 hover:bg-blue-800 rounded-lg text-sm flex items-center gap-1"
          >
            <Settings size={18} /> {pantalla === 'carrito' ? 'Reglas' : 'Lista'}
          </button>
        </div>
      </header>

      {/* PANTALLA: CONFIGURACIÓN DE REGLAS */}
      {pantalla === 'reglas' ? (
        <div className="p-4 space-y-4">
          <h2 className="font-bold text-base text-slate-700">Reglas de la Compra</h2>
          
          <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Descuento Bancario (%)</label>
              <input 
                type="number" 
                value={descuentoMP} 
                onChange={(e) => setDescuentoMP(Number(e.target.value))}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Tope de Reintegro ($)</label>
              <input 
                type="number" 
                value={topeReintegro} 
                onChange={(e) => setTopeReintegro(Number(e.target.value))}
                className="w-full mt-1 p-2 border rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium">Excluir Aceites de Promo MP</span>
              <input 
                type="checkbox" 
                checked={excluirAceites} 
                onChange={(e) => setExcluirAceites(e.target.checked)}
                className="w-5 h-5 accent-blue-600"
              />
            </div>
          </div>

          <button 
            onClick={() => setPantalla('carrito')}
            className="w-full bg-blue-600 text-white font-semibold p-3 rounded-xl shadow"
          >
            Guardar y Volver al Carrito
          </button>
        </div>
      ) : (
        /* PANTALLA: CARRITO EN VIVO */
        <div className="p-4 space-y-4">
          
          {/* ALERTA TOPE DE REINTEGRO */}
          {superoTope && (
            <div className="bg-amber-100 border border-amber-300 text-amber-800 p-3 rounded-xl flex items-center gap-2 text-xs font-medium">
              <AlertCircle size={18} className="shrink-0" />
              Alcanzaste el tope máximo de reintegro de MP (${topeReintegro}).
            </div>
          )}

          {/* FORMULARIO DE CARGA */}
          <form onSubmit={agregarProducto} className="bg-white p-4 rounded-xl shadow-sm space-y-3">
            <h2 className="font-semibold text-sm text-slate-600">Agregar Producto</h2>
            
            <input 
              type="text" 
              placeholder="Nombre del producto" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-sm"
              required 
            />

            <div className="flex gap-2">
              <input 
                type="number" 
                step="0.01" 
                placeholder="Precio ($)" 
                value={precio} 
                onChange={(e) => setPrecio(e.target.value)}
                className="w-1/2 p-2.5 border rounded-lg text-sm"
                required 
              />
              <input 
                type="number" 
                min="1" 
                value={cantidad} 
                onChange={(e) => setCantidad(e.target.value)}
                className="w-1/2 p-2.5 border rounded-lg text-sm text-center"
              />
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={esOfertaCoto} 
                  onChange={(e) => setEsOfertaCoto(e.target.checked)} 
                  className="accent-blue-600"
                /> Oferta Coto
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={esAceite} 
                  onChange={(e) => setEsAceite(e.target.checked)} 
                  className="accent-blue-600"
                /> Es Aceite
              </label>
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2.5 rounded-lg flex items-center justify-center gap-1 text-sm shadow"
            >
              <Plus size={18} /> Agregar a la lista
            </button>
          </form>

          {/* LISTA DE PRODUCTOS */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 px-1">
              <span>PRODUCTOS ({productos.length})</span>
              {productos.length > 0 && (
                <button onClick={vaciarLista} className="text-red-500 hover:underline flex items-center gap-1">
                  <RefreshCw size={12} /> Vaciar
                </button>
              )}
            </div>

            {productos.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">La lista está vacía. ¡Agregá tu primer producto!</p>
            ) : (
              productos.map((p) => {
                const subtotal = p.precio * p.cantidad;
                const aplicaMP = !((excluirAceites && p.esAceite) || p.esOfertaCoto);

                return (
                  <div key={p.id} className="bg-white p-3 rounded-xl shadow-sm flex justify-between items-center">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm leading-tight">{p.nombre}</p>
                      <p className="text-xs text-slate-500">
                        ${p.precio.toFixed(2)} x {p.cantidad} = <span className="font-bold text-slate-700">${subtotal.toFixed(2)}</span>
                      </p>
                      <div className="flex gap-1 text-[10px]">
                        {aplicaMP ? (
                          <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">MP 25%</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Sin MP</span>
                        )}
                        {p.esOfertaCoto && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Oferta Coto</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-lg bg-slate-50">
                        <button onClick={() => cambiarCantidad(p.id, -1)} className="px-2 py-1 text-xs font-bold text-slate-600">-</button>
                        <span className="px-2 text-xs font-semibold">{p.cantidad}</span>
                        <button onClick={() => cambiarCantidad(p.id, 1)} className="px-2 py-1 text-xs font-bold text-slate-600">+</button>
                      </div>
                      <button onClick={() => eliminarProducto(p.id)} className="text-slate-400 hover:text-red-500 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* FOOTER FIJO CON TOTALES EN VIVO */}
      {pantalla === 'carrito' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto shadow-2xl space-y-2 z-20">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Total sin descuento:</span>
              <span>${totalSinDesc.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Descuento MP estimado:</span>
              <span>-${descMPTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-blue-900 pt-1 border-t">
              <span>Total Final a pagar:</span>
              <span>${totalAPagar.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={exportarPDF} 
            disabled={productos.length === 0}
            className="w-full bg-slate-900 disabled:bg-slate-300 text-white text-xs font-semibold p-2.5 rounded-lg flex items-center justify-center gap-1 shadow"
          >
            <Download size={14} /> Descargar PDF de la Compra
          </button>
        </div>
      )}
    </div>
  );
}
