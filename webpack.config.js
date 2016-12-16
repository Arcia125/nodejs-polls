const webpack = require('webpack');
const path = require('path');
const host = 'localhost';
const port = 8001; 

const prod = process.argv.indexOf('-p') !== -1;


const config = {
	context: path.join(__dirname, '/views'),
	entry: {
		main: './main.js'
	},
	output: {
		filename: 'bundle.js',
		path: path.join(__dirname, '/views'),
	},
	module: {
		loaders: [
		{
            test: /\.scss$/,
            exclude: /node_modules/,
            loaders: ["style", "css?sourceMap", "sass?sourceMap"]
            //loader: ExtractTextPlugin.extract('css!sass')
        },
		{
			test: /\.jsx?$/,
			exclude: /node_modules/,
			loader: 'babel',
			query: {
				presets: ['es2015']
			}
		},
		{
			test: /\.html$/,
			exclude: /node_modules/,
			loader: 'file-loader?name=[name].[ext]'
		},
		{
			test: /\.(png|jpg)$/,
			exclude: /node_modules/,
			loader: 'url-loader'
		}
		]
	},
	devServer: {
		inline: true,
		host: host,
		port: port
	},
	devtool: 'source-map'
}


config.plugins = config.plugins||[];
if (prod) {
  config.plugins.push(new webpack.DefinePlugin({
      'process.env': {
          'NODE_ENV': `"production"`
      }
  }));
} else {
  config.plugins.push(new webpack.DefinePlugin({
      'process.env': {
          'NODE_ENV': `""`
      }
  }));
}

module.exports = config;