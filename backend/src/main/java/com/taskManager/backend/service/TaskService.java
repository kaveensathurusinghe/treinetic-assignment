package com.taskManager.backend.service;

import com.taskManager.backend.dto.TaskDTO;
import com.taskManager.backend.dto.TaskResponseDTO;
import com.taskManager.backend.model.TaskStatus;

import java.util.List;

public interface TaskService {
    TaskResponseDTO createTask(TaskDTO taskDTO);
    TaskResponseDTO updateTask(Long id, TaskDTO taskDTO);
    TaskResponseDTO getTaskById(Long id);
    List<TaskResponseDTO> getAllTasks();
    List<TaskResponseDTO> getTasksByStatus(TaskStatus status);
    void deleteTask(Long id);
}
