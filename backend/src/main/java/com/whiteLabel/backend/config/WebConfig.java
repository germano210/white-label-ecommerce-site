package com.whiteLabel.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadsLocation = Path.of("uploads")
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString();

        if (!uploadsLocation.endsWith("/")) {
            uploadsLocation += "/";
        }

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsLocation);
    }
}
