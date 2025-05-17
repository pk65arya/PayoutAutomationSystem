package com.edtech.payoutautomation.security;

import com.edtech.payoutautomation.security.jwt.AuthEntryPointJwt;
import com.edtech.payoutautomation.security.jwt.AuthTokenFilter;
import com.edtech.payoutautomation.security.services.UserDetailsServiceImpl;
import com.edtech.payoutautomation.security.services.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.Customizer;
import org.springframework.security.authorization.AuthorizationDecision;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class WebSecurityConfig {
  @Autowired
  UserDetailsServiceImpl userDetailsService;

  @Autowired
  private AuthEntryPointJwt unauthorizedHandler;

  @Bean
  public AuthTokenFilter authenticationJwtTokenFilter() {
    return new AuthTokenFilter();
  }

  @Bean
  public DaoAuthenticationProvider authenticationProvider() {
    DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();

    authProvider.setUserDetailsService(userDetailsService);
    authProvider.setPasswordEncoder(passwordEncoder());

    return authProvider;
  }

  @Bean
  public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
    return authConfig.getAuthenticationManager();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        // Configure CORS
        .cors(Customizer.withDefaults())
        // Disable CSRF for API usage
        .csrf(AbstractHttpConfigurer::disable)
        // Configure exception handling
        .exceptionHandling(exception -> exception.authenticationEntryPoint(unauthorizedHandler))
        // Use stateless session management
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        // Configure request authorization
        .authorizeHttpRequests(auth -> auth
            // Static resources - allow without authentication
            .requestMatchers("/", "/index.html", "/favicon.ico").permitAll()
            .requestMatchers("/health").permitAll()
            .requestMatchers("/static/**").permitAll()
            .requestMatchers("/public/**").permitAll()
            .requestMatchers("/js/**").permitAll()
            .requestMatchers("/css/**").permitAll()
            .requestMatchers("/images/**").permitAll()
            // Add receipt files access
            .requestMatchers("/receipts/**").permitAll()
            // Individual file extensions
            .requestMatchers("/*.js").permitAll()
            .requestMatchers("/*.css").permitAll()
            .requestMatchers("/*.ico").permitAll()
            .requestMatchers("/*.png").permitAll()
            .requestMatchers("/*.jpg").permitAll()
            // Authentication endpoints
            .requestMatchers("/api/auth/**").permitAll()
            // API endpoints with role-based access - PUT MESSAGE ENDPOINTS FIRST
            .requestMatchers("/api/messages/**").hasAnyRole("ADMIN", "MENTOR")
            .requestMatchers("/api/users/admins").hasAnyRole("ADMIN", "MENTOR")
            .requestMatchers("/api/users/{id}/**").access((authentication, object) -> {
              Long userId = Long.parseLong(object.getVariables().get("id").toString());
              Long authenticatedId = authentication.get().getName().equals("anonymousUser") ? -1L
                  : ((UserDetailsImpl) authentication.get().getPrincipal()).getId();
              return userId.equals(authenticatedId) || authentication.get().getAuthorities().stream()
                  .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")) ? new AuthorizationDecision(true)
                      : new AuthorizationDecision(false);
            })
            .requestMatchers("/.well-known/**").permitAll()
            .requestMatchers("/api/sessions/mentor/**").hasAnyRole("ADMIN", "MENTOR")
            .requestMatchers("/api/payments/mentor/**").hasAnyRole("ADMIN", "MENTOR")
            .requestMatchers("/api/sessions/**").hasRole("ADMIN")
            .requestMatchers("/api/payments/**").hasRole("ADMIN")
            .requestMatchers("/h2-console/**").permitAll()
            // Public API endpoints
            .requestMatchers("/api/public/**").permitAll()
            // Require authentication for all other requests
            .anyRequest().authenticated());

    // Disable frameOptions for H2 console
    http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable()));

    // Add authentication provider and custom JWT filter
    http.authenticationProvider(authenticationProvider());
    http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

    return http.build();
  }
}