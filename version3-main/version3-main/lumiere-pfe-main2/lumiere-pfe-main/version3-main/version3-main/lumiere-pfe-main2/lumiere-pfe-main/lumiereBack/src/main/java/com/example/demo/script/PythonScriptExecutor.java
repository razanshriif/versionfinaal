package com.example.demo.script;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;

public class PythonScriptExecutor {

    public static void executePythonScript(String scriptPath, String inputPath, String outputPath) {
        ProcessBuilder processBuilder = new ProcessBuilder("python", scriptPath, inputPath, outputPath);
        try {
            Process process = processBuilder.start();
            
            // Read the output of the script
            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            String line;
            while ((line = reader.readLine()) != null) {
                System.out.println(line);
            }
            
            process.waitFor();
        } catch (IOException | InterruptedException e) {
            e.printStackTrace();
        }
    }
    
   
}