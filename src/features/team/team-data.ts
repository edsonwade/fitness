import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '../../data/queries';
import { supabase } from '../../data/supabase';
import type { LeaderRow } from './team';

/**
 * Os dados do separador Equipa que não são tabelas da conta.
 *
 * O ranking e os membros vêm de duas funções do servidor (`017`), porque as sessões e os
 * perfis dos outros são privados e só o total pode sair. O mural são as tabelas do `002`
 * (`community_posts`, `post_reactions`, `post_comments`), de leitura para todos e escrita
 * só do autor — ficam fora do registo de `entities.ts`, que descreve as tabelas do `003`
 * para a frente.
 */
export type Member = { user_id: string; name: string | null; photo: string | null };

export type Post = {
  id: string;
  author: string;
  body: string;
  created_at: string;
  session_name: string | null;
  session_volume_kg: number | null;
};

export type Reaction = { post_id: string; author: string; emoji: string };

export const CLAP = '👏';

export function useLeaderboard(days: number | null) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['team', 'leaderboard', userId, days],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('team_leaderboard', { p_days: days });
      if (error) throw error;
      return (data ?? []) as LeaderRow[];
    },
  });
}

export function useMembers() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['team', 'members', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('team_members');
      if (error) throw error;
      return (data ?? []) as Member[];
    },
  });
}

export function usePosts() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['team', 'posts', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_posts')
        .select('id, author, body, created_at, session_name, session_volume_kg')
        .eq('deleted', false)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      const posts = (data ?? []) as Post[];
      const ids = posts.map((p) => p.id);
      let reactions: Reaction[] = [];
      let comments: { post_id: string }[] = [];
      if (ids.length) {
        const r = await supabase.from('post_reactions').select('post_id, author, emoji').in('post_id', ids);
        reactions = (r.data ?? []) as Reaction[];
        const c = await supabase.from('post_comments').select('post_id').in('post_id', ids).eq('deleted', false);
        comments = (c.data ?? []) as { post_id: string }[];
      }
      return { posts, reactions, comments };
    },
  });
}

export function usePublish() {
  const client = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (input: { body: string; session_name?: string | null; session_volume_kg?: number | null }) => {
      if (!userId) throw new Error('sem sessão');
      const { error } = await supabase.from('community_posts').insert({ author: userId, ...input });
      if (error) throw error;
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['team', 'posts'] }),
  });
}

export function useRemovePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('community_posts').update({ deleted: true }).eq('id', id);
      if (error) throw error;
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['team', 'posts'] }),
  });
}

export function useClap() {
  const client = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ postId, on }: { postId: string; on: boolean }) => {
      if (!userId) throw new Error('sem sessão');
      const q = on
        ? supabase.from('post_reactions').insert({ post_id: postId, author: userId, emoji: CLAP })
        : supabase.from('post_reactions').delete().eq('post_id', postId).eq('author', userId).eq('emoji', CLAP);
      const { error } = await q;
      if (error) throw error;
    },
    onSettled: () => client.invalidateQueries({ queryKey: ['team', 'posts'] }),
  });
}
