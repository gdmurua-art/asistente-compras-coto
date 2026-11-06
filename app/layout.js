import "./globals.css";

export const metadata = {
  title: "Asistente de Compras Coto",
  description: "Calculadora de compras y control de descuentos en vivo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="bg-slate-100 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}
