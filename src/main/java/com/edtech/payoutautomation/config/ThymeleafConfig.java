package com.edtech.payoutautomation.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.spring6.templateresolver.SpringResourceTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

@Configuration
public class ThymeleafConfig {

  private static final Logger logger = LoggerFactory.getLogger(ThymeleafConfig.class);

  @Bean
  @Description("Thymeleaf Template Resolver for email templates")
  public SpringResourceTemplateResolver emailTemplateResolver() {
    SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
    resolver.setPrefix("classpath:/templates/");
    resolver.setSuffix(".html");
    resolver.setTemplateMode(TemplateMode.HTML);
    resolver.setCharacterEncoding("UTF-8");
    resolver.setOrder(1);
    resolver.setCacheable(false);
    logger.info("Configured email template resolver with prefix: {}", resolver.getPrefix());
    return resolver;
  }

  @Bean
  @Description("Thymeleaf Template Engine with increased debugging")
  public SpringTemplateEngine templateEngine() {
    SpringTemplateEngine engine = new SpringTemplateEngine();
    engine.addTemplateResolver(emailTemplateResolver());
    engine.setEnableSpringELCompiler(true);
    logger.info("Thymeleaf template engine configured with template resolver");
    return engine;
  }
}