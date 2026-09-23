import { useEffect, useState, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { pendingWrites } from '../data/outbox';
import { useT } from '../i18n/locale-context';
import { Icon } from './Icon';

function subscribeOnline(cb: () => void) {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
}

/**
 * `proto/v2/02-hoje.html` frame 5 — offline, com fila de escrita. O padrão de `outbox.ts`: o
 * treino continua, e a escrita espera. Sem rede, o aviso "Sem ligação"; com escritas à espera,
 * quantas são. Com rede e sem fila, não existe.
 */
export function OfflineNotice() {
  const t = useT().offline;
  const client = useQueryClient();
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const [pending, setPending] = useState(() => pendingWrites(client));

  useEffect(() => {
    const cache = client.getMutationCache();
    return cache.subscribe(() => setPending(pendingWrites(client)));
  }, [client]);

  if (online && pending === 0) return null;

  return (
    <div className="stack">
      {!online ? (
        <div className="notice notice-danger" role="status">
          <Icon name="alert" size={20} strokeWidth={2} />
          <div>
            <p className="notice-title">{t.title}</p>
            <p className="notice-body">{t.body}</p>
          </div>
        </div>
      ) : null}
      {pending > 0 ? (
        <div className="notice" role="status">
          <Icon name="clock" size={20} strokeWidth={2} />
          <div>
            <p className="notice-title">
              {pending} {pending === 1 ? t.pendingOne : t.pendingMany}
            </p>
            <p className="notice-body">{t.pendingBody}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
