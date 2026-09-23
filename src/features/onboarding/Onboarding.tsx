import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useUpsertRow } from '../../data/mutations';
import { useRows } from '../../data/queries';
import { useLocale } from '../../i18n/locale-context';
import { Stepper } from '../../ui/Stepper';
import { localDate } from '../train/sessions';
import { ThemeToggle } from '../../ui/ThemeToggle';

const IMG = (name: string) => `${import.meta.env.BASE_URL}img/${name}.jpg`;
type GoalKey = 'strength' | 'muscle' | 'fat' | 'fit';

/**
 * O onboarding de cinco passos — fase 024, `proto/v2/01-entrada.html` frames 5 e 6.
 *
 * Escolhe-se por toque, e o corpo por stepper: nada aqui se escreve. Saltável em qualquer
 * passo, e saltar dá uma app que funciona — o programa autorado já lá está. O que se
 * responde vai para `user_profiles` (e o peso para `weight_logs`, a mesma verdade da
 * Nutrição) e, se houver, o primeiro objetivo para `goals`. Não se volta a perguntar.
 */
export function Onboarding() {
  const { t: copy } = useLocale();
  const t = copy.onboarding;
  const navigate = useNavigate();
  const profiles = useRows('user_profiles');
  const profile = useUpsertRow('user_profiles');
  const goals = useUpsertRow('goals');
  const weight = useUpsertRow('weight_logs');
  const [step, setStep] = useState(1);
  const [days, setDays] = useState(6);
  const [goal, setGoal] = useState<GoalKey | null>(null);
  const [cm, setCm] = useState(175);
  const [kg, setKg] = useState(70);
  const [body, setBody] = useState(true);
  const TOTAL = 5;

  function finish() {
    const hasStart = !!profiles.data?.[0]?.weight_start;
    profile.save({
      training_days: Array.from({ length: days }, (_, i) => i + 1),
      onboarded_at: new Date().toISOString(),
      ...(body
        ? {
            height_cm: String(cm),
            weight_current: kg.toFixed(1).replace('.', ','),
            ...(hasStart ? {} : { weight_start: kg.toFixed(1).replace('.', ',') }),
          }
        : {}),
    });
    if (body) {
      weight.save({ id: crypto.randomUUID(), local_date: localDate(new Date()), kg: Math.round(kg * 10) / 10 });
    }
    if (goal) {
      goals.save({ id: crypto.randomUUID(), title: t.goals[goal], type: goal, photo: IMG('onboard-goal') });
    }
    navigate('/', { replace: true });
  }

  function skip() {
    profile.save({ onboarded_at: new Date().toISOString() });
    navigate('/', { replace: true });
  }

  const next = () => (step < TOTAL ? setStep(step + 1) : finish());

  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[26.5rem] flex-col">
      <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="segtrack" style={{ flex: '1 1 auto', margin: 0 }} aria-hidden="true">
          {Array.from({ length: TOTAL }, (_, i) => (
            <i
              key={i}
              className={i + 1 < step ? 'is-done' : i + 1 === step ? 'is-now' : undefined}
              style={{ background: i + 1 <= step ? 'var(--ui-accent)' : 'var(--ui-rule)' }}
            />
          ))}
        </div>
        {step < TOTAL ? (
          <button type="button" className="btn btn-ghost btn-quiet" onClick={skip}>
            {t.skip}
          </button>
        ) : null}
        <ThemeToggle />
      </div>

      <div className="screen-pad stack-lg flex-1 pb-8">
        <div>
          <p className="label">
            {t.step} {step} {t.of} {TOTAL}
          </p>
          <h1 className="display display-2 mt-2">
            {step === 1
              ? t.welcomeTitle
              : step === 2
                ? t.daysTitle
                : step === 3
                  ? t.goalTitle
                  : step === 4
                    ? t.bodyTitle
                    : t.readyTitle}
          </h1>
          {step === 1 ? <p className="body-1 muted mt-3">{t.welcomeBody}</p> : null}
          {step === 2 ? <p className="body-1 muted mt-3">{t.daysBody}</p> : null}
          {step === 3 ? <p className="body-1 muted mt-3">{t.goalBody}</p> : null}
          {step === 5 ? <p className="body-1 muted mt-3">{t.readyBody}</p> : null}
        </div>

        {step === 2 ? (
          <div className="presetrow" role="radiogroup" aria-label={t.daysTitle}>
            {[3, 4, 5, 6].map((n) => (
              <button key={n} type="button" className="preset" role="radio" aria-checked={days === n} aria-pressed={days === n} onClick={() => setDays(n)}>
                {n}
                {n === 6 ? <span className="preset-note">{t.daysNote}</span> : null}
              </button>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="row flex-wrap" style={{ gap: 'var(--sp-2)' }} role="radiogroup" aria-label={t.goalTitle}>
            {(Object.keys(t.goals) as GoalKey[]).map((k) => (
              <button key={k} type="button" className="chip" role="radio" aria-checked={goal === k} aria-pressed={goal === k} onClick={() => setGoal(k)}>
                {t.goals[k]}
              </button>
            ))}
          </div>
        ) : null}

        {step === 4 ? (
          <>
            <div>
              <p className="label mb-2">{t.height}</p>
              <Stepper scale="cm" label={t.height} value={cm} onChange={setCm} />
            </div>
            <div>
              <p className="label mb-2">{t.weight}</p>
              <Stepper scale="body" step={0.5} label={t.weight} value={kg} onChange={setKg} />
            </div>
          </>
        ) : null}

        {step !== 4 ? (
          <div className="card-media" style={{ height: 180 }}>
            <img
              src={IMG(step === 1 ? 'onboard-welcome' : step === 2 ? 'onboard-days' : step === 3 ? 'onboard-goal' : 'onboard-trainer')}
              alt=""
            />
          </div>
        ) : null}

        <span className="spacer" />
        <button type="button" className="btn btn-primary btn-block" onClick={next}>
          {step === TOTAL ? t.start : t.next}
        </button>
        {step === 4 ? (
          <button
            type="button"
            className="btn btn-ghost btn-block"
            onClick={() => {
              setBody(false);
              setStep(5);
            }}
          >
            {t.notSay}
          </button>
        ) : null}
      </div>
    </div>
  );
}
