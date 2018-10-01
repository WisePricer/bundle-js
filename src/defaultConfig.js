import { resolve } from 'path'
import WebpackNotifierPlugin from 'webpack-notifier'
import { DefinePlugin } from 'webpack'
import UglifyJsPlugin from 'uglifyjs-webpack-plugin'
import LiveReloadPlugin from 'webpack-livereload-plugin'
import CompressionPlugin from 'compression-webpack-plugin'
import flatten from 'lodash.flatten'
import mapValues from 'lodash.mapvalues'

import { getGitCommit } from './getGitCommit'

const MODE = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production'
}

module.exports = ({
  mode = MODE.DEVELOPMENT,
  context = resolve('./src'),
  entry = './index.js',
  output = {
    path: resolve('./dist')
  },
  lessOptions = {},
  watchOptions = {
    ignored: ['node_modules', 'cypress', `${output.path}/**/*`]
  },
  notify = true,
  inject = {},
  plugins = []
} = {}) => {
  const isDev = mode === MODE.DEVELOPMENT
  return {
    mode: isDev ? MODE.DEVELOPMENT : MODE.PRODUCTION,
    context,
    entry: flatten(['@babel/polyfill', entry]),
    output: {
      filename: isDev ? 'bundle.js' : 'bundle-[hash].js',
      ...output
    },
    watch: isDev,
    watchOptions,
    devtool: isDev ? 'inline-source-map' : undefined,

    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        },
        {
          test: /\.less$/,
          use: [
            { loader: 'style-loader' },
            { loader: 'css-loader' },
            {
              loader: 'less-loader',
              options: lessOptions
            }
          ]
        },
        {
          test: /\.svg$/,
          use: [
            {
              loader: 'babel-loader'
            },
            {
              loader: 'react-svg-loader',
              options: {
                svgo: {
                  plugins: [{ removeTitle: false }],
                  floatPrecision: 2
                }
              }
            }
          ]
        },
        {
          // image & font loader (base64 with fallback)
          test: /\.jpe?g$|\.gif$|\.png$|\.wav$|\.mp3|\.woff$|\.woff2$|\.otf$|\.eot$|\.ttf$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 25000,
                name: '[path][name].[hash].[ext]'
              }
            }
          ]
        }
      ]
    },

    plugins: [
      new DefinePlugin(
        mapValues(
          {
            __MODE__: mode,
            __GIT_COMMIT__: getGitCommit(),
            ...inject
          },
          ::JSON.stringify
        )
      ),
      ...(notify ? [new WebpackNotifierPlugin({ alwaysNotify: true })] : []),
      ...(isDev ? [new LiveReloadPlugin({ appendScriptTag: true })] : [new CompressionPlugin()]),
      ...plugins
    ],

    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          uglifyOptions: {
            ecma: 6
          },
          sourceMap: false
        })
      ]
    }
  }
}
