package com.reon.backend.moment.repository;

import com.reon.backend.moment.entity.Moment;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface MomentRepository extends JpaRepository<Moment, Long> {
    Optional<Moment> findByIdAndUserId(Long id, Long userId);
    List<Moment> findByUserIdAndRecordedAtGreaterThanEqualAndRecordedAtLessThanOrderByRecordedAtAscIdAsc(Long userId, Instant start, Instant end);

    @Query("""
        select m from Moment m where m.user.id = :userId
        and (:start is null or m.recordedAt >= :start)
        and (:end is null or m.recordedAt < :end)
        and (:cursorTime is null or m.recordedAt < :cursorTime
            or (m.recordedAt = :cursorTime and m.id < :cursorId))
        order by m.recordedAt desc, m.id desc
        """)
    List<Moment> findNext(@Param("userId") Long userId, @Param("start") Instant start,
            @Param("end") Instant end, @Param("cursorTime") Instant cursorTime,
            @Param("cursorId") Long cursorId, Pageable pageable);
}
