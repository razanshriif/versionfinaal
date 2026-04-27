package com.example.demo.script;

import java.io.File;
import java.io.IOException;
import java.util.List;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

public class JsonReader {

    public static List<?> readJsonFileToList(String filePath) {
        ObjectMapper objectMapper = new ObjectMapper();
        try {
            return objectMapper.readValue(new File(filePath), new TypeReference<List<?>>() {});
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }
}