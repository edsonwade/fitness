import { useState } from 'react';
import { useNavigate } from 'react-router';

import { useT } from '../../i18n/locale-context';
import { Icon } from '../../ui/Icon';
import { ThemeToggle } from '../../ui/ThemeToggle';
import { askNotifyPermission } from '../calendar/notify';
import { notifyScreen, readNotifyEnv, setRestOverOn, useRestOverOn, type NotifyScreen } from './notifications';

/**
 * O ecrã Notificações — skill phase-026-notificacoes, `proto/v2/13-notificacoes.html`:
 * frame 1 (o pedido), frame 3 (recusada), frame 4 (iPhone fora do ecrã principal), e as
 * notificações já ligadas. Entra-se por Perfil › Definições (escolha dele, 2026-09-27).
 *
 * Só o "Descanso acabou" funciona: é local. Os outros três precisam de servidor e ficam
 * à vista, desligados e inertes (escolha dele, "Mostrar, desligados").
 */
/** Um interruptor do frame 1. `live` falso: desligado e inerte, como os três com servidor. */
function Row({ label, hint, on, live }: { label: string; hint: string; on: boolean; live: boolean }) {
  return (
    <div className="switch-row">
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <p className="t">{label}</p>
        <p className="s">{hint}</p>
      </div>
      <button
        type="button"
        className="switch"
        role="switch"
        aria-checked={live && on}
        aria-label={label}
        disabled={!live}
        onClick={live ? () => setRestOverOn(!on) : undefined}
      />
    </div>
  );
}

export function Notifications() {
  const t = useT().notify;
  const navigate = useNavigate();
  const [screen, setScreen] = useState<NotifyScreen>(() => notifyScreen(readNotifyEnv()));
  const restOn = useRestOverOn();

  async function activate() {
    await askNotifyPermission();
    setScreen(notifyScreen(readNotifyEnv()));
  }

  const blocked = screen === 'denied' || screen === 'unsupported';

  const switches = (
    <section className="card">
      <Row label={t.restOver} hint={blocked ? t.blockedSwitch : t.restOverHint} on={restOn} live={!blocked} />
      <Row label={t.daily} hint={t.dailyHint} on={false} live={false} />
      <Row label={t.coach} hint={t.coachHint} on={false} live={false} />
      <Row label={t.weekly} hint={t.weeklyHint} on={false} live={false} />
    </section>
  );

  return (
    <div className="min-h-[100dvh]">
      <div className="appbar pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button type="button" className="btn btn-icon" aria-label={t.back} onClick={() => navigate(-1)}>
          <Icon name="back" size={20} strokeWidth={2} />
        </button>
        <h1 className="title-3">{t.title}</h1>
        <span className="spacer" />
        <ThemeToggle />
      </div>

      <div className="screen-pad stack-lg pb-10">
        {screen === 'ios-install' ? (
          <>
            <div className="empty" style={{ paddingTop: 'var(--sp-6)' }}>
              <p className="title-2">{t.iosTitle}</p>
              <p>{t.iosBody}</p>
            </div>
            <section className="card">
              <p className="label">{t.iosStepsTitle}</p>
              <div className="mt-3">
                {[t.ios1, t.ios2, t.ios3].map((s) => (
                  <div key={s} className="list-row">
                    <span className="body-1">{s}</span>
                  </div>
                ))}
              </div>
            </section>
            <div>
              <button type="button" className="btn btn-primary btn-block btn-lg" disabled>
                {t.activate}
              </button>
              <p className="body-2 muted mt-2 text-center">{t.iosDisabled}</p>
            </div>
            <div className="notice">
              <Icon name="info" size={20} strokeWidth={2} />
              <div>
                <p className="notice-title">{t.iosOtherTitle}</p>
                <p className="notice-body">{t.iosOtherBody}</p>
              </div>
            </div>
          </>
        ) : blocked ? (
          <>
            <div className="notice notice-danger">
              <Icon name="alert" size={20} strokeWidth={2} />
              <div>
                <p className="notice-title">{screen === 'denied' ? t.blockedTitle : t.unsupportedTitle}</p>
                <p className="notice-body">{screen === 'denied' ? t.blockedBody : t.unsupportedBody}</p>
              </div>
            </div>
            {screen === 'denied' ? (
              <section className="card">
                <p className="label">{t.howTitle}</p>
                <div className="mt-3">
                  {[t.how1, t.how2, t.how3, t.how4].map((s) => (
                    <div key={s} className="list-row">
                      <span className="body-1">{s}</span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
            {switches}
            <div className="notice">
              <Icon name="info" size={20} strokeWidth={2} />
              <div>
                <p className="notice-title">{t.stillTitle}</p>
                <p className="notice-body">{t.stillBody}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="display display-3">{t.askTitle}</p>
              <p className="body-1 muted mt-3">{t.askBody}</p>
            </div>
            {switches}
            {screen === 'ask' ? (
              <>
                <div className="notice">
                  <Icon name="info" size={20} strokeWidth={2} />
                  <div>
                    <p className="notice-title">{t.nextTitle}</p>
                    <p className="notice-body">{t.nextBody}</p>
                  </div>
                </div>
                <div className="stack-sm">
                  <button type="button" className="btn btn-primary btn-block btn-lg" onClick={() => void activate()}>
                    {t.activate}
                  </button>
                  <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate(-1)}>
                    {t.notNow}
                  </button>
                </div>
              </>
            ) : (
              <div className="notice">
                <Icon name="check" size={20} strokeWidth={2} />
                <div>
                  <p className="notice-title">{t.onTitle}</p>
                  <p className="notice-body">{t.onBody}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
