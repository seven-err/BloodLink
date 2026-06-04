module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      [
        'auth',
        'profile',
        'requests',
        'matching',
        'maps',
        'notifications',
        'supabase',
        'deps',
        'readme',
        'ci',
        'git',
        'docs',
        'config',
        'app',
      ],
    ],
  },
};
