import React, { memo, useEffect, useRef } from 'react';
import './ArtCanvas.css';

const ArtCanvas = memo(({ gridData, isLoading }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gridData || gridData.length === 0) return;

    const ctx = canvas.getContext('2d');
    const rows = gridData.length;
    const cols = gridData[0].length;
    
    // Ajusta a resolução interna do canvas para corresponder aos dados
    canvas.width = cols;
    canvas.height = rows;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        ctx.fillStyle = gridData[y][x];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }, [gridData]); // Re-desenha sempre que o gridData mudar

  return (
    <div className={`art-canvas-container ${isLoading ? 'loading' : ''}`}>
      {isLoading && <div className="loading-overlay"><span>Fumando Maconha...</span></div>}
      <canvas ref={canvasRef} className="pixel-art-canvas"></canvas>
    </div>
  );
});

export default ArtCanvas;