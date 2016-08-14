var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var config = require('./webpack.config');

new WebpackDevServer(webpack(config), {
  publicPath: config.output.publicPath,
  hot: true,
  historyApiFallback: true
}).listen(3333, '192.168.1.103', function (err, result) {
  if (err) {
    console.log(err);
  }

  console.log('Listening at 192.168.1.103:3333');
});
