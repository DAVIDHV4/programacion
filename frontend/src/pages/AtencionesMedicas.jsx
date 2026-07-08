import React from 'react';

const AtencionesMedicas = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 'calc(100vh - 100px)',
      backgroundColor: '#f8f9fa',
      color: '#0D3049',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '10px', marginTop: '0' }}>🚧</h1>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '15px' }}>
        Módulo en Construcción
      </h2>
      <p style={{ fontSize: '1.2rem', color: '#8B8889', maxWidth: '500px', lineHeight: '1.5' }}>
        Esta función estará disponible muy pronto.
      </p>
    </div>
  );
};

export default AtencionesMedicas;