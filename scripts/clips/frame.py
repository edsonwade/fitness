#!/usr/bin/env python3
"""
Encontra o corpo num vídeo de origem e escolhe a janela 9:16 onde ele cabe INTEIRO.
Skill demonstracao-inteira-e-com-mostrador
(.claude/skills/demonstracao-inteira-e-com-mostrador/SKILL.md).

Pedido dele, 2026-09-27: "os vídeos têm que aparecer o corpo todo, a máquina de exercício
... e quando eu colocar novos vídeos que os mesmos aparecem completos."

O que faz, frame a frame (6 por segundo, só no trecho start–end):
  · MediaPipe Pose (pose_landmarker_heavy) dá os 33 pontos do corpo;
  · o detetor de objetos (efficientdet_lite0) dá a caixa da "person" — apanha o que a pose
    falha (gente deitada) e o haltere na mão;
  · a caixa do corpo é a união das duas.

Com as caixas de todos os frames:
  · CORPO  = a união, mais 8% de margem em altura e 12% de lado (a máquina e o peso);
  · JANELA = 9:16 com a altura INTEIRA da origem, centrada no corpo — nunca se aperta ao
    corpo, porque a máquina está à volta dele (ele, 2026-09-27: "tem que aparecer o corpo
    todo e a máquina de exercícios"). Só fica mais alta do que a origem quando o corpo é
    mais largo do que 9:16 deixa; o que sobra enche-se com o clipe desfocado (make.mjs).

O PORTÃO — o clipe chumba, e diz porquê, se:
  · a própria origem corta o corpo em mais de 10% dos frames: um ponto-chave (nariz,
    ombros, ancas, pulsos, tornozelos) fora da imagem, ou a cabeça ou os pés que não se
    veem de todo (clipe só das pernas, pessoa cortada nas ancas);
  · não se encontra ninguém em mais de 25% dos frames.

Uso:   .venv/bin/python scripts/clips/frame.py <ficheiro> <start> <end>
Saída: JSON no stdout — { src, body, window, fill, frames, fails[] }
       coordenadas em frações da origem; a janela pode sair de [0,1] (lado a encher).
"""
import json
import os
import sys

import cv2
import mediapipe as mp
from mediapipe.tasks.python import BaseOptions, vision

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, '.cache', 'models')

MARGIN = 0.08
# De lado, a máquina e o peso estão ao lado do corpo: margem maior.
MARGIN_X = 0.12
SAMPLE_FPS = 6
# Nariz, ombros, pulsos, ancas, tornozelos.
KEY = (0, 11, 12, 15, 16, 23, 24, 27, 28)
# O que tem de se VER em cada frame: a cabeça (nariz, olhos, orelhas) e os pés (tornozelos,
# calcanhares, pontas).
PARTS = {'cabeça à vista': (0, 2, 5, 7, 8), 'pés à vista': (27, 28, 29, 30, 31, 32)}
EDGE = 0.004


def detectors():
    pose = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
        base_options=BaseOptions(model_asset_path=os.path.join(MODELS, 'pose_landmarker_heavy.task')),
        running_mode=vision.RunningMode.IMAGE,
        num_poses=1,
        min_pose_detection_confidence=0.4,
    ))
    obj = vision.ObjectDetector.create_from_options(vision.ObjectDetectorOptions(
        base_options=BaseOptions(model_asset_path=os.path.join(MODELS, 'efficientdet_lite0.tflite')),
        running_mode=vision.RunningMode.IMAGE,
        category_allowlist=['person'],
        score_threshold=0.35,
        max_results=3,
    ))
    return pose, obj


def union(a, b):
    if a is None:
        return b
    if b is None:
        return a
    return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]


def analyse(path, start, end):
    cap = cv2.VideoCapture(path)
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    pose, obj = detectors()

    body = None
    seen = cut = total = 0
    cut_why = {}
    t = start
    while t <= end:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, frame = cap.read()
        t += 1 / SAMPLE_FPS
        if not ok:
            continue
        total += 1
        img = mp.Image(image_format=mp.ImageFormat.SRGB, data=cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

        box = None
        is_cut = False
        res = pose.detect(img)
        if res.pose_landmarks:
            lms = res.pose_landmarks[0]
            pts = [(p.x, p.y) for p in lms if (p.visibility or 0) > 0.5]
            if pts:
                xs, ys = zip(*pts)
                box = [min(xs), min(ys), max(xs), max(ys)]
            for i in KEY:
                p = lms[i]
                if (p.presence or 0) > 0.5 and not (EDGE < p.x < 1 - EDGE and EDGE < p.y < 1 - EDGE):
                    is_cut = True
                    cut_why[i] = cut_why.get(i, 0) + 1
            # Não chega nenhum ponto sair: a cabeça e os pés têm de ESTAR na imagem. Um
            # clipe só das pernas (calfs) ou cortado nas ancas (dip) não tinha ponto
            # nenhum fora — a pose nem os punha lá — e passava (2026-09-27).
            for part, group in PARTS.items():
                if not any((lms[i].visibility or 0) > 0.5 and EDGE < lms[i].x < 1 - EDGE
                           and EDGE < lms[i].y < 1 - EDGE for i in group):
                    is_cut = True
                    cut_why[part] = cut_why.get(part, 0) + 1
        else:
            is_cut = True
            cut_why['pose'] = cut_why.get('pose', 0) + 1

        det = obj.detect(img)
        if det.detections:
            bb = max(det.detections, key=lambda d: d.bounding_box.width * d.bounding_box.height).bounding_box
            pbox = [bb.origin_x / W, bb.origin_y / H, (bb.origin_x + bb.width) / W, (bb.origin_y + bb.height) / H]
            # A caixa da pessoa encostada à borda NÃO é corte: quase todas as origens vêm
            # justas (cabeça no topo, braços nos lados, pés no fundo) e o corpo está à vista.
            # São os pontos-chave da pose, fora da imagem, que dizem se a origem corta.
            box = union(box, pbox)

        if box is None:
            continue
        seen += 1
        cut += is_cut
        body = union(body, [max(0.0, box[0]), max(0.0, box[1]), min(1.0, box[2]), min(1.0, box[3])])

    cap.release()
    return W, H, fps, body, total, seen, cut, cut_why


NAMES = {0: 'cabeça', 11: 'ombro', 12: 'ombro', 15: 'pulso', 16: 'pulso', 23: 'anca', 24: 'anca',
         27: 'tornozelo', 28: 'tornozelo', 'cabeça à vista': 'cabeça', 'pés à vista': 'pés',
         'pose': 'corpo não reconhecido'}


def window_for(W, H, body):
    """A janela 9:16 que mostra TUDO o que a origem mostra à volta do corpo.

    Pedido dele, 2026-09-27: "tem que aparecer o corpo todo e a máquina de exercícios".
    Nada de apertar a janela ao corpo — a máquina está à volta dele. A janela usa a
    altura INTEIRA da origem; só fica mais alta do que ela quando o corpo (mais a margem
    para a máquina) é mais largo do que 9:16 deixa, e aí o que sobra em cima e em baixo
    enche-se com o próprio clipe desfocado (make.mjs). Nunca se corta nada que a origem
    tenha do corpo nem da máquina.
    """
    bx0, by0, bx1, by1 = body[0] * W, body[1] * H, body[2] * W, body[3] * H
    mx, my = (bx1 - bx0) * MARGIN_X, (by1 - by0) * MARGIN
    # A margem só vai até onde a origem tem imagem: para lá dela não há máquina nenhuma,
    # só fundo desfocado, e a origem encolhia num cartão (a foto do Hip Thrust dele).
    bx0, bx1 = max(bx0 - mx, 0), min(bx1 + mx, W)
    by0, by1 = max(by0 - my, 0), min(by1 + my, H)
    wh = max(H, by1 - by0)
    ww = wh * 9 / 16
    if ww < bx1 - bx0:
        ww = bx1 - bx0
        wh = ww * 16 / 9
    cx, cy = (bx0 + bx1) / 2, (by0 + by1) / 2
    x0 = cx - ww / 2
    x0 = min(max(x0, 0), W - ww) if ww <= W else (W - ww) / 2
    y0 = 0 if wh <= H else min(max(cy - wh / 2, H - wh), 0)
    return [x0 / W, y0 / H, ww / W, wh / H]


def main():
    path, start, end = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
    W, H, fps, body, total, seen, cut, cut_why = analyse(path, start, end)
    fails = []
    out = {'src': [W, H], 'frames': total, 'seen': seen, 'cut': cut}
    if total == 0 or seen < total * 0.75:
        fails.append(f'não se encontra ninguém em {total - seen} de {total} frames')
    if cut > total * 0.10:
        parts = sorted({NAMES[k] for k, n in cut_why.items() if n > total * 0.05})
        fails.append(f'a origem corta o corpo em {cut} de {total} frames ({", ".join(parts) or "borda"} fora da imagem)')
    if body:
        win = window_for(W, H, body)
        # Quanto da altura da janela é imagem verdadeira da origem.
        top, bottom = max(win[1], 0), min(win[1] + win[3], 1)
        fill = (bottom - top) / win[3]
        out.update(body=[round(v, 4) for v in body], window=[round(v, 4) for v in win], fill=round(fill, 3))
    out['fails'] = fails
    print(json.dumps(out))


if __name__ == '__main__':
    main()
