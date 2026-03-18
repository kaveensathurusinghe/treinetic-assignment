import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';
import { Task, TaskStatus, TaskStats } from '../../features/tasks/models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:8080/api/tasks';

  // State management using BehaviorSubject
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private statsSubject = new BehaviorSubject<TaskStats>({ total: 0, todo: 0, inProgress: 0, done: 0 });

  // Public observables
  tasks$ = this.tasksSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  stats$ = this.statsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all tasks with optional status filter
  loadTasks(status?: TaskStatus): void {
    this.loadingSubject.next(true);

    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }

    this.http.get<Task[]>(this.apiUrl, { params })
      .pipe(
        tap(tasks => {
          this.tasksSubject.next(tasks);
          this.updateStats(tasks);
        }),
        catchError(error => {
          console.error('Error loading tasks:', error);
          return throwError(() => error);
        }),
        finalize(() => this.loadingSubject.next(false))
      )
      .subscribe();
  }

  // Get single task
  getTask(id: number): Observable<Task> {
    this.loadingSubject.next(true);
    return this.http.get<Task>(`${this.apiUrl}/${id}`)
      .pipe(
        finalize(() => this.loadingSubject.next(false))
      );
  }

  // Create task
  createTask(task: Partial<Task>): Observable<Task> {
    this.loadingSubject.next(true);
    return this.http.post<Task>(this.apiUrl, task)
      .pipe(
        tap(newTask => {
          const currentTasks = this.tasksSubject.value;
          this.tasksSubject.next([...currentTasks, newTask]);
          this.updateStats([...currentTasks, newTask]);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  // Update task
  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    this.loadingSubject.next(true);
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task)
      .pipe(
        tap(updatedTask => {
          const currentTasks = this.tasksSubject.value;
          const updatedTasks = currentTasks.map(t =>
            t.id === id ? updatedTask : t
          );
          this.tasksSubject.next(updatedTasks);
          this.updateStats(updatedTasks);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  // Delete task
  deleteTask(id: number): Observable<void> {
    this.loadingSubject.next(true);
    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(() => {
          const currentTasks = this.tasksSubject.value;
          const updatedTasks = currentTasks.filter(t => t.id !== id);
          this.tasksSubject.next(updatedTasks);
          this.updateStats(updatedTasks);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
  }

  // Update statistics
  private updateStats(tasks: Task[]): void {
    const stats: TaskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      done: tasks.filter(t => t.status === TaskStatus.DONE).length
    };
    this.statsSubject.next(stats);
  }

  // Refresh tasks
  refreshTasks(): void {
    this.loadTasks();
  }
}
