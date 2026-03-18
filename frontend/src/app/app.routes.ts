import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/tasks', pathMatch: 'full' },

  //public routes
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component')
      .then(m => m.RegisterComponent)
  },

  //protected routes
  {
    path: 'tasks',
    loadComponent: () => import('./features/tasks/components/task-list/task-list.component')
      .then(m => m.TaskListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'tasks/new',
    loadComponent: () => import('./features/tasks/components/task-form/task-form.component')
      .then(m => m.TaskFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'tasks/edit/:id',
    loadComponent: () => import('./features/tasks/components/task-form/task-form.component')
      .then(m => m.TaskFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'tasks/:id',
    loadComponent: () => import('./features/tasks/components/task-details/task-details.component')
      .then(m => m.TaskDetailsComponent),
    canActivate: [AuthGuard]
  }
];
