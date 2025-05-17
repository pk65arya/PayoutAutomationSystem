package com.edtech.payoutautomation.config;

import com.stripe.Stripe;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

@Configuration
public class StripeConfig {

    @Value("${stripe.api.key:dummy_key_replace_in_properties}")
    private String stripeApiKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
    }
}