@echo off
echo Starting Payout Automation System...
java -cp "target/classes;target/dependency/*" com.edtech.payoutautomation.PayoutAutomationApplication
if %ERRORLEVEL% neq 0 (
    echo Error starting the application.
    echo Please make sure:
    echo 1. The application is compiled
    echo 2. PostgreSQL is running
    echo 3. The database 'payoutdb' exists
)
pause 