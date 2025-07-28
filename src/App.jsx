import React from 'react';
import useArtGenerator from './hooks/useArtGenerator';
import ArtCanvas from './components/ArtCanvas/ArtCanvas';
import Controls from './components/Controls/Controls';
import './App.css';

function App() {
  // CORREÇÃO APLICADA AQUI: Adicionamos 'gridData' à lista de variáveis
  // que estamos recebendo do nosso hook.
  const { gridData, isLoading, loadingStatus, error, generateArt } = useArtGenerator();

  return (
    <div className="App">
      <header>
        <h1>Ateliê</h1>
        <p>Descreva uma visão</p>
      </header>
      
      <Controls 
        onGenerate={generateArt} 
        isLoading={isLoading} 
        loadingStatus={loadingStatus} 
        error={error} 
      />

      <div className="art-container">
        {/* Agora a variável 'gridData' existe e pode ser passada como prop */}
        <ArtCanvas gridData={gridData} isLoading={isLoading} />
      </div>
    </div>
  );
}

export default App;