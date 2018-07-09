const path = require('path');
const webpack = require('webpack');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
/*

we have 5 modes.
development.local
development.lan
production.localhost
production.host
production.profile

pass in either a specific config file or one of those options above as environment variable.
to webpack.
e.g.
webpack --env.mode development.local
webpack --env.config <PATH_TO_CONFIG>
 */
module.exports = (env) => {
   if(!env)
       throw new Error("env not defined.");
    if (!(env.config || env.mode))
        throw new Error("must define either a config or a mode.");
    if (env.config){
        require('dotenv').config({path:env.config});
    }else{
        switch(env.mode){
            case 'development.local':
                require('dotenv').config({path: '../shared/.development.local.env'});
                break;
            case 'development.lan':
                require('dotenv').config({path: '../shared/.development.lan.env'});
                break;
            case 'production.profile':
            case 'production.local':
                require('dotenv').config({path: '../shared/.production.local.env'});
                break;
            case 'production.host':
                require('dotenv').config({path: '../shared/.production.host.env'});
                break;
            default :
                throw new Error("INVALID environment mode.");
        }
    }
    if(env.mode !== 'production.profile'){
        if(!process.env.APPCS_HOST)
            throw new Error("env.APPCS_HOST not defined.")
        if(!process.env.APPCS_PORT)
            throw new Error("env.APPCS_PORT not defined.")
        if(!process.env.GMS_HOST)
            throw new Error("env.GMS_HOST not defined.")
        if(!process.env.GMS_PORT)
            throw new Error("env.GMS_PORT not defined.")
    }
    console.log(`APPCS_HOST: ${process.env.APPCS_HOST}`, 'APPCS_PORT:',process.env.APPCS_PORT);
    console.log(`GMS_HOST: ${process.env.GMS_HOST}`, 'GMS_PORT:',process.env.GMS_PORT);

  const isProduction = env.mode === 'production.local'|| env.mode === 'production.host' || env.mode === 'production_profile';
  const CSSExtract = new MiniCSSExtractPlugin({filename:'styles.css'});
return {
    node:{
        fs:'empty'
    },
  entry: './src/app.js',// remember to use ./ syntax.
  //details for our output file.
  output : {
    path : path.join(__dirname,'public','dist'), // Absolute PATH! CANT BE RELATIVE. // so we use node's path module for
    // good path concatenation. NOTE THAT THIS IS IMPORTANT: if we use windows, the path separator is
    // \ not / .... wkwkwk
    filename: 'bundle.js' // output file name
  },

    optimization: {
        /*splitChunks:{
            chunks:'all'
        },*/
        minimizer: [
             new UglifyJsPlugin({
                 test: isProduction ? /.*\.js$/ : /(?!.*)/,
             })
        ]
    },

  // install loader: // more in webpack.js.org documentation.
  module: { 
  // webpack has an array of 'rules'. Each 'rule' determines what webpack 
  // should do when bundling.
    rules:[
        {
            test: /\.(jpe?g|png|gif|svg)$/i,
            loaders: [
                'file-loader',
                //'image-webpack-loader'
                //'file-loader?hash=sha512&digest=hex&name=[hash].[ext]',
                //'image-webpack-loader?bypassOnDebug&optimizationLevel=7&interlaced=false'
            ]
        },
      {
        loader: 'babel-loader', // what we use
        test: /\.js$/, // regex for which ones we want to run this rule on. (only on js files)
        // NOTE THAT THE REGEX DOESNT HAVE quOTATION MARKS.
        exclude: /node_modules/ // we don't want to make changes to node modules.
      },
        {
            // new css rule format for webpack 4 and
            // css extract ting.
            test: /\.s?css$/,
            use: [
                MiniCSSExtractPlugin.loader,
                {
                    loader: 'css-loader',
                    options: {
                        sourceMap: true
                    }
                },
                {
                    loader: 'sass-loader',
                    options: {
                        sourceMap: true
                    }
                }
            ]
        }
    ]
  },
    plugins: [
        CSSExtract,
        env.mode==='production_profile' ? new BundleAnalyzerPlugin():
            new webpack.DefinePlugin({
                'process.env.APPCS_HOST':JSON.stringify(env.APPCS_HOST),
                'process.env.APPCS_PORT':JSON.stringify(env.APPCS_PORT),
                'process.env.GMS_HOST':JSON.stringify(env.GMS_HOST),
                'process.env.GMS_PORT':JSON.stringify(env.GMS_PORT),
                'process.env.NODE_ENV': isProduction? JSON.stringify('production'): null
            }),

        // Ignore all locale files of moment.js
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),

        // minify operating on everything?
        /*
        new MinifyPlugin({
            exclude: /node_modules/
        })
        */




    ],
  devtool: isProduction? 'source-map':'inline-source-map',
  // source-map is good for production, but is slow to build.
  devServer: {
    contentBase: path.join(__dirname,'public'),// serve from public directory.
    historyApiFallback:true, // tells the devserver that we're going to
    //handle routing client side, and should always serve index.html..
    // THIS IS IMPORTANT! NOTE: production settings is different.
    // if we use react router, we'll get the actual client side routing
      publicPath:'/dist/'
  }
}
};
