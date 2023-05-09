const rules = require('./webpack.rules')
const { VueLoaderPlugin } = require('vue-loader')

rules.push(
    {
        test: /\.vue$/,
        loader: 'vue-loader',
    },
    {
        test: /\.js$/,
        loader: 'babel-loader',
    },
    {
        test: /\.css$/,
        use: [
            'vue-style-loader',
            'css-loader',
        ],
    },
    {
        test: /\.scss$/,
        use: [
            'vue-style-loader',
            'sass-loader',
        ],
    },
    {
        test: /\.(png|jpe?g|gif|svg)$/,
        loader: 'file-loader',
    },
)

module.exports = {
    // Put your normal webpack config below here
    module: {
        rules,
    },
    plugins: [
        // make sure to include the plugin for the magic
        new VueLoaderPlugin(),
    ],
}
