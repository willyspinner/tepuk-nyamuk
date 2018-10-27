import React from 'react';
import ReactDOM from 'react-dom';
import AppRouter from './routes/AppRouter';
import './styles/styles.scss'; // import styles.css to our whole oldApp
import 'normalize.css/normalize.css'; // every import not starting with
import "animate.css/animate.min.css"
import {Provider} from 'react-redux';
import configureStore from './store/configureStore';
'use-strict';
const store = configureStore();
import 'antd/dist/antd.css';

const app = (
<Provider store = {store}>   
  <AppRouter/>

</Provider>
);
ReactDOM.render(app,document.getElementById('app'));
