module.exports = {
  plugins: [['babel-plugin-dynamic-import-node', { useESModules: false }]],
  presets: [['@vue/app', { useBuiltIns: 'usage', modules: 'commonjs' }]]
}
