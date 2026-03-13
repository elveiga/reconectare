module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2022: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      alias: {
        map: [['@', './src']],
        extensions: ['.js', '.jsx']
      }
    }
  },
  plugins: ['react', 'react-hooks', 'import'],
  ignorePatterns: ['dist/', 'node_modules/', 'database/', 'uploads/'],
  overrides: [
    {
      files: ['**/*.{js,jsx}'],
      rules: {
        'no-undef': 'error',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-console': 'off',
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off'
      }
    }
  ]
};
