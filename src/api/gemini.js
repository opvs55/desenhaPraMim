import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
if (!API_KEY) throw new Error("VITE_GEMINI_API_KEY não encontrada.");

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

// --- ETAPA 1: O CONCEITO ---
const createAnalysisPrompt = (userPrompt) => `
  Você é um diretor de arte. Analise o pedido do usuário para criar uma obra de pixel art.
  Pedido: "${userPrompt}"
  Sua resposta DEVE ser um JSON com: "artStyle", "emotion", "mainSubjects", "palette", e uma "descriptionForNextStep" para o Desenhista de Formas.
`;

// --- ETAPA 2: A COMPOSIÇÃO DE FORMAS (COM REGRAS MAIS RÍGIDAS) ---
const createVectorShapesPrompt = (analysis) => `
  Você é um artista vetorial que pensa em volume e textura. Baseado no plano, crie as formas que compõem a cena.

  Plano: "${analysis.descriptionForNextStep}"
  Paleta: ${JSON.stringify(analysis.palette)}

  Sua resposta DEVE ser um JSON com "gridDimensions", "background", e "shapes".
  Para cada forma na matriz "shapes", defina um "type" ("rect" ou "circle") e um "fill".

  O objeto "fill" determina como a forma é preenchida. Use estes tipos:
  1.  **{ "type": "solid", "color": "#hex" }**: Para uma cor chapada. A cor DEVE SER uma string hexadecimal VÁLIDA (ex: '#FFFFFF'). NÃO use descrições de cores.
  2.  **{ "type": "linear-gradient", "colors": ["#hex1", "#hex2"], "angle": Number (graus) }**: Para criar volume e sombra.
  3.  **{ "type": "dither", "colors": ["#hex1", "#hex2"] }**: Para criar uma textura granulada.

  Para os parâmetros de cada forma:
  - Para "rect": { "x": Number, "y": Number, "width": Number, "height": Number }
  - Para "circle": { "x": Number, "y": Number, "radius": Number }
  **IMPORTANTE: Para círculos, use as chaves 'x' e 'y' para as coordenadas do centro. NÃO use 'cx' ou 'cy'.**

  Exemplo:
  {
    "gridDimensions": { "width": 128, "height": 128 },
    "background": "#0d1b2a",
    "shapes": [
      {
        "type": "circle",
        "x": 64, "y": 64, "radius": 40,
        "fill": { "type": "solid", "color": "#778da9" }
      }
    ],
    "descriptionForNextStep": "A forma principal de um rosto com volume está definida. Se a animação for apropriada, faça-a pulsar suavemente."
  }
`;

// --- ETAPA 3: ANIMAÇÃO (OPCIONAL) ---
const createAnimationPrompt = (composition) => `
  Você é um animador. A cena base está definida por estas formas: ${JSON.stringify(composition.shapes)}.
  O pedido é: "${composition.descriptionForNextStep}".
  Se nenhuma animação for necessária, retorne um JSON com "animated": false.
  Se for animar, retorne um JSON com "animated": true e "frames" (uma matriz de listas de formas). Modifique ligeiramente a posição ou o preenchimento das formas entre os quadros.
`;

// --- FUNÇÃO ORQUESTRADORA ---
export const fetchArtisticScene = async (userPrompt, updateStatus) => {
  const extractAndCleanJson = (rawText, stepName) => {
    console.log(`Resposta Bruta da Etapa (${stepName}):`, rawText);
    const withoutComments = rawText.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const firstBrace = withoutComments.indexOf('{');
    const lastBrace = withoutComments.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      throw new Error(`A resposta da IA na etapa '${stepName}' não continha um JSON válido.`);
    }
    const jsonString = withoutComments.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      console.error(`Falha ao parsear o JSON purificado na etapa ${stepName}:`, jsonString);
      throw new Error(`Erro de sintaxe no JSON da IA na etapa ${stepName}: ${e.message}`);
    }
  };

  try {
    updateStatus('Etapa 1/3: Analisando o conceito...');
    const analysisResponse = await model.generateContent(createAnalysisPrompt(userPrompt));
    const analysisResult = extractAndCleanJson(analysisResponse.response.text(), 'Análise');
    
    updateStatus('Etapa 2/3: Desenhando as formas...');
    const shapesResponse = await model.generateContent(createVectorShapesPrompt(analysisResult));
    const shapesResult = extractAndCleanJson(shapesResponse.response.text(), 'Formas');
    shapesResult.descriptionForNextStep = analysisResult.descriptionForNextStep || "Continue a criação.";

    updateStatus('Etapa 3/3: Aplicando animação...');
    const animationResponse = await model.generateContent(createAnimationPrompt(shapesResult));
    const animationResult = extractAndCleanJson(animationResponse.response.text(), 'Animação');

    const finalScene = {
      gridDimensions: shapesResult.gridDimensions,
      background: shapesResult.background,
      frames: animationResult.animated ? animationResult.frames : [shapesResult.shapes],
    };
    
    console.log("Cena final construída!", finalScene);
    return finalScene;

  } catch (error) {
    console.error("Erro no pipeline de geração:", error);
    throw new Error(error.message || `Falha ao gerar a arte. Tente novamente.`);
  }
};