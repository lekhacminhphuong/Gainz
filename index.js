import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './style.css';
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import {BrowserRouter} from 'react-router-dom';

// Initialize Firebase
var config = {
	apiKey: "AIzaSyAlwW8LrQI9FZxQGcblLMASm4I4nkU_PZk",
	authDomain: "gainz-info340.firebaseapp.com",
	databaseURL: "https://gainz-info340.firebaseio.com",
	projectId: "gainz-info340",
	storageBucket: "gainz-info340.appspot.com",
	messagingSenderId: "891803478332"
};
firebase.initializeApp(config);
ReactDOM.render(<BrowserRouter><App /></BrowserRouter>, document.getElementById('root'));


