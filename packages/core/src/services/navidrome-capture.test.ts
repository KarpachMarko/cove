import { readFile } from 'node:fs/promises';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { NavidromeClient } from './navidrome';
import type { Fetch } from './http';

// Opt-in replay keeps private captures and their credentials outside the repository.
// Only response bodies are replayed; captured URLs are never sent to a server.
const capturePath = process.env.COVE_NAVIDROME_HAR;
const captureSchema = z.object({
  log: z.object({
    entries: z.array(
      z.object({
        request: z.object({ url: z.string() }),
        response: z.object({
          status: z.number(),
          content: z.object({
            text: z.string(),
            encoding: z.string().optional(),
          }),
        }),
      }),
    ),
  }),
});

describe('private Navidrome capture replay', () => {
  it.skipIf(!capturePath)(
    'accepts every captured successful song/search response',
    async () => {
      if (!capturePath) return;
      const capture = captureSchema.parse(
        JSON.parse(await readFile(capturePath, 'utf8')) as unknown,
      );
      let replayed = 0;
      for (const entry of capture.log.entries) {
        const url = new URL(entry.request.url);
        if (
          !url.pathname.endsWith('/search3.view') ||
          entry.response.status !== 200
        )
          continue;
        const content = entry.response.content;
        const body =
          content.encoding === 'base64'
            ? Buffer.from(content.text, 'base64').toString('utf8')
            : content.text;
        const fetcher = vi.fn<Fetch>().mockResolvedValue(new Response(body));
        const api = new NavidromeClient(
          {
            url: 'https://music.example.com',
            username: 'fixture',
            token: 'fixture',
            salt: 'fixture',
          },
          fetcher,
        );
        if (url.searchParams.get('query')) {
          const result = await api.search('fixture');
          expect(Array.isArray(result.song)).toBe(true);
        } else {
          expect(Array.isArray(await api.songs())).toBe(true);
        }
        replayed++;
      }
      expect(replayed).toBeGreaterThan(0);
    },
  );
});
