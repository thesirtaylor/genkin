CONFIG = {}; //Make this global to use all over the application

CONFIG.app          = process.env.APP   || 'development';
CONFIG.port         = process.env.PORT  || '3000';

CONFIG.client_url   = process.env.CLIENT_URL || "http://localhost:3000/";

CONFIG.jwt_encryption  = process.env.JWT_ENCRYPTION || 'jwt_please_change';
CONFIG.jwt_expiration  = process.env.JWT_EXPIRATION || '10000';

CONFIG.smtp_host = process.env.SMTP_HOST || "";
CONFIG.smtp_port = process.env.SMTP_PORT || "";
CONFIG.smtp_username = process.env.SMTP_USERNAME || "";
CONFIG.smtp_password = process.env.SMTP_PASSWORD || "";
CONFIG.smtp_enc = process.env.SMTP_ENC || "";