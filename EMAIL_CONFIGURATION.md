# Email Configuration for Receipt Sending

This document explains how to configure the email service for sending payment receipts to mentors.

## Configuration Steps

### 1. Update application.properties

The email configuration is in `src/main/resources/application.properties`. You need to update the following properties with your email service details:

```properties
# Mail configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_APP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### 2. Using Gmail

If you're using Gmail as the email service:

1. Replace `YOUR_EMAIL@gmail.com` with your actual Gmail address
2. For `YOUR_APP_PASSWORD`, you need to generate an App Password:
   - Go to your Google Account settings
   - Select "Security"
   - Under "Signing in to Google", select "App passwords"
     (You may need to enable 2-Step Verification first)
   - Create a new app password for "Mail" and use the generated password

### 3. Using Other Email Services

For other email services, update the configuration with:

- `spring.mail.host`: Your email provider's SMTP server (e.g., smtp.office365.com for Outlook)
- `spring.mail.port`: The SMTP port (typically 587 for TLS or 465 for SSL)
- `spring.mail.username`: Your email address
- `spring.mail.password`: Your password or generated app password
- Update the authentication and TLS/SSL settings accordingly

### 4. Testing Email Configuration

To test if your email configuration is working:

1. Set up your email credentials in application.properties
2. Restart the application
3. Go to the Payments tab
4. Create a payment and generate a receipt
5. Try to send the receipt to the mentor

If you encounter errors, check the server logs for detailed information.

## Troubleshooting

Common issues include:

1. **Authentication failure**: Make sure your username and password are correct
2. **Security settings**: If using Gmail, ensure you're using an app password
3. **SMTP settings**: Verify the correct host and port for your email provider
4. **Firewall issues**: Check if your network allows outgoing connections to SMTP ports

For Gmail-specific issues, also check:

- Ensure "Less secure app access" is enabled, or
- You're using an app password with 2-Step Verification

## Email Template

The email template is located at `src/main/resources/templates/emails/payment-receipt.html`. You can customize this template to change the appearance of receipt emails.
