package com.example.demo.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.stereotype.Service;

@Service
public class MatriculeService {
    private static final String PREFIX = "";
    private AtomicInteger counter = new AtomicInteger(1);
    private String currentMonth;

    public MatriculeService() {
        currentMonth = getCurrentMonth();
    }

    public synchronized String generateMatricule() {
        String month = getCurrentMonth();
        if (!month.equals(currentMonth) || counter.get() > 666666) {
            counter.set(1);
            currentMonth = month;
        }
        return String.format("%s%s%06d", PREFIX, month, counter.getAndIncrement());
    }

    private String getCurrentMonth() {
        LocalDate now = LocalDate.now();
        return now.format(DateTimeFormatter.ofPattern("yyyyMM"));
    }
}