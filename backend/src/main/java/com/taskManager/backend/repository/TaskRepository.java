package com.taskManager.backend.repository;

import com.taskManager.backend.model.Task;
import com.taskManager.backend.model.TaskStatus;
import com.taskManager.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByStatus(TaskStatus status);
    List<Task> findByUser(User user);
    List<Task> findByUserAndStatus(User user, TaskStatus status);
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId")
    List<Task> findByUserId(@Param("userId") Long userId);
    @Query("SELECT t FROM Task t WHERE t.user.id = :userId AND t.status = :status")
    List<Task> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") TaskStatus status);
    @Query("SELECT t.status, COUNT(t) FROM Task t WHERE t.user.id = :userId GROUP BY t.status")
    List<Object[]> countTasksByStatusAndUser(@Param("userId") Long userId);
}