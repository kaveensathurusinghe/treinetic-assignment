import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';

import { TaskService } from '../../../../core/services/task.service';
import { Task, TaskStatus, TaskStatusLabels } from '../../models/task.model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskFormComponent implements OnInit, OnDestroy {
  taskForm: FormGroup;
  isEditMode = false;
  taskId?: number;
  statuses = TaskStatusLabels;
  loading = false;
  submitting = false;
  error = false;
  pageTitle = 'Create New Task';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.taskForm = this.fb.group({
      title: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: ['', Validators.maxLength(500)],
      status: ['TODO', Validators.required],
      dueDate: ['']
    });
  }

  ngOnInit(): void {
    this.taskId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.taskId;

    if (this.isEditMode) {
      this.pageTitle = 'Edit Task';
      console.log(`🔵 TaskFormComponent initialized for editing task ID: ${this.taskId}`);

      // Check cache first
      const currentTasks = this.taskService['tasksSubject'].value;
      const cachedTask = currentTasks.find(t => t.id === this.taskId);

      if (cachedTask) {
        console.log('📋 Using cached task for form:', cachedTask);
        this.populateForm(cachedTask);
      } else {
        this.loadTask();
      }
    } else {
      console.log('🔵 TaskFormComponent initialized for creating new task');
    }

    // Log form changes (helpful for debugging)
    this.taskForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  loadTask(): void {
    console.log(`🚀 Loading task for edit: ${this.taskId}`);
    this.loading = true;
    this.error = false;
    this.cdr.markForCheck();

    this.taskService.getTask(this.taskId!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (task) => {
          console.log('✅ Task loaded for editing:', task);
          this.populateForm(task);
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('❌ Error loading task:', error);
          this.error = true;
          this.loading = false;
          this.showError('Failed to load task');
          this.cdr.markForCheck();

          // Navigate back after delay
          setTimeout(() => {
            this.router.navigate(['/tasks']);
          }, 3000);
        }
      });
  }

  private populateForm(task: Task): void {
    this.taskForm.patchValue({
      title: task.title,
      description: task.description,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : ''
    }, { emitEvent: false });
  }

  onSubmit(): void {
    console.log('📝 Form submitted, isEditMode:', this.isEditMode);

    if (this.taskForm.invalid) {
      console.log('❌ Form is invalid');
      this.markFormGroupTouched(this.taskForm);
      this.showError('Please fix the errors in the form');
      return;
    }

    this.submitting = true;
    this.error = false;
    this.cdr.markForCheck();

    const taskData: Partial<Task> = this.taskForm.value;
    console.log('📦 Task data:', taskData);

    if (this.isEditMode) {
      this.taskService.updateTask(this.taskId!, taskData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (updatedTask) => {
            console.log('✅ Task updated successfully:', updatedTask);
            this.showSuccess('Task updated successfully');
            this.router.navigate(['/tasks', this.taskId]);
          },
          error: (error) => {
            console.error('❌ Error updating task:', error);
            this.error = true;
            this.submitting = false;
            this.showError('Failed to update task');
            this.cdr.markForCheck();
          }
        });
    } else {
      this.taskService.createTask(taskData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (newTask) => {
            console.log('✅ Task created successfully:', newTask);
            this.showSuccess('Task created successfully');
            this.router.navigate(['/tasks', newTask.id]);
          },
          error: (error) => {
            console.error('❌ Error creating task:', error);
            this.error = true;
            this.submitting = false;
            this.showError('Failed to create task');
            this.cdr.markForCheck();
          }
        });
    }
  }

  cancel(): void {
    console.log('⬅️ Form cancelled');
    if (this.isEditMode) {
      this.router.navigate(['/tasks', this.taskId]);
    } else {
      this.router.navigate(['/tasks']);
    }
  }

  resetForm(): void {
    console.log('🔄 Resetting form');
    if (this.isEditMode) {
      this.loadTask(); // Reload original data
    } else {
      this.taskForm.reset({
        title: '',
        description: '',
        status: 'TODO',
        dueDate: ''
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
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

  // Helper getters for template
  get title() { return this.taskForm.get('title'); }
  get description() { return this.taskForm.get('description'); }
  get status() { return this.taskForm.get('status'); }

  // Validation helpers for template
  get titleErrors(): string {
    if (this.title?.errors) {
      if (this.title.errors['required']) return 'Title is required';
      if (this.title.errors['minlength']) return 'Minimum 3 characters required';
      if (this.title.errors['maxlength']) return 'Maximum 100 characters exceeded';
    }
    return '';
  }

  get descriptionErrors(): string {
    if (this.description?.errors?.['maxlength']) {
      return 'Description cannot exceed 500 characters';
    }
    return '';
  }

  ngOnDestroy(): void {
    console.log('🔴 TaskFormComponent destroyed');
    this.destroy$.next();
    this.destroy$.complete();
  }
}
