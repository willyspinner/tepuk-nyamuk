const path = require('path');
const webpack = require('webpack');
const MiniCSSExtractPlugin = require('mini-css-extract-plugin');
/*
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

if (process.env.NODE_ENV ==='test' ){
    require('dotenv').config({path: '.env.test'});
    
    console.log(`node env is test.`);
    // this will be read
}else if (process.env.NODE_ENV === 'development'){

    require('dotenv').config({path: '.env.development'})
    console.log(`node env is development..`);
}
*/
module.exports = (env) => {
  console.log('environment variables :',JSON.stringify(env));
   if(!env)
       throw new Error("env not defined.")
    if(!env.APPCS_HOST)
        throw new Error("env.APPCS_HOST not defined.")
    if(!env.APPCS_PORT)
        throw new Error("env.APPCS_PORT not defined.")
  const isProduction = env === 'production';
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
        /*new webpack.DefinePlugin({ // this will be bundled into clientside by webpack.
            // we use JSON.stringify since we want to make the env variables a string.
            'process.env.FIREBASE_API_KEY': JSON.stringify(process.env.FIREBASE_API_KEY),
            'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.FIREBASE_AUTH_DOMAIN),
            'process.env.FIREBASE_DATABASE_URL': JSON.stringify(process.env.FIREBASE_DATABASE_URL),
            'process.env.FIREBASE_PROJECT_ID': JSON.stringify(process.env.FIREBASE_PROJECT_ID),
            'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.FIREBASE_STORAGE_BUCKET),
            'process.env.FIREBASE_MESSAGING_SENDER_ID':JSON.stringify(process.env.FIREBASE_MESSAGING_SENDER_ID)
        })*/


        // For appcs.
        new webpack.DefinePlugin({
            'process.env.APPCS_HOST':JSON.stringify(env.APPCS_HOST),
            'process.env.APPCS_PORT':JSON.stringify(env.APPCS_PORT),
        })
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
