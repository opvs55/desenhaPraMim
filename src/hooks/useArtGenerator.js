import { useState, useRef, useEffect } from 'react';
import { fetchArtisticScene } from '../api/gemini';
import { renderShapesToGrid } from '../art-engine/pixel-renderer';

const useArtGenerator = () => {
  const [scene, setScene] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [error, setError] = useState(null);

  const animationFrameId = useRef(null);
  const timeoutId = useRef(null);
  const frameIndex = useRef(0);

  // CORREÇÃO: A lógica de animação foi movida para um useEffect dedicado.
  useEffect(() => {
    // Se não houver cena, não faz nada e garante que animações antigas parem.
    if (!scene) {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (timeoutId.current) clearTimeout(timeoutId.current);
      return;
    }

    // A função que roda a cada quadro da animação.
    const animate = () => {
      // Renderiza o quadro atual.
      const currentGrid = renderShapesToGrid(scene, frameIndex.current);
      setGridData(currentGrid);

      // Avança para o próximo quadro, fazendo um loop.
      frameIndex.current = (frameIndex.current + 1) % scene.frames.length;

      // Agenda a próxima execução.
      timeoutId.current = setTimeout(() => {
        animationFrameId.current = requestAnimationFrame(animate);
      }, 150); // Velocidade da animação.
    };

    // Inicia a animação.
    frameIndex.current = 0; // Reseta para o primeiro quadro.
    animate();

    // A função de limpeza que é executada quando o `scene` muda ou o componente é desmontado.
    return () => {
      cancelAnimationFrame(animationFrameId.current);
      clearTimeout(timeoutId.current);
    };
  }, [scene]); // O useEffect agora depende APENAS do `scene`.

  const generateArt = async (prompt) => {
    setIsLoading(true);
    setError(null);
    // CORREÇÃO: Limpa o estado da cena, o que irá acionar a limpeza do useEffect acima.
    setScene(null); 
    setGridData(null);
    
    try {
      const newScene = await fetchArtisticScene(prompt, setLoadingStatus);
      // Define a nova cena, o que acionará o início de uma nova animação no useEffect.
      setScene(newScene);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { gridData, isLoading, loadingStatus, error, generateArt };
};

export default useArtGenerator;