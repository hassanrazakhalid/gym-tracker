import { Routes } from '@angular/router';
import { activeSessionGuard, authGuard, guestGuard } from './core/api/guards';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: 'session',
    title: 'Workout in progress',
    // Only reachable while a workout is running; otherwise go to the Workout tab.
    canActivate: [activeSessionGuard],
    loadComponent: () => import('./features/session/session-page').then((m) => m.SessionPage),
  },
  {
    path: 'login',
    title: 'Sign in',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard',
        loadComponent: () => import('./features/dashboard/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'workout',
        title: 'Workout',
        loadComponent: () => import('./features/workout/workout-page').then((m) => m.WorkoutPage),
      },
      {
        path: 'workout/routines/:id',
        title: 'Workout preview',
        loadComponent: () =>
          import('./features/workout/routine-preview-page').then((m) => m.RoutinePreviewPage),
      },
      {
        path: 'workout/routines/:id/warmup',
        title: 'Warm-up',
        loadComponent: () => import('./features/workout/warmup-page').then((m) => m.WarmupPage),
      },
      {
        path: 'workout/summary/:id',
        title: 'Workout summary',
        loadComponent: () => import('./features/workout/summary-page').then((m) => m.SummaryPage),
      },
      {
        path: 'workout/sessions/:id',
        title: 'Past workout',
        loadComponent: () => import('./features/workout/summary-page').then((m) => m.SummaryPage),
      },
      {
        path: 'exercise/:id',
        title: 'Exercise history',
        loadComponent: () =>
          import('./features/workout/exercise-history-page').then((m) => m.ExerciseHistoryPage),
      },
      {
        path: 'progress',
        title: 'Progress',
        loadComponent: () => import('./features/progress/progress-page').then((m) => m.ProgressPage),
      },
      {
        path: 'progress/weight',
        title: 'Body weight',
        loadComponent: () => import('./features/progress/weight-page').then((m) => m.WeightPage),
      },
      {
        path: 'nutrition',
        title: 'Nutrition',
        loadComponent: () => import('./features/nutrition/nutrition-page').then((m) => m.NutritionPage),
      },
      {
        path: 'lessons',
        title: 'Lessons',
        loadComponent: () => import('./features/lessons/lessons-page').then((m) => m.LessonsPage),
      },
      {
        path: 'lessons/:id',
        title: 'Lesson',
        loadComponent: () => import('./features/lessons/lesson-page').then((m) => m.LessonPage),
      },
      {
        path: 'profile',
        title: 'Profile',
        loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
