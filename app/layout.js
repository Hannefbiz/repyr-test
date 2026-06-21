export const metadata = {
  title: 'Repyr - AI Mechanic',
  description: 'AI-powered automotive diagnostics and booking in the UAE',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#f7fafc' }}>
        {children}
      </body>
    </html>
  )
}