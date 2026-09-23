import { useEffect, useRef, useState } from 'react';

import { useUpsertRow } from '../../data/mutations';
import { useLocale } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import { Stepper } from '../../ui/Stepper';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { MEALS, type Meal } from './nutrition';

/**
 * Registar uma refeição — `proto/v2/06-nutricao.html` frames 2 e 3.
 *
 * A câmara: galeria à esquerda, obturador ao centro, lupa à direita, a marca em cima, o chip
 * de precisão, e os quatro modos — Voz · Texto · IA · Código —, cada um com o seu painel.
 * Tocar num modo muda o ecrã.
 *
 * O que cada modo faz de verdade, e o que não faz:
 *  - **Voz**: o reconhecimento de fala do browser transcreve; a transcrição é estimativa.
 *  - **Texto**: texto livre — o único sítio onde o teclado é permitido.
 *  - **IA**: tira a fotografia. A estimativa automática por foto ainda não está ligada, e o
 *    ecrã di-lo; os números acertam-se no passo seguinte e ficam marcados como estimativa.
 *  - **Código**: o `BarcodeDetector` do browser lê o código e a Open Food Facts devolve os
 *    valores por 100 g — medidos, não estimados.
 *
 * Confirmar (frame 3): a estimativa diz que é estimativa; os macros corrigem-se por stepper.
 */
type Mode = 'voice' | 'text' | 'ai' | 'code';

type Draft = {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: Mode;
  estimate: boolean;
  barcode: string | null;
  photo: string | null;
};

const EMPTY: Draft = {
  name: '',
  kcal: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  source: 'text',
  estimate: true,
  barcode: null,
  photo: null,
};

type Recognition = {
  lang: string;
  interimResults: boolean;
  onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};
type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

function speechCtor(): (new () => Recognition) | null {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function detectorCtor(): (new (o: { formats: string[] }) => Detector) | null {
  const w = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector };
  return w.BarcodeDetector ?? null;
}

const LANG_TAG = { pt: 'pt-PT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR' } as const;

export function Capture({
  date,
  meal: initialMeal,
  quick = false,
  onClose,
}: {
  date: string;
  meal: Meal;
  /** "Calorias rápidas": direto ao confirmar, só com o número. */
  quick?: boolean;
  onClose: () => void;
}) {
  const { locale, t: copy } = useLocale();
  const t = copy.nutrition;
  const upsert = useUpsertRow('food_entries');
  const [mode, setMode] = useState<Mode>('ai');
  const [stage, setStage] = useState<'camera' | 'confirm'>(quick ? 'confirm' : 'camera');
  const [draft, setDraft] = useState<Draft>(quick ? { ...EMPTY, name: t.tabQuick } : EMPTY);
  const [meal, setMeal] = useState<Meal>(initialMeal);
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [camOk, setCamOk] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recRef = useRef<Recognition | null>(null);

  const usesCamera = stage === 'camera' && (mode === 'ai' || mode === 'code');
  /* Sem `BarcodeDetector` o modo Código di-lo, em vez de apontar a câmara a nada. */
  const shown = status ?? (mode === 'code' && !detectorCtor() ? t.codeUnsupported : null);

  /* A câmara, só enquanto um modo de câmara está à frente. */
  useEffect(() => {
    if (!usesCamera) return;
    let stream: MediaStream | null = null;
    let cancelled = false;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((tr) => tr.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play().catch(() => undefined);
        }
        setCamOk(true);
      })
      .catch(() => setCamOk(false));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((tr) => tr.stop());
    };
  }, [usesCamera]);

  /* Código: ler o código de barras do vídeo, e procurar o produto. */
  useEffect(() => {
    if (stage !== 'camera' || mode !== 'code' || !camOk) return;
    const Ctor = detectorCtor();
    if (!Ctor) return;
    const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });
    let busy = false;
    let stopped = false;
    const id = window.setInterval(async () => {
      if (busy || stopped || !videoRef.current || videoRef.current.readyState < 2) return;
      busy = true;
      try {
        const [hit] = await detector.detect(videoRef.current);
        if (hit?.rawValue) {
          stopped = true;
          setStatus(t.codeLooking);
          const found = await lookup(hit.rawValue);
          if (found) {
            setDraft({ ...EMPTY, ...found, source: 'code', estimate: false, barcode: hit.rawValue });
            setStage('confirm');
          } else {
            setStatus(t.codeNotFound);
          }
        }
      } catch {
        /* um frame que não se leu; o seguinte tenta outra vez */
      } finally {
        busy = false;
      }
    }, 450);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [stage, mode, camOk, t.codeLooking, t.codeNotFound]);

  function switchMode(next: Mode) {
    recRef.current?.stop();
    setListening(false);
    setStatus(null);
    setMode(next);
  }

  function listen() {
    const Ctor = speechCtor();
    if (!Ctor) {
      setStatus(t.voiceUnsupported);
      return;
    }
    const rec = new Ctor();
    rec.lang = LANG_TAG[locale];
    rec.interimResults = false;
    rec.onresult = (e) => {
      const said = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (said) {
        setDraft({ ...EMPTY, name: said, source: 'voice', estimate: true });
        setStage('confirm');
      }
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  function snap() {
    const video = videoRef.current;
    let photo: string | null = null;
    if (video && video.videoWidth) {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = Math.round((480 * video.videoHeight) / video.videoWidth);
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
      photo = canvas.toDataURL('image/jpeg', 0.7);
    }
    setDraft({ ...EMPTY, source: 'ai', estimate: true, photo });
    setStage('confirm');
  }

  function fromGallery(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setDraft({ ...EMPTY, source: 'ai', estimate: true, photo: String(reader.result) });
      setStage('confirm');
    };
    reader.readAsDataURL(file);
  }

  function save() {
    const name = draft.name.trim() || text.trim();
    if (!name) return;
    upsert.save({
      id: crypto.randomUUID(),
      local_date: date,
      meal,
      name,
      kcal: Math.round(draft.kcal),
      protein_g: draft.protein,
      carbs_g: draft.carbs,
      fat_g: draft.fat,
      source: draft.source,
      estimate: draft.estimate,
      barcode: draft.barcode,
    });
    onClose();
  }

  const modeLabel: Record<Mode, string> = { voice: t.voice, text: t.text, ai: t.ai, code: t.code };

  if (stage === 'confirm') {
    const name = draft.name || text;
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ground" role="dialog" aria-modal="true" aria-label={t.logMeal}>
        {draft.photo ? (
          <div className="relative h-[240px] shrink-0">
            <img src={draft.photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="screen-pad stack mx-auto w-full max-w-[26.5rem] pb-10 pt-4">
          <div className="row-between">
            <button type="button" className="btn btn-icon" aria-label={t.close} onClick={onClose}>
              <Icon name="x" size={20} strokeWidth={2} />
            </button>
          </div>
          <div>
            <label className="label" htmlFor="food-name">
              {t.name}
            </label>
            <input
              id="food-name"
              className="input mt-2 w-full"
              value={name}
              placeholder={t.textPlaceholder}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.currentTarget.value }))}
            />
          </div>
          <div className="notice">
            <Icon name="info" size={20} strokeWidth={2} />
            <div>
              <p className="notice-title">{draft.estimate ? t.estimateTitle : t.measuredTitle}</p>
              <p className="notice-body">{draft.estimate ? t.estimateBody : t.measuredBody}</p>
            </div>
          </div>
          <div className="stack-sm">
            <Row title={t.calories} unit={t.kcal}>
              <Stepper size="sm" scale="kcal" label={t.calories} value={draft.kcal} onChange={(v) => setDraft((d) => ({ ...d, kcal: v }))} />
            </Row>
            {quick ? null : (
              <>
                <Row title={t.protein} unit={t.grams}>
                  <Stepper size="sm" scale="grams" label={t.protein} value={draft.protein} onChange={(v) => setDraft((d) => ({ ...d, protein: v }))} />
                </Row>
                <Row title={t.carbs} unit={t.grams}>
                  <Stepper size="sm" scale="grams" label={t.carbs} value={draft.carbs} onChange={(v) => setDraft((d) => ({ ...d, carbs: v }))} />
                </Row>
                <Row title={t.fat} unit={t.grams}>
                  <Stepper size="sm" scale="grams" label={t.fat} value={draft.fat} onChange={(v) => setDraft((d) => ({ ...d, fat: v }))} />
                </Row>
              </>
            )}
          </div>
          <div>
            <p className="label mb-2">{t.meal}</p>
            <div className="presetrow" role="radiogroup" aria-label={t.meal}>
              {MEALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  className="preset"
                  role="radio"
                  aria-checked={meal === m}
                  aria-pressed={meal === m}
                  onClick={() => setMeal(m)}
                >
                  {t.meals[m]}
                </button>
              ))}
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-block" disabled={!name.trim()} onClick={save}>
            {t.saveDiary}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t.logMeal}>
      <div className="media-screen absolute inset-0">
        {usesCamera ? (
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline muted />
        ) : null}

        {mode === 'voice' ? (
          <div className="cam-panel">
            <div className="cam-panel-fill">
              <div>
                <div className="cam-wave" aria-hidden="true" style={listening ? undefined : { opacity: 0.35 }}>
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <p className="title-2 mt-5">{t.listening}</p>
                <p className="mt-2">{status ?? t.voiceBody}</p>
                {!listening && speechCtor() ? (
                  <button type="button" className="btn btn-primary mt-5" onClick={listen}>
                    {t.voiceStart}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {mode === 'text' ? (
          <div className="cam-panel">
            <div className="cam-panel-fill" style={{ alignItems: 'start', paddingTop: 'var(--sp-9)' }}>
              <div className="w-full">
                <label className="label" htmlFor="cam-texto" style={{ color: 'rgb(255 255 255 / .8)' }}>
                  {t.textLabel}
                </label>
                <textarea
                  className="textarea mt-2 w-full"
                  id="cam-texto"
                  rows={4}
                  value={text}
                  placeholder={t.textPlaceholder}
                  onChange={(e) => setText(e.currentTarget.value)}
                />
                <p className="mt-3 text-left">{t.textNote}</p>
                <button
                  type="button"
                  className="btn btn-primary mt-4"
                  disabled={!text.trim()}
                  onClick={() => {
                    setDraft({ ...EMPTY, name: text.trim(), source: 'text', estimate: true });
                    setStage('confirm');
                  }}
                >
                  {t.next}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {mode === 'code' ? (
          <div className="cam-panel">
            <div className="cam-frame">
              <i />
              <i />
              <i />
              <i />
              <span className="cam-scan" aria-hidden="true" />
            </div>
          </div>
        ) : null}

        {usesCamera && (camOk === false || shown) ? (
          <div className="cam-panel" style={{ pointerEvents: 'none' }}>
            <div className="cam-panel-fill">
              <p>{camOk === false ? t.cameraOff : shown}</p>
            </div>
          </div>
        ) : null}

        <div className="media-top" style={{ zIndex: 2 }}>
          <div className="row-between">
            <button type="button" className="btn btn-icon on-media" aria-label={t.close} onClick={onClose}>
              <Icon name="x" size={20} strokeWidth={2} />
            </button>
            <p className="cam-brand">{t.brand}</p>
            <ThemeToggle onMedia />
          </div>
          <div className="mt-4 flex justify-center">
            <span
              className="chip chip-sm"
              style={{ background: 'rgb(0 0 0 / .72)', color: '#fff', borderColor: 'transparent', backdropFilter: 'blur(8px)' }}
            >
              {mode === 'code' ? t.precisionMeasured : t.precisionEstimate}
            </span>
          </div>
          {mode === 'ai' ? <p className="body-2 mt-3 text-center">{t.aiBody}</p> : null}
          {mode === 'code' && !shown ? <p className="body-2 mt-3 text-center">{t.codeBody}</p> : null}
        </div>

        <div className="media-bottom" style={{ zIndex: 2 }}>
          <div className="cam-actions">
            <button type="button" className="cam-side" aria-label={t.gallery} onClick={() => fileRef.current?.click()}>
              <Icon name="upload" size={22} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="cam-shutter"
              aria-label={t.shutter}
              disabled={mode !== 'ai'}
              onClick={snap}
            />
            <button type="button" className="cam-side" aria-label={t.search} onClick={() => switchMode('text')}>
              <Icon name="search" size={22} strokeWidth={2} />
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => fromGallery(e.currentTarget.files?.[0])}
          />
          <div
            className="segmented"
            role="tablist"
            aria-label={t.modes}
            style={{ background: 'rgb(0 0 0 / .72)', backdropFilter: 'blur(10px)' }}
          >
            {(['voice', 'text', 'ai', 'code'] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}>
                {modeLabel[m]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ title, unit, children }: { title: string; unit: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="row-between">
        <div>
          <p className="title-3">{title}</p>
          <p className="body-2 muted">{unit}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Open Food Facts, por código de barras: os valores do rótulo, por 100 g. */
async function lookup(code: string): Promise<Partial<Draft> | null> {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,nutriments`,
    );
    if (!res.ok) return null;
    const body = (await res.json()) as {
      status?: number;
      product?: { product_name?: string; nutriments?: Record<string, number | undefined> };
    };
    if (body.status !== 1 || !body.product) return null;
    const nut = body.product.nutriments ?? {};
    const round = (v: number | undefined, step: number) => (v === undefined ? 0 : Math.round(v / step) * step);
    return {
      name: body.product.product_name?.trim() || code,
      kcal: round(nut['energy-kcal_100g'], 10),
      protein: round(nut.proteins_100g, 1),
      carbs: round(nut.carbohydrates_100g, 1),
      fat: round(nut.fat_100g, 1),
    };
  } catch {
    return null;
  }
}
