export default function OfflinePage() {
  return (
    <main
      style={{
        backgroundColor: '#1a1a1a',
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        padding: '2rem',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Estás sin conexión</h1>
      <p style={{ maxWidth: '400px' }}>
        No pudimos cargar esta sección de la aplicación. Revisa tu conexión a internet y vuelve a intentarlo.
      </p>
    </main>
  );
}
