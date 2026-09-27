"""A nitidez de um clipe feito — skill demonstracao-inteira-e-com-mostrador, T5
(.claude/skills/demonstracao-inteira-e-com-mostrador/PLANO.md).

Ele, 2026-09-27 21:30: "não podemos ter vídeos com má qualidade". O curl martelo saía
esborratado: a origem 606x1080 ampliada, e já mole à partida.

Mede a variância do Laplaciano em oito frames do clipe, SÓ na parte que vem da origem
(x, y, w, h em píxeis do 720x1280) — as faixas de fundo desfocado não contam, que são
moles de propósito. Imprime um número: a média.

Uso: quality.py <clipe.mp4> <x> <y> <w> <h>
"""

import sys

import cv2

path, x, y, w, h = sys.argv[1], *map(int, sys.argv[2:6])
cap = cv2.VideoCapture(path)
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
vals = []
for k in range(8):
    cap.set(cv2.CAP_PROP_POS_FRAMES, int(n * (k + 0.5) / 8))
    ok, frame = cap.read()
    if not ok:
        continue
    grey = cv2.cvtColor(frame[y : y + h, x : x + w], cv2.COLOR_BGR2GRAY)
    vals.append(cv2.Laplacian(grey, cv2.CV_64F).var())
if not vals:
    sys.exit(f"{path}: sem frames")
print(round(sum(vals) / len(vals), 1))
