/**
 * O mostrador de traços — um calibre, e não um anel liso.
 *
 * Trinta e três traços radiais, copiados de `proto/v2/04-executar.html` frame 4, que é
 * o desenho que ele aprovou no Passo A. Acendem-se a volt da ponta de baixo à esquerda
 * no sentido dos ponteiros: na série à medida que ela sobe, no descanso à medida que
 * ele passa — `litTicks` em `run-dial.ts`.
 */
export function DialTicks({ lit }: { lit: number }) {
  const ticks: readonly (readonly [number, number, number, number])[] = [
    [21.8, 80.5, 13.1, 85.5], [19.3, 75.5, 10.0, 79.3], [17.5, 70.1, 7.8, 72.7],
    [16.4, 64.6, 6.5, 65.9], [16.0, 59.0, 6.0, 59.0], [16.4, 53.4, 6.5, 52.1],
    [17.5, 47.9, 7.8, 45.3], [19.3, 42.5, 10.0, 38.7], [21.8, 37.5, 13.1, 32.5],
    [24.9, 32.8, 17.0, 26.7], [28.6, 28.6, 21.5, 21.5], [32.8, 24.9, 26.7, 17.0],
    [37.5, 21.8, 32.5, 13.1], [42.5, 19.3, 38.7, 10.0], [47.9, 17.5, 45.3, 7.8],
    [53.4, 16.4, 52.1, 6.5], [59.0, 16.0, 59.0, 6.0], [64.6, 16.4, 65.9, 6.5],
    [70.1, 17.5, 72.7, 7.8], [75.5, 19.3, 79.3, 10.0], [80.5, 21.8, 85.5, 13.1],
    [85.2, 24.9, 91.3, 17.0], [89.4, 28.6, 96.5, 21.5], [93.1, 32.8, 101.0, 26.7],
    [96.2, 37.5, 104.9, 32.5], [98.7, 42.5, 108.0, 38.7], [100.5, 47.9, 110.2, 45.3],
    [101.6, 53.4, 111.5, 52.1], [102.0, 59.0, 112.0, 59.0], [101.6, 64.6, 111.5, 65.9],
    [100.5, 70.1, 110.2, 72.7], [98.7, 75.5, 108.0, 79.3], [96.2, 80.5, 104.9, 85.5],
  ];
  return (
    <svg className="dial-ticks" width="118" height="118" viewBox="0 0 118 118" aria-hidden="true">
      {ticks.map(([x1, y1, x2, y2], i) => (
        <line
          key={`${x1}-${y1}`}
          className={i < lit ? 'is-on' : undefined}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
        />
      ))}
    </svg>
  );
}
