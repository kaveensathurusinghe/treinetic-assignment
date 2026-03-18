import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Subject, takeUntil } from 'rxjs';

import { Task, TaskStatus, TaskStatusLabels } from '../../models/task.model';
import { TaskService } from '../../../../core/services/task.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatDialogModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  selectedStatus: TaskStatus | '' = '';
  statuses = TaskStatusLabels;
  loading = false;

  totalTasks = 0;
  todoCount = 0;
  inProgressCount = 0;
  doneCount = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🔵 TaskListComponent initialized');

    // Subscribe to tasks
    this.taskService.tasks$
      .pipe(takeUntil(this.destroy$))
      .subscribe((tasks: Task[]) => {
        console.log('📋 Tasks received:', tasks.length);
        this.tasks = tasks;
        this.updateStats(tasks);
        this.cdr.markForCheck();
      });

    // Subscribe to loading state
    this.taskService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe((loading: boolean) => {
        console.log('⏳ Loading state:', loading);
        this.loading = loading;
        this.cdr.markForCheck();
      });

    // FORCE LOAD TASKS IMMEDIATELY
    console.log('🚀 Calling loadTasks()');
    this.loadTasks();
  }

  loadTasks(): void {
    console.log('📞 loadTasks() called with status:', this.selectedStatus);
    this.taskService.loadTasks(this.selectedStatus || undefined);
  }

  onStatusFilter(status: TaskStatus | ''): void {
    console.log('🔍 Filter changed to:', status);
    this.selectedStatus = status;
    this.loadTasks();
  }

  clearFilter(): void {
    console.log('🧹 Clearing filter');
    this.selectedStatus = '';
    this.loadTasks();
  }

  viewTask(task: Task): void {
    this.router.navigate(['/tasks', task.id]);
  }

  editTask(event: Event, task: Task): void {
    event.stopPropagation();
    this.router.navigate(['/tasks/edit', task.id]);
  }

  deleteTask(event: Event, task: Task): void {
    event.stopPropagation();

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '350px',
      data: {
        title: 'Delete Task',
        message: `Are you sure you want to delete "${task.title}"?`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result && task.id) {
        this.taskService.deleteTask(task.id).subscribe({
          error: (err: any) => console.error('Error deleting task:', err)
        });
      }
    });
  }

  trackById(index: number, task: Task): number {
    return task.id!;
  }

  getStatusColor(status: TaskStatus): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj?.color || '#6c757d';
  }

  getStatusIcon(status: TaskStatus): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj?.icon || 'help';
  }

  getStatusLabel(status: TaskStatus): string {
    const statusObj = this.statuses.find(s => s.value === status);
    return statusObj?.label || status;
  }

  getDueDateStatus(task: Task): { class: string; text: string } {
    if (!task.dueDate) {
      return { class: 'text-muted', text: 'No due date' };
    }

    const today = new Date();
    const dueDate = new Date(task.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (task.status === TaskStatus.DONE) {
      return { class: 'text-success', text: 'Completed' };
    } else if (diffDays < 0) {
      return { class: 'text-danger fw-bold', text: 'Overdue!' };
    } else if (diffDays === 0) {
      return { class: 'text-warning fw-bold', text: 'Due today!' };
    } else if (diffDays <= 3) {
      return { class: 'text-warning', text: `Due in ${diffDays} days` };
    }
    return { class: 'text-info', text: `Due in ${diffDays} days` };
  }

  private updateStats(tasks: Task[]): void {
    this.totalTasks = tasks.length;
    this.todoCount = tasks.filter(t => t.status === TaskStatus.TODO).length;
    this.inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    this.doneCount = tasks.filter(t => t.status === TaskStatus.DONE).length;
  }

  ngOnDestroy(): void {
    console.log('🔴 TaskListComponent destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
