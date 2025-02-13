import path from 'path'
import { fileURLToPath } from 'url'

import { CleanWebpackPlugin } from 'clean-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

const __filename = fileURLToPath(import.meta.url) // get the resolved path to the file
const __dirname = path.dirname(__filename) // get the name of the directory

const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test'
const urlPrefix = '/claim'
console.log(`Running webpack in ${isDev ? 'development' : 'production'} mode`)

export default {
  entry: './app/frontend/src/entry.js',
  mode: isDev ? 'development' : 'production',
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              esModule: false,
              publicPath: '../'
            }
          },
          'css-loader',
          'resolve-url-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                outputStyle: 'compressed'
              }
            }
          }
        ]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[contenthash][ext]'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[contenthash][ext]'
        }
      }
    ]
  },
  output: {
    filename: 'js/[contenthash].js',
    path: path.resolve(__dirname, 'app/frontend/dist'),
    publicPath: `${urlPrefix}/assets/`
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      inject: false,
      filename: '../../views/layouts/layout.njk',
      template: 'app/views/layouts/_layout.njk',
      meta: { urlPrefix }
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[contenthash].css'
    })
  ]
}
