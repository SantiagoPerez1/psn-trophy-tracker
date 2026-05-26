import "./globals.css";

export const metadata = {
  title: "PlayStation Trophy Tracker | Busca tus Trofeos Pendientes",
  description: "Escribe tu PSN ID para escanear tus juegos, listar tus trofeos bloqueados y ver videotutoriales de YouTube paso a paso para conseguir el Platino.",
  keywords: ["playstation", "psn", "trofeos", "trophy tracker", "youtube guides", "platino", "videojuegos"],
  authors: [{ name: "Santiago Pérez" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
