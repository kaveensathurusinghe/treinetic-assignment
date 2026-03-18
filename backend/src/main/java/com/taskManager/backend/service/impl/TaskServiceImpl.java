package com.taskManager.backend.service.impl;

import com.taskManager.backend.dto.TaskDTO;
import com.taskManager.backend.dto.TaskResponseDTO;
import com.taskManager.backend.exception.ResourceNotFoundException;
import com.taskManager.backend.exception.UnauthorizedException;
import com.taskManager.backend.model.Task;
import com.taskManager.backend.model.TaskStatus;
import com.taskManager.backend.model.User;
import com.taskManager.backend.repository.TaskRepository;
import com.taskManager.backend.repository.UserRepository;
import com.taskManager.backend.service.TaskService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @Override
    public TaskResponseDTO createTask(TaskDTO taskDTO, UserDetails userDetails) {
        log.info("Creating new task for user: {}", userDetails.getUsername());

        User user = getUser(userDetails);

        Task task = new Task();
        task.setTitle(taskDTO.getTitle());
        task.setDescription(taskDTO.getDescription());
        task.setStatus(taskDTO.getStatus() != null ? taskDTO.getStatus() : TaskStatus.TODO);
        task.setDueDate(taskDTO.getDueDate());
        task.setUser(user);

        Task savedTask = taskRepository.save(task);
        return mapToResponseDTO(savedTask);
    }

    @Override
    public TaskResponseDTO updateTask(Long id, TaskDTO taskDTO, UserDetails userDetails) {
        log.info("Updating task with ID: {} for user: {}", id, userDetails.getUsername());

        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (!existingTask.getUser().getUsername().equals(userDetails.getUsername())) {
            throw new UnauthorizedException("You don't have permission to update this task");
        }

        if (taskDTO.getTitle() != null) {
            existingTask.setTitle(taskDTO.getTitle());
        }
        if (taskDTO.getDescription() != null) {
            existingTask.setDescription(taskDTO.getDescription());
        }
        if (taskDTO.getStatus() != null) {
            existingTask.setStatus(taskDTO.getStatus());
        }
        if (taskDTO.getDueDate() != null) {
            existingTask.setDueDate(taskDTO.getDueDate());
        }

        Task updatedTask = taskRepository.save(existingTask);
        return mapToResponseDTO(updatedTask);
    }

    @Override
    public TaskResponseDTO getTaskById(Long id, UserDetails userDetails) {
        log.debug("Fetching task with ID: {} for user: {}", id, userDetails.getUsername());

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (!task.getUser().getUsername().equals(userDetails.getUsername())) {
            throw new UnauthorizedException("You don't have permission to view this task");
        }

        return mapToResponseDTO(task);
    }

    @Override
    public List<TaskResponseDTO> getAllTasks(UserDetails userDetails) {
        log.debug("Fetching all tasks for user: {}", userDetails.getUsername());

        User user = getUser(userDetails);

        return taskRepository.findByUser(user)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<TaskResponseDTO> getTasksByStatus(TaskStatus status, UserDetails userDetails) {
        log.debug("Fetching tasks with status: {} for user: {}", status, userDetails.getUsername());

        User user = getUser(userDetails);

        return taskRepository.findByUserAndStatus(user, status)
                .stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteTask(Long id, UserDetails userDetails) {
        log.info("Deleting task with ID: {} for user: {}", id, userDetails.getUsername());

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        // Check if task belongs to the user
        if (!task.getUser().getUsername().equals(userDetails.getUsername())) {
            throw new UnauthorizedException("You don't have permission to delete this task");
        }

        taskRepository.deleteById(id);
    }

    private User getUser(UserDetails userDetails) {
        return userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private TaskResponseDTO mapToResponseDTO(Task task) {
        return TaskResponseDTO.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .status(task.getStatus())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .dueDate(task.getDueDate())
                .userId(task.getUser().getId())
                .username(task.getUser().getUsername())
                .build();
    }
}