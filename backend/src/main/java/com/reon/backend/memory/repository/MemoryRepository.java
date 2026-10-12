package com.reon.backend.memory.repository;

import com.reon.backend.memory.entity.Memory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.*;

public interface MemoryRepository extends JpaRepository<Memory, Long> {
    List<Memory> findByUserIdAndPeriodMonthOrderByIdAsc(Long userId, String month);
    Optional<Memory> findByIdAndUserId(Long id, Long userId);
}
