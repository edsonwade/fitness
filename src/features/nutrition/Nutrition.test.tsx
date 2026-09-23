// @vitest-environment jsdom
import { StrictMode } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { copyFor } from '../../i18n';
import { localDate } from '../train/sessions';
import { Nutrition } from './Nutrition';

/*
 * O ecrã Nutrição inteiro, montado como na app — .claude/skills/nutricao-sem-erros/PLANO.md.
 * Os dados chegam depois do primeiro render, como no telemóvel: é aí que o B3 aparecia.
 */
type Rows = { data: unknown[] | undefined; isPending: boolean };
const rows: Record<string, Rows> = {};
const save = vi.fn();
const remove = vi.fn();

vi.mock('../../data/queries', () => ({
  useRows: (table: string) => rows[table] ?? { data: [], isPending: false },
  useUserId: () => 'user-1',
}));
vi.mock('../../data/mutations', () => ({
  useUpsertRow: () => ({ save }),
  useDeleteRow: () => ({ remove }),
}));
vi.mock('../../ui/ThemeToggle', () => ({ ThemeToggle: () => null }));
const uploadFoodPhoto = vi.fn();
vi.mock('../../data/photos', () => ({ uploadFoodPhoto: (...a: unknown[]) => uploadFoodPhoto(...a) }));

const t = copyFor('pt').nutrition;

function loading() {
  for (const table of ['food_entries', 'weight_logs', 'nutrition_targets', 'user_profiles']) {
    rows[table] = { data: undefined, isPending: true };
  }
}

function loaded() {
  rows.food_entries = { data: [], isPending: false };
  rows.weight_logs = {
    data: [
      { id: '00000000-0000-4000-8000-000000000001', local_date: '2026-09-20', kg: 83 },
      { id: '00000000-0000-4000-8000-000000000002', local_date: '2026-09-22', kg: 82.5 },
    ],
    isPending: false,
  };
  rows.nutrition_targets = { data: [{ kcal: 2500, protein_g: 150 }], isPending: false };
  rows.user_profiles = { data: [{ weight_target: '78' }], isPending: false };
}

function mountWithLateData() {
  loading();
  const view = render(
    <StrictMode>
      <Nutrition />
    </StrictMode>,
  );
  loaded();
  view.rerender(
    <StrictMode>
      <Nutrition />
    </StrictMode>,
  );
}

/** Os separadores são chips; "Histórico" também é o ícone da barra de cima. */
const tab = (label: string) =>
  screen.getAllByRole('button', { name: label }).find((el) => el.classList.contains('chip')) as HTMLElement;

beforeEach(() => {
  save.mockReset();
  remove.mockReset();
  uploadFoodPhoto.mockReset();
  /* O jsdom não tem scrollIntoView; os chips chamam-no ao tocar. */
  Element.prototype.scrollIntoView = () => {};
  /* A roda anda com scrollTo e pergunta pelo movimento reduzido; o jsdom não tem nenhum. */
  Element.prototype.scrollTo = () => {};
  window.matchMedia ??= ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as never;
});

/** O degrau escolhido de uma roda, como se lê. */
const checked = (wheel: HTMLElement) => within(wheel).getByRole('radio', { checked: true }).textContent;
afterEach(() => cleanup());

describe('Nutrição — o ecrã inteiro', () => {
  it('Calorias rápidas: escreve o nome letra a letra sem rebentar (B1)', async () => {
    const user = userEvent.setup();
    mountWithLateData();
    await user.click(tab(t.tabQuick));
    const name = screen.getByLabelText(t.name);
    await user.clear(name);
    await user.type(name, 'Iogurte grego');
    expect(name).toHaveProperty('value', 'Iogurte grego');
  });

  it('a folha do peso abre no último peso, e não em 70 (B3)', async () => {
    const user = userEvent.setup();
    mountWithLateData();
    await user.click(screen.getByRole('button', { name: t.log }));
    const whole = await screen.findByRole('radiogroup', { name: t.weight });
    expect(checked(whole)).toBe('82');
    expect(checked(screen.getByRole('radiogroup', { name: `${t.weight} (,1)` }))).toBe('5');
  });

  it('o peso escolhe-se na roda, sem − / +, e 100 kg é um toque (B4)', async () => {
    const user = userEvent.setup();
    mountWithLateData();
    await user.click(screen.getByRole('button', { name: t.log }));
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).queryByRole('button', { name: /^(Menos|Mais)\b/ })).toBeNull();
    expect(within(sheet).queryByRole('spinbutton')).toBeNull();
    const whole = within(sheet).getByRole('radiogroup', { name: t.weight });
    await user.click(within(whole).getByRole('radio', { name: '100' }));
    expect(checked(whole)).toBe('100');
    await user.click(within(sheet).getByRole('button', { name: t.save }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ kg: 100.5 }));
  });

  it('a folha da meta abre na meta guardada, em rodas, e Guardar não a troca por 2000/120 (B3, B4)', async () => {
    const user = userEvent.setup();
    mountWithLateData();
    await user.click(screen.getByRole('button', { name: t.setGoal }));
    expect(checked(await screen.findByRole('radiogroup', { name: t.calories }))).toBe('2500kcal');
    expect(checked(screen.getByRole('radiogroup', { name: t.protein }))).toBe('150g');
    expect(screen.queryByRole('spinbutton')).toBeNull();
    await user.click(screen.getByRole('button', { name: t.save }));
    expect(save).toHaveBeenCalledWith({ kcal: 2500, protein_g: 150 });
  });

  it('todos os separadores abrem sem rebentar', async () => {
    const user = userEvent.setup();
    mountWithLateData();
    for (const label of [t.tabHistory, t.tabRecipes, t.tabMacros, t.tabToday]) {
      await user.click(tab(label));
    }
    expect(screen.getByRole('heading', { name: t.title })).toBeTruthy();
  });
});

/*
 * B6 de .claude/skills/nutricao-sem-erros/PLANO.md, fotos 19:29 e 19:35: o lanche guardado
 * com foto aparecia só em texto e tocar-lhe não fazia nada.
 */
const today = localDate(new Date());
const food = (id: string, over: Record<string, unknown>) => ({
  id,
  local_date: today,
  meal: 'snack',
  name: 'Chicken breast with rice',
  kcal: 160,
  protein_g: 20,
  carbs_g: 20,
  fat_g: 10,
  source: 'ai',
  estimate: true,
  barcode: null,
  photo_url: null,
  created_at: `${today}T16:05:00.000Z`,
  ...over,
});

function mountWithFoods() {
  loaded();
  rows.food_entries = {
    data: [
      food('00000000-0000-4000-8000-0000000000a1', { photo_url: 'https://example.test/frango.jpg' }),
      food('00000000-0000-4000-8000-0000000000a2', { name: 'Maçã', kcal: 80, created_at: `${today}T16:10:00.000Z` }),
    ],
    isPending: false,
  };
  render(
    <StrictMode>
      <Nutrition />
    </StrictMode>,
  );
}

describe('Nutrição — os alimentos do dia em cartões de foto (B6)', () => {
  it('"Hoje" tem um cartão por alimento, com a pílula da refeição dentro e o nome por baixo', () => {
    mountWithFoods();
    const rail = screen.getByRole('list', { name: t.diary });
    const cards = within(rail).getAllByRole('button', { name: new RegExp(`^${t.meals.snack}: `) });
    expect(cards).toHaveLength(2);
    expect(within(cards[0]).getByText(t.meals.snack)).toBeTruthy();
    expect(within(rail).getByText('Chicken breast with rice')).toBeTruthy();
    expect(within(rail).getByText('Maçã')).toBeTruthy();
  });

  it('com foto mostra a foto; sem foto, a placa neutra e nenhuma imagem emprestada', () => {
    mountWithFoods();
    const withPhoto = screen.getByRole('button', { name: `${t.meals.snack}: Chicken breast with rice` });
    const without = screen.getByRole('button', { name: `${t.meals.snack}: Maçã` });
    expect(withPhoto.querySelector('img')?.getAttribute('src')).toBe('https://example.test/frango.jpg');
    expect(without.querySelector('img')).toBeNull();
    expect(without.querySelector('.food-card-empty')).not.toBeNull();
  });

  it('tocar no cartão abre a folha com o que foi registado, e a foto', async () => {
    const user = userEvent.setup();
    mountWithFoods();
    await user.click(screen.getByRole('button', { name: `${t.meals.snack}: Chicken breast with rice` }));
    const sheet = await screen.findByRole('dialog');
    expect(within(sheet).getByText('Chicken breast with rice')).toBeTruthy();
    expect(within(sheet).getByText('160 kcal')).toBeTruthy();
    expect(within(sheet).getAllByText('20 g')).toHaveLength(2);
    expect(within(sheet).getByText('10 g')).toBeTruthy();
    expect(within(sheet).getByRole('img', { name: 'Chicken breast with rice' })).toBeTruthy();
    /* O outro alimento do lanche está na folha, e tocar-lhe troca. */
    await user.click(within(sheet).getByRole('button', { name: /Maçã/ }));
    expect(await within(sheet).findByText('80 kcal')).toBeTruthy();
  });

  it('"Apagar" na folha apaga esse alimento', async () => {
    const user = userEvent.setup();
    mountWithFoods();
    await user.click(screen.getByRole('button', { name: `${t.meals.snack}: Chicken breast with rice` }));
    const sheet = await screen.findByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: t.deleteFood }));
    expect(remove).toHaveBeenCalledWith({ id: '00000000-0000-4000-8000-0000000000a1' });
  });
});

/* B7 de .claude/skills/nutricao-sem-erros/PLANO.md, foto 20:00: a folha é um CRUD, e o nome é obrigatório. */
describe('Nutrição — editar e atualizar o alimento (B7)', () => {
  const frango = { name: `${t.meals.snack}: Chicken breast with rice` };

  async function openEditor() {
    const user = userEvent.setup();
    mountWithFoods();
    await user.click(screen.getByRole('button', frango));
    const sheet = await screen.findByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: t.edit }));
    return { user, sheet };
  }

  it('a folha tem Editar, Apagar e Adicionar', async () => {
    const user = userEvent.setup();
    mountWithFoods();
    await user.click(screen.getByRole('button', frango));
    const sheet = await screen.findByRole('dialog');
    for (const label of [t.edit, t.deleteFood, t.addShort]) {
      expect(within(sheet).getByRole('button', { name: label })).toBeTruthy();
    }
  });

  it('editar o nome, a refeição e guardar atualiza a mesma linha', async () => {
    const { user, sheet } = await openEditor();
    const name = within(sheet).getByLabelText(t.name);
    await user.clear(name);
    await user.type(name, 'Frango com arroz');
    await user.click(within(sheet).getByRole('radio', { name: t.meals.dinner }));
    await user.click(within(sheet).getByRole('button', { name: t.save }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '00000000-0000-4000-8000-0000000000a1',
        name: 'Frango com arroz',
        meal: 'dinner',
        photo_url: 'https://example.test/frango.jpg',
      }),
    );
  });

  it('o nome é obrigatório: vazio diz-se, e o Guardar não grava', async () => {
    const { user, sheet } = await openEditor();
    const name = within(sheet).getByLabelText(t.name);
    await user.clear(name);
    expect(within(sheet).getByRole('alert').textContent).toBe(t.nameRequired);
    expect(name.getAttribute('aria-invalid')).toBe('true');
    const saveBtn = within(sheet).getByRole('button', { name: t.save });
    expect(saveBtn).toHaveProperty('disabled', true);
    await user.click(saveBtn);
    expect(save).not.toHaveBeenCalled();
  });

  it('"Tirar foto" apaga a foto do alimento', async () => {
    const { user, sheet } = await openEditor();
    await user.click(within(sheet).getByRole('button', { name: t.photoRemoveShort }));
    expect(within(sheet).queryByRole('button', { name: t.photoRemoveShort })).toBeNull();
    expect(within(sheet).getByRole('button', { name: t.photoAddShort })).toBeTruthy();
    await user.click(within(sheet).getByRole('button', { name: t.save }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: '00000000-0000-4000-8000-0000000000a1', photo_url: null }));
  });

  it('trocar a foto sobe a nova e grava o URL novo', async () => {
    uploadFoodPhoto.mockResolvedValue('https://example.test/nova.jpg');
    const { user, sheet } = await openEditor();
    const input = sheet.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, new File(['prato'], 'prato.jpg', { type: 'image/jpeg' }));
    await user.click(within(sheet).getByRole('button', { name: t.save }));
    expect(uploadFoodPhoto).toHaveBeenCalledWith(expect.any(File), 'user-1', 'Chicken breast with rice');
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ photo_url: 'https://example.test/nova.jpg' }));
  });

  it('pôr foto num alimento que não tinha', async () => {
    uploadFoodPhoto.mockResolvedValue('https://example.test/maca.jpg');
    const user = userEvent.setup();
    mountWithFoods();
    await user.click(screen.getByRole('button', { name: `${t.meals.snack}: Maçã` }));
    const sheet = await screen.findByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: t.edit }));
    expect(within(sheet).getByRole('button', { name: t.photoAddShort })).toBeTruthy();
    await user.upload(sheet.querySelector('input[type="file"]') as HTMLInputElement, new File(['m'], 'm.jpg', { type: 'image/jpeg' }));
    await user.click(within(sheet).getByRole('button', { name: t.save }));
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: '00000000-0000-4000-8000-0000000000a2', photo_url: 'https://example.test/maca.jpg' }),
    );
  });

  it('se a foto nova não sobe, não grava e diz porquê', async () => {
    uploadFoodPhoto.mockRejectedValue(new Error('offline'));
    const { user, sheet } = await openEditor();
    await user.upload(sheet.querySelector('input[type="file"]') as HTMLInputElement, new File(['p'], 'p.jpg', { type: 'image/jpeg' }));
    await user.click(within(sheet).getByRole('button', { name: t.save }));
    expect(await within(sheet).findByText(t.photoUploadFailed)).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });
});
