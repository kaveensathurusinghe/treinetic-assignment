package com.taskManager.backend.controller;

import com.taskManager.backend.dto.TaskDTO;
import com.taskManager.backend.dto.TaskResponseDTO;
import com.taskManager.backend.model.TaskStatus;
import com.taskManager.backend.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = {"http://localhost:4200", "http://localhost"})
@RequiredArgsConstructor
@Slf4j
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskResponseDTO>> getAllTasks(
            @RequestParam(required = false) TaskStatus status,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("GET /api/tasks - fetching tasks for user: {}", userDetails.getUsername());

        List<TaskResponseDTO> tasks = (status != null)
                ? taskService.getTasksByStatus(status, userDetails)
                : taskService.getAllTasks(userDetails);

        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> getTaskById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("GET /api/tasks/{} - fetching task for user: {}", id, userDetails.getUsername());

        TaskResponseDTO task = taskService.getTaskById(id, userDetails);
        return ResponseEntity.ok(task);
    }

    @PostMapping
    public ResponseEntity<TaskResponseDTO> createTask(
            @Valid @RequestBody TaskDTO taskDTO,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("POST /api/tasks - creating task for user: {}", userDetails.getUsername());

        TaskResponseDTO createdTask = taskService.createTask(taskDTO, userDetails);
        return new ResponseEntity<>(createdTask, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponseDTO> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody TaskDTO taskDTO,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("PUT /api/tasks/{} - updating task for user: {}", id, userDetails.getUsername());

        TaskResponseDTO updatedTask = taskService.updateTask(id, taskDTO, userDetails);
        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("DELETE /api/tasks/{} - deleting task for user: {}", id, userDetails.getUsername());

        taskService.deleteTask(id, userDetails);
        return ResponseEntity.noContent().build();
    }
}