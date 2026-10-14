import "./globals.css";

export const metadata = {
  title: "Absences de l'équipe",
  description: "Tableau de visibilité des absences de l'équipe",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
