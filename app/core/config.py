import os


def _split_csv(value: str | None, default: list[str]) -> list[str]:
    if not value:
        return default
    return [item.strip() for item in value.split(',') if item.strip()]


class Settings:
    APP_NAME = os.getenv('APP_NAME', 'API Delivery')
    APP_VERSION = os.getenv('APP_VERSION', '2.2.0')
    SECRET_KEY = os.getenv('SECRET_KEY', 'CHANGE_ME_IN_PRODUCTION')
    ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
    TOKEN_EXPIRE_HOURS = int(os.getenv('TOKEN_EXPIRE_HOURS', '24'))
    ALLOWED_ORIGINS = _split_csv(
        os.getenv('ALLOWED_ORIGINS'),
        [
            'http://localhost:5173',
            'http://127.0.0.1:5173',
        ],
    )
    ALLOWED_HOSTS = _split_csv(
        os.getenv('ALLOWED_HOSTS'),
        ['localhost', '127.0.0.1'],
    )
    LOGIN_RATE_LIMIT_WINDOW_SECONDS = int(os.getenv('LOGIN_RATE_LIMIT_WINDOW_SECONDS', '300'))
    LOGIN_RATE_LIMIT_MAX_ATTEMPTS = int(os.getenv('LOGIN_RATE_LIMIT_MAX_ATTEMPTS', '12'))


settings = Settings()
