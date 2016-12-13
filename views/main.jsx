"use strict";

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, BrowserHistory, match } from 'react-router';

import routes from './../routes.jsx';


// ReactDOM.render(<Router history={BrowserHistory} >
// 					{routes}
// 				</Router>,
// 	);

match({ routes, location: window.location.pathname }, (error, redirectLocation, renderProps) => {
  ReactDOM.render(<Router {...renderProps} />, document.getElementsByClassName('react-anchor')[0])
})

