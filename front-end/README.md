# Workout Tracker: front end

Angular 22 (standalone components, signals, zoneless), mobile-first. Talks to the NestJS API in
`../backend` and signs in with Firebase Auth. See the README one folder up for running everything.

```bash
npm install
npm start          # http://localhost:4200
npm test           # unit tests (Vitest)
npm run build
```

## Layout

- `src/app/core/models.ts`: domain types. These are the shapes the API should return.
- `src/app/core/content/`: content shipped with the app (exercise library, routines, lessons, warm-ups, foods).
- `src/app/core/api/`: Firebase sign-in, the API client (adds the ID token), route guards.
- `src/app/core/services/`: one service per area. `DataService` loads the signed-in user's data
  into them; each change updates the screen at once and is saved to the API in the background,
  rolling back with a message if the save fails. The workout in progress is saved as it changes.
- `src/app/core/logic/`: pure rules with unit tests. These cover the blue-arrow progression (`progression.ts`) and personal records (`records.ts`).
- `src/app/features/`: one folder per screen. `session/` is the active-workout screen.

Weights are always stored in kg and converted to the user's unit (lbs or kg) for display.
Sample data, deleting your data and signing out are on the Profile page.

## Deploying

Every push to `main` that changes `front-end/` builds the app and publishes it to GitHub Pages
(`.github/workflows/pages.yml`), at https://hassanrazakhalid.github.io/gym-tracker/.
The build sets the base href to the repository name and copies `index.html` to `404.html`
so deep links work. The app still calls the API at `environment.apiUrl`.
