import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { TaskService } from '../../../../core/services/task.service';
import { Task, TaskStatus, TaskStatusLabels } from '../../models/task.model';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-task-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskDetailsComponent implements OnInit, OnDestroy {
  task?: Task;
  loading = false;
  error = false;
  statuses = TaskStatusLabels;

  private taskId: number;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.taskId = Number(this.route.snapshot.params['id']);
  }

  ngOnInit(): void {
    console.log(`🔵 TaskDetailsComponent initialized for ID: ${this.taskId}`);

    // First check if we already have this task in cache
    const currentTasks = this.taskService['tasksSubject'].value;
    const cachedTask = currentTasks.find(t => t.id === this.taskId);

    if (cachedTask) {
      console.log('📋 Using cached task:', cachedTask);
      this.task = cachedTask;
      this.cdr.markForCheck();
    } else {
      // If not in cache, load it
      this.loadTask();
    }

    // Subscribe to task updates (in case task is updated elsewhere)
    this.taskService.tasks$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tasks: Task[]) => {
        const updatedTask = tasks.find(t => t.id === this.taskId);
        if (updatedTask) {
          console.log('📋 Task updated from service:', updatedTask);
          this.task = updatedTask;
          this.cdr.markForCheck();
        }
      });

    // Subscribe to loading state
    this.taskService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading: boolean) => {
        this.loading = loading;
        this.cdr.markForCheck();
      });
  }

  loadTask(): void {
    console.log(`🚀 Loading task ID: ${this.taskId}`);
    this.loading = true;
    this.error = false;
    this.cdr.markForCheck();

    this.taskService.getTask(this.taskId).subscribe({
      next: (task) => {
        console.log('✅ Task loaded:', task);
        this.task = task;
        this.error = false;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('❌ Error loading task:', error);
        this.error = true;
        this.loading = false;
        this.showError('Failed to load task details');
        this.cdr.markForCheck();

        // Navigate back after a delay
        setTimeout(() => {
          this.router.navigate(['/tasks']);
        }, 3000);
      }
    });
  }

  editTask(): void {
    console.log('✏️ Navigating to edit task:', this.taskId);
    this.router.navigate(['/tasks/edit', this.taskId]);
  }

  deleteTask(): void {
    console.log('🗑️ Deleting task:', this.taskId);

    const dialogData: ConfirmationDialogData = {
      title: 'Delete Task',
      message: `Are you sure you want to delete "${this.task?.title}"?`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: boolean) => {
        if (result && this.task?.id) {
          this.loading = true;
          this.cdr.markForCheck();

          this.taskService.deleteTask(this.task.id).subscribe({
            next: () => {
              console.log('✅ Task deleted successfully');
              this.showSuccess('Task deleted successfully');
              this.router.navigate(['/tasks']);
            },
            error: (error) => {
              console.error('❌ Error deleting task:', error);
              this.loading = false;
              this.showError('Failed to delete task');
              this.cdr.markForCheck();
            }
          });
        }
      });
  }

  refreshTask(): void {
    console.log('🔄 Refreshing task:', this.taskId);
    this.loadTask();
  }

  goBack(): void {
    console.log('⬅️ Navigating back to tasks');
    this.router.navigate(['/tasks']);
  }

  getStatusInfo(status: TaskStatus) {
    return this.statuses.find(s => s.value === status) || this.statuses[0];
  }

  getStatusColor(status: TaskStatus): string {
    return this.getStatusInfo(status).color;
  }

  getStatusIcon(status: TaskStatus): string {
    return this.getStatusInfo(status).icon;
  }

  getStatusLabel(status: TaskStatus): string {
    return this.getStatusInfo(status).label;
  }

  formatDate(date?: Date): string {
    if (!date) return 'Not set';
    try {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return 'Invalid date';
    }
  }

  isOverdue(): boolean {
    if (!this.task?.dueDate || this.task.status === TaskStatus.DONE) return false;
    return new Date(this.task.dueDate) < new Date();
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  ngOnDestroy(): void {
    console.log(`🔴 TaskDetailsComponent destroyed for ID: ${this.taskId}`);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
