package com.taskManager.backend.service;

import com.taskManager.backend.dto.TaskDTO;
import com.taskManager.backend.dto.TaskResponseDTO;
import com.taskManager.backend.model.TaskStatus;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

public interface TaskService {
    TaskResponseDTO createTask(TaskDTO taskDTO, UserDetails userDetails);
    TaskResponseDTO updateTask(Long id, TaskDTO taskDTO, UserDetails userDetails);
    TaskResponseDTO getTaskById(Long id, UserDetails userDetails);
    List<TaskResponseDTO> getAllTasks(UserDetails userDetails);
    List<TaskResponseDTO> getTasksByStatus(TaskStatus status, UserDetails userDetails);
    void deleteTask(Long id, UserDetails userDetails);
}
