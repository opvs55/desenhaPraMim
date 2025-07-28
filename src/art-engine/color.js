/**
 * A palavra-chave 'export' no início desta linha é a solução para o erro.
 * Ela torna a função 'lerpColor' visível para outros arquivos que tentam importá-la.
 */
export function lerpColor(color1, color2, factor) {
  // Validação de Segurança: Garante que as cores são strings antes de processar.
  // Se não forem, retorna uma cor de erro (preto) e avisa no console.
  if (typeof color1 !== 'string' || typeof color2 !== 'string') {
    console.error("Erro Crítico: Tentativa de interpolar cores que не são strings.", { color1, color2 });
    return '#000000'; // Retorna preto para evitar que a aplicação quebre.
  }

  // Função interna para converter a cor hex (ex: "#FF5733") para um número.
  const hex = (c) => parseInt(c.substring(1), 16);
  
  // Validação para garantir que o parse não falhe com strings malformadas (ex: "#FG").
  const c1 = isNaN(hex(color1)) ? 0 : hex(color1);
  const c2 = isNaN(hex(color2)) ? 0 : hex(color2);

  // Extrai os componentes de cor (Vermelho, Verde, Azul) de cada cor.
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  // Calcula a cor intermediária com base no 'factor' (um valor entre 0.0 e 1.0).
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));

  // Remonta a cor em um formato hexadecimal e a retorna.
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}