module.exports = {
  secret: process.env.JWT_SECRET || 'default_secret_change_me',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret',
  expire: process.env.JWT_EXPIRE || '15m',
  refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};
