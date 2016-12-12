"use strict";

import React from 'react';
import ReactDOM from 'react-dom';

import MainComponent from '../MainComponent.jsx';

ReactDOM.render(<MainComponent/>, document.getElementsByClassName('react-anchor')[0]);

console.log('client side'); 