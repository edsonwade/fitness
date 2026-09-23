// @vitest-environment jsdom
import { StrictMode } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { copyFor } from '../../i18n';
import { Capture } from './Capture';

/*
 * B1 de .claude/skills/nutricao-sem-erros/PLANO.md: escrever o nome do alimento rebentava
 * com "e.currentTarget is null". Estes testes escrevem letra a letra, como um dedo, e
 * falham se o ecrã cair.
 */
const save = vi.fn();
vi.mock('../../data/mutations', () => ({ useUpsertRow: () => ({ save }) }));
const uploadFoodPhoto = vi.fn();
vi.mock('../../data/queries', () => ({ useUserId: () => 'user-1' }));
vi.mock('../../data/photos', () => ({ uploadFoodPhoto: (...a: unknown[]) => uploadFoodPhoto(...a) }));

const t = copyFor('pt').nutrition;

beforeEach(() => {
  Element.prototype.scrollTo = () => {};
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
});

afterEach(() => {
  cleanup();
  save.mockReset();
  uploadFoodPhoto.mockReset();
});

function mount(quick: boolean) {
  const onClose = vi.fn();
  render(
    <StrictMode>
      <Capture date="2026-09-23" meal="lunch" quick={quick} onClose={onClose} />
    </StrictMode>,
  );
  return { onClose };
}

describe('Capture — escrever sem rebentar (B1)', () => {
  it('escreve o nome do alimento letra a letra no confirmar', async () => {
    const user = userEvent.setup();
    mount(true);
    const name = screen.getByLabelText(t.name);
    await user.clear(name);
    await user.type(name, 'Frango grelhado');
    expect(name).toHaveProperty('value', 'Frango grelhado');
  });

  it('o nome apaga-se todo e não volta ao texto antigo', async () => {
    const user = userEvent.setup();
    mount(false);
    await user.click(screen.getByRole('tab', { name: t.text }));
    await user.type(screen.getByLabelText(t.textLabel), 'Arroz');
    await user.click(screen.getByRole('button', { name: t.next }));
    const name = screen.getByLabelText(t.name);
    expect(name).toHaveProperty('value', 'Arroz');
    await user.clear(name);
    expect(name).toHaveProperty('value', '');
    await user.type(name, 'Feijão');
    expect(name).toHaveProperty('value', 'Feijão');
  });

  it('guarda o nome escrito', async () => {
    const user = userEvent.setup();
    const { onClose } = mount(true);
    const name = screen.getByLabelText(t.name);
    await user.clear(name);
    await user.type(name, 'Maçã');
    await user.click(screen.getByRole('button', { name: t.saveDiary }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Maçã', meal: 'lunch', local_date: '2026-09-23' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Capture — os números na roda, sem − / + (B4)', () => {
  it('as calorias abrem a roda e guardam o degrau escolhido', async () => {
    const user = userEvent.setup();
    mount(true);
    expect(screen.queryByRole('button', { name: /^(Menos|Mais)\b/ })).toBeNull();
    await user.click(screen.getByRole('button', { name: `${t.calories}: 0 kcal` }));
    const wheel = await screen.findByRole('radiogroup', { name: t.calories });
    await user.click(within(wheel).getByRole('radio', { name: '450kcal' }));
    await user.click(screen.getByRole('button', { name: copyFor('pt').common.confirm }));
    expect(screen.getByRole('button', { name: `${t.calories}: 450 kcal` })).toBeTruthy();
  });

  it('proteína, hidratos e gordura são pílulas que abrem a roda', async () => {
    const user = userEvent.setup();
    mount(false);
    await user.click(screen.getByRole('tab', { name: t.text }));
    await user.type(screen.getByLabelText(t.textLabel), 'Arroz');
    await user.click(screen.getByRole('button', { name: t.next }));
    for (const label of [t.protein, t.carbs, t.fat]) {
      expect(screen.getByRole('button', { name: `${label}: 0 g` })).toBeTruthy();
    }
  });
});

describe('Capture — a câmara da foto Ladder 18:53 (B5)', () => {
  it('tem ✕, marca, chip de precisão, galeria, obturador, os quatro modos com ícone e a lupa', () => {
    mount(false);
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByRole('button', { name: t.close }).className).toContain('cam-glass');
    expect(within(dialog).getByText(t.brand).className).toBe('cam-brand');
    expect(within(dialog).getByText(t.accuracyShort).className).toBe('cam-accuracy');
    expect(dialog.querySelectorAll('.cam-bars i.is-on')).toHaveLength(3);
    expect(within(dialog).getByRole('button', { name: t.gallery }).className).toContain('cam-glass');
    expect(within(dialog).getByRole('button', { name: t.shutter }).className).toBe('cam-shutter');
    const tabs = within(within(dialog).getByRole('tablist', { name: t.modes })).getAllByRole('tab');
    expect(tabs.map((b) => b.textContent)).toEqual([t.voice, t.text, t.ai, t.code]);
    tabs.forEach((b) => expect(b.querySelector('svg')).not.toBeNull());
    expect(tabs[2].getAttribute('aria-selected')).toBe('true');
    expect(within(dialog).getByRole('button', { name: t.search }).parentElement?.className).toBe('cam-bar');
  });

  it('tocar num modo muda o modo; o Código mostra "Medido" com as quatro barras', async () => {
    const user = userEvent.setup();
    mount(false);
    await user.click(screen.getByRole('tab', { name: t.code }));
    expect(screen.getByRole('tab', { name: t.code }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText(t.precisionMeasured)).toBeTruthy();
    expect(document.querySelectorAll('.cam-bars i.is-on')).toHaveLength(4);
    await user.click(screen.getByRole('tab', { name: t.voice }));
    expect(screen.getByRole('tab', { name: t.voice }).getAttribute('aria-selected')).toBe('true');
  });
});

/*
 * B6 de .claude/skills/nutricao-sem-erros/PLANO.md: a foto do prato ficava no rascunho e o
 * Guardar deitava-a fora. Agora sobe, e o URL vai na linha.
 */
describe('Capture — a foto do alimento é guardada (B6)', () => {
  async function withPhoto() {
    const user = userEvent.setup();
    const view = mount(false);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['prato'], 'prato.jpg', { type: 'image/jpeg' }));
    const name = await screen.findByLabelText(t.name);
    await user.type(name, 'Chicken breast with rice');
    return { user, ...view };
  }

  it('Guardar envia a foto e grava o photo_url na linha', async () => {
    uploadFoodPhoto.mockResolvedValue('https://example.test/frango.jpg');
    const { user, onClose } = await withPhoto();
    await user.click(screen.getByRole('button', { name: t.saveDiary }));
    expect(uploadFoodPhoto).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/jpeg/), 'user-1', 'Chicken breast with rice');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Chicken breast with rice', photo_url: 'https://example.test/frango.jpg' }),
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('se a foto não sobe, a refeição grava na mesma, sem foto, e o ecrã di-lo', async () => {
    uploadFoodPhoto.mockRejectedValue(new Error('offline'));
    const { user } = await withPhoto();
    await user.click(screen.getByRole('button', { name: t.saveDiary }));
    expect(save).toHaveBeenCalledWith(expect.not.objectContaining({ photo_url: expect.anything() }));
    expect(await screen.findByText(t.photoNotSaved)).toBeTruthy();
  });
});

describe('Capture — o nome é obrigatório (B7)', () => {
  it('sem nome diz-se, e o Guardar fica desligado', async () => {
    const user = userEvent.setup();
    mount(true);
    const name = screen.getByLabelText(t.name);
    await user.clear(name);
    expect(screen.getByRole('alert').textContent).toBe(t.nameRequired);
    expect(screen.getByRole('button', { name: t.saveDiary })).toHaveProperty('disabled', true);
  });
});
