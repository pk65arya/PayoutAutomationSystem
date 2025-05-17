package com.edtech.payoutautomation.controller;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import org.springframework.web.bind.annotation.ResponseBody;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Controller
public class MainController {

  // Serve the main index page
  @GetMapping("/")
  public String index() {
    return "index"; // This will resolve to the index.html template
  }

  // Explicitly serve JavaScript files with correct MIME type
  @GetMapping("/js/{filename:.+\\.js}")
  @ResponseBody
  public ResponseEntity<String> getJavaScript(@PathVariable String filename) {
    try {
      Resource resource = new ClassPathResource("static/js/" + filename);

      if (resource.exists()) {
        String jsContent = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/javascript"));

        return new ResponseEntity<>(jsContent, headers, HttpStatus.OK);
      } else {
        return ResponseEntity.notFound().build();
      }
    } catch (IOException e) {
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body("console.error('Error loading file: " + e.getMessage() + "');");
    }
  }

  // Health check endpoint
  @GetMapping("/health")
  @ResponseBody
  public ResponseEntity<String> healthCheck() {
    return ResponseEntity.ok("Application is running");
  }
}