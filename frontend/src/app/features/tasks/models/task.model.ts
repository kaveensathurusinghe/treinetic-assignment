export interface Task {
  id?: number;
  title: string;
  description?: string;
  status: TaskStatus;
  createdAt?: Date;
  updatedAt?: Date;
  dueDate?: Date;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE'
}

export const TaskStatusLabels = [
  { value: TaskStatus.TODO, label: 'To Do', icon: 'pending', color: '#6c757d' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress', icon: 'sync', color: '#0d6efd' },
  { value: TaskStatus.DONE, label: 'Done', icon: 'check_circle', color: '#198754' }
];

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}
