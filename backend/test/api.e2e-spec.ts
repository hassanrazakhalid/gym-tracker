/**
 * End-to-end tests against the Firebase emulators. Start them first
 * (`npm run emulators`), or run everything at once with `npm run test:e2e:emu`.
 */
import { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/setup.js';

const AUTH_EMULATOR = 'http://127.0.0.1:9099';
const PROJECT = 'demo-gym-tracker';

async function signUp(email: string): Promise<string> {
  const res = await fetch(`${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', returnSecureToken: true }),
  });
  const body = (await res.json()) as { idToken: string };
  return body.idToken;
}

function session(id: string, sets: [number, number, boolean][], exerciseId = 'bench-press', startedAt = new Date().toISOString()) {
  return {
    id,
    routineId: 'push',
    name: 'Push',
    startedAt,
    endedAt: null,
    status: 'active',
    groups: [{ id: 'g1', restSeconds: 90 }],
    exercises: [
      {
        id: `${id}-ex`,
        exerciseId,
        groupId: 'g1',
        notes: '',
        sets: sets.map(([w, r, done], i) => ({
          id: `${id}-s${i + 1}`,
          setNumber: i + 1,
          weightKg: w,
          reps: r,
          effort: done ? 'ideal' : null,
          completed: done,
          completedAt: done ? new Date(Date.parse(startedAt) + (i + 1) * 60_000).toISOString() : null,
        })),
      },
    ],
  };
}

describe('API (e2e, Firebase emulators)', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    // Fresh emulator state for every run.
    await fetch(`http://127.0.0.1:8080/emulator/v1/projects/${PROJECT}/databases/(default)/documents`, { method: 'DELETE' });
    await fetch(`${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT}/accounts`, { method: 'DELETE' });
    tokenA = await signUp('a@example.com');
    tokenB = await signUp('b@example.com');

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app as NestExpressApplication);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('serves the library without signing in', async () => {
    const res = await api().get('/api/library').expect(200);
    expect(res.body.exercises.length).toBeGreaterThan(30);
    expect(res.body.routines.map((r: { id: string }) => r.id)).toEqual(['push', 'pull', 'legs', 'lower-glutes']);
  });

  it('rejects requests without a valid token', async () => {
    await api().get('/api/me').expect(401);
    await api().get('/api/me').set({ Authorization: 'Bearer not-a-token' }).expect(401);
  });

  it('creates a profile on first sign-in and updates it', async () => {
    const me = await api().get('/api/me').set(as(tokenA)).expect(200);
    expect(me.body).toMatchObject({ email: 'a@example.com', unit: 'lb', name: 'a' });
    const patched = await api().patch('/api/me').set(as(tokenA)).send({ name: 'Alex', unit: 'kg' }).expect(200);
    expect(patched.body).toMatchObject({ name: 'Alex', unit: 'kg' });
  });

  it('validates input', async () => {
    const res = await api().patch('/api/me').set(as(tokenA)).send({ unit: 'stone' }).expect(400);
    expect(JSON.stringify(res.body)).toContain('unit');
    await api().put('/api/me/plan').set(as(tokenA)).send({ week: ['push'] }).expect(400);
    await api().put('/api/me/plan').set(as(tokenA)).send({ week: [null, 'push', 'nope', null, null, null, null] }).expect(400);
  });

  it('saves the weekly plan', async () => {
    const week = [null, 'legs', 'pull', 'push', null, 'push', null];
    await api().put('/api/me/plan').set(as(tokenA)).send({ week }).expect(200);
    const me = await api().get('/api/me').set(as(tokenA)).expect(200);
    expect(me.body.weekPlan).toEqual(week);
  });

  it('keeps the active workout, then finishes it with PRs judged against history', async () => {
    const first = session('ses1', [[60, 8, true], [60, 7, true]], 'bench-press', '2026-11-01T10:00:00.000Z');
    await api().put('/api/sessions/active').set(as(tokenA)).send(first).expect(200);
    const active = await api().get('/api/sessions/active').set(as(tokenA)).expect(200);
    expect(active.body.session.id).toBe('ses1');

    const done1 = await api().post('/api/sessions').set(as(tokenA)).send(first).expect(201);
    expect(done1.body.session.prSetIds).toEqual([]); // first time: no PRs
    expect((await api().get('/api/sessions/active').set(as(tokenA))).body.session).toBeNull();

    // Second workout beats the reps; the unfinished set is dropped.
    const second = session('ses2', [[60, 9, true], [60, 9, true], [60, 0, false]], 'bench-press', '2026-11-08T10:00:00.000Z');
    const done2 = await api().post('/api/sessions').set(as(tokenA)).send(second).expect(201);
    expect(done2.body.session.prSetIds).toEqual(['ses2-s1']);
    expect(done2.body.session.exercises[0].sets).toHaveLength(2);

    // Retrying the finish is harmless.
    await api().post('/api/sessions').set(as(tokenA)).send(second).expect(201);
    const list = await api().get('/api/sessions').set(as(tokenA)).expect(200);
    expect(list.body.sessions.map((s: { id: string }) => s.id)).toEqual(['ses2', 'ses1']);
  });

  it('rejects unknown exercises', async () => {
    await api().put('/api/sessions/active').set(as(tokenA)).send(session('bad', [[1, 1, true]], 'moon-press')).expect(400);
  });

  it('keeps users apart', async () => {
    const list = await api().get('/api/sessions').set(as(tokenB)).expect(200);
    expect(list.body.sessions).toEqual([]);
    await api().get('/api/sessions/ses1').set(as(tokenB)).expect(404);
  });

  it('stores routine edits and restores the original', async () => {
    const lib = await api().get('/api/library').expect(200);
    const legs = structuredClone(lib.body.routines.find((r: { id: string }) => r.id === 'legs'));
    legs.blocks[0].exercises[0].exerciseId = 'hack-squat';
    await api().put('/api/routines/legs').set(as(tokenA)).send(legs).expect(200);
    let mine = await api().get('/api/routines').set(as(tokenA)).expect(200);
    expect(mine.body.customized).toEqual(['legs']);
    expect(mine.body.routines[2].blocks[0].exercises[0].exerciseId).toBe('hack-squat');
    await api().delete('/api/routines/legs').set(as(tokenA)).expect(200);
    mine = await api().get('/api/routines').set(as(tokenA)).expect(200);
    expect(mine.body.routines[2].blocks[0].exercises[0].exerciseId).toBe('back-squat');
  });

  it('logs daily tracking by date', async () => {
    await api().put('/api/body-weight/2026-11-20').set(as(tokenA)).send({ weightKg: 85.5 }).expect(200);
    await api().put('/api/body-weight/2026-11-20').set(as(tokenA)).send({ weightKg: 85.1 }).expect(200); // same day replaces
    const bw = await api().get('/api/body-weight').set(as(tokenA)).expect(200);
    expect(bw.body.entries).toEqual([{ id: '2026-11-20', date: '2026-11-20', weightKg: 85.1 }]);

    const food = await api()
      .post('/api/foods')
      .set(as(tokenA))
      .send({ date: '2026-11-20', meal: 'Lunch', name: 'Rice', calories: 260, proteinG: 5 })
      .expect(201);
    await api().delete(`/api/foods/${food.body.entry.id}`).set(as(tokenA)).expect(204);
    expect((await api().get('/api/foods').set(as(tokenA))).body.entries).toEqual([]);

    await api().put('/api/check-ins/2026-11-20').set(as(tokenA)).send({ hunger: 3, energy: 4, onPlan: true }).expect(200);
    await api().put('/api/steps/2026-11-20').set(as(tokenA)).send({ steps: 8000 }).expect(200);
    await api().put('/api/steps/2026-11-20').set(as(tokenA)).send({ steps: -1 }).expect(400);
  });

  it('loads demo data for a new account and wipes it again', async () => {
    await api().post('/api/me/demo-data').set(as(tokenB)).send({ today: '2026-11-25' }).expect(204);
    const sessions = await api().get('/api/sessions').set(as(tokenB)).expect(200);
    expect(sessions.body.sessions.length).toBeGreaterThan(30);
    expect(sessions.body.sessions.some((s: { prSetIds: string[] }) => s.prSetIds.length > 0)).toBe(true);
    const bw = await api().get('/api/body-weight').set(as(tokenB)).expect(200);
    expect(bw.body.entries.length).toBeGreaterThan(40);

    await api().delete('/api/me/data').set(as(tokenB)).expect(204);
    expect((await api().get('/api/sessions').set(as(tokenB))).body.sessions).toEqual([]);
  }, 30_000);
});
