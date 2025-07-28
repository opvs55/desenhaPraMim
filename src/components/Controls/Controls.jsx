import React, { useState } from 'react';
import './Controls.css';

const Controls = ({ onGenerate, isLoading, loadingStatus, error }) => {
  const [prompt, setPrompt] = useState('Pedro Pinguela Pinguelando depois de pinguelar');

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate(prompt);
  };

  return (
    <form className="controls-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Descreva a arte que você quer criar"
        disabled={isLoading}
      />
      <button type="submit" disabled={isLoading}>
        {/* Mostra o status do processo de 3 etapas */}
        {isLoading ? (loadingStatus || 'Gerando...') : 'Criar Arte'}
      </button>
      {error && <p className="error-message">{error}</p>}
    </form>
  );
};

export default Controls;