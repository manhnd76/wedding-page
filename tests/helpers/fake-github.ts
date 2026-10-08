/**
 * GitHub giả trong bộ nhớ (Git Data API tối thiểu) để test GitHubAdapter bằng mock `fetch`.
 * KHÔNG gọi mạng, không dùng token thật.
 */
import { base64ToBytes, bytesToBase64, gitBlobSha, utf8 } from '../../src/shared/storage/bytes.ts';

export interface Call { method: string; path: string; body?: unknown }
type TreeMap = Record<string, string>;

let counter = 0;
const fakeSha = (p: string) => `${p}${(++counter).toString(16).padStart(40 - p.length, '0')}`;

export class FakeGitHub {
  blobs = new Map<string, Uint8Array>();
  trees = new Map<string, TreeMap>();
  commits = new Map<string, { tree: string; parents: string[]; message: string }>();
  refs: Record<string, string> = {};
  calls: Call[] = [];
  /** ghi đè phản hồi theo (method, path regex) */
  overrides: { method?: string; re: RegExp; res: () => Response | Promise<Response>; once?: boolean }[] = [];
  expiration: string | null = '2027-01-12 00:00:00 +0700';
  branches = ['main'];

  constructor(public owner = 'minhanh', public repo = 'wedding') {}

  async seed(files: Record<string, string | Uint8Array>, branch = 'main'): Promise<string> {
    const tree: TreeMap = {};
    for (const [p, c] of Object.entries(files)) {
      const b = typeof c === 'string' ? utf8(c) : c;
      const sha = await gitBlobSha(b);
      this.blobs.set(sha, b);
      tree[p] = sha;
    }
    const tsha = fakeSha('t');
    this.trees.set(tsha, tree);
    const csha = fakeSha('c');
    this.commits.set(csha, { tree: tsha, parents: [], message: 'init' });
    this.refs[branch] = csha;
    return csha;
  }

  headTree(branch = 'main'): TreeMap {
    return { ...this.trees.get(this.commits.get(this.refs[branch]!)!.tree)! };
  }
  text(path: string, branch = 'main'): string | null {
    const sha = this.headTree(branch)[path];
    return sha ? new TextDecoder().decode(this.blobs.get(sha)!) : null;
  }
  count(method: string, re: RegExp): number {
    return this.calls.filter((c) => c.method === method && re.test(c.path)).length;
  }

  private json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
    const h: Record<string, string> = { 'content-type': 'application/json', ...headers };
    if (this.expiration) h['github-authentication-token-expiration'] = this.expiration;
    return new Response(JSON.stringify(body), { status, headers: h });
  }

  fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(String(input));
    const method = (init?.method ?? 'GET').toUpperCase();
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const path = url.pathname + url.search;
    this.calls.push({ method, path, body });
    const auth = (init?.headers as Record<string, string> | undefined)?.Authorization ?? '';
    for (const [i, o] of this.overrides.entries()) {
      if ((!o.method || o.method === method) && o.re.test(path)) {
        if (o.once) this.overrides.splice(i, 1);
        return o.res();
      }
    }
    if (!auth.startsWith('Bearer ')) return this.json(401, { message: 'Requires authentication' });
    const base = `/repos/${this.owner}/${this.repo}`;
    if (!url.pathname.startsWith(base)) return this.json(404, { message: 'Not Found' });
    const rest = url.pathname.slice(base.length);
    if (rest === '' && method === 'GET') return this.json(200, { full_name: `${this.owner}/${this.repo}`, permissions: { push: true } });
    let m: RegExpExecArray | null;
    if ((m = /^\/branches\/(.+)$/.exec(rest))) {
      const b = decodeURIComponent(m[1]!);
      return this.refs[b] ? this.json(200, { name: b }) : this.json(404, { message: 'Branch not found' });
    }
    if (rest === '/branches') return this.json(200, this.branches.filter((b) => this.refs[b]).map((name) => ({ name })));
    if ((m = /^\/git\/ref\/heads\/(.+)$/.exec(rest))) {
      const sha = this.refs[decodeURIComponent(m[1]!)];
      return sha ? this.json(200, { object: { sha } }) : this.json(404, { message: 'Not Found' });
    }
    if ((m = /^\/git\/commits\/(\w+)$/.exec(rest)) && method === 'GET') {
      const c = this.commits.get(m[1]!);
      return c ? this.json(200, { sha: m[1], tree: { sha: c.tree } }) : this.json(404, {});
    }
    if ((m = /^\/git\/trees\/(\w+)$/.exec(rest)) && method === 'GET') {
      const t = this.trees.get(m[1]!);
      if (!t) return this.json(404, {});
      return this.json(200, { sha: m[1], tree: Object.entries(t).map(([p, sha]) => ({ path: p, type: 'blob', sha, mode: '100644' })), truncated: false });
    }
    if ((m = /^\/git\/blobs\/(\w+)$/.exec(rest)) && method === 'GET') {
      const b = this.blobs.get(m[1]!);
      return b ? this.json(200, { content: bytesToBase64(b), encoding: 'base64' }) : this.json(404, {});
    }
    if (rest === '/git/blobs' && method === 'POST') {
      const b = body.encoding === 'base64' ? base64ToBytes(body.content) : utf8(body.content);
      const sha = await gitBlobSha(b);
      this.blobs.set(sha, b);
      return this.json(201, { sha });
    }
    if (rest === '/git/trees' && method === 'POST') {
      const t: TreeMap = body.base_tree ? { ...this.trees.get(body.base_tree)! } : {};
      for (const e of body.tree as { path: string; sha: string | null }[]) {
        if (e.sha === null) {
          if (!(e.path in t)) return this.json(422, { message: `GitRPC::BadObjectState (delete missing ${e.path})` });
          delete t[e.path];
        } else {
          if (!this.blobs.has(e.sha)) return this.json(422, { message: `tree.sha ${e.sha} is not a valid blob` });
          t[e.path] = e.sha;
        }
      }
      const sha = fakeSha('t');
      this.trees.set(sha, t);
      return this.json(201, { sha });
    }
    if (rest === '/git/commits' && method === 'POST') {
      const sha = fakeSha('c');
      this.commits.set(sha, { tree: body.tree, parents: body.parents, message: body.message });
      return this.json(201, { sha });
    }
    if ((m = /^\/git\/refs\/heads\/(.+)$/.exec(rest)) && method === 'PATCH') {
      const b = decodeURIComponent(m[1]!);
      const cur = this.refs[b];
      const c = this.commits.get(body.sha);
      if (!c) return this.json(422, { message: 'Object does not exist' });
      if (!body.force && !c.parents.includes(cur!)) return this.json(422, { message: 'Update is not a fast forward' });
      this.refs[b] = body.sha;
      return this.json(200, { object: { sha: body.sha } });
    }
    return this.json(404, { message: `unhandled ${method} ${rest}` });
  };
}

export const respond = (status: number, body: unknown = {}, headers: Record<string, string> = {}) =>
  () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
