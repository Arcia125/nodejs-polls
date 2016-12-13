'use strict';

const React = require('react');
const { Route } = require('react-router');

const MainApp = require('./components/MainComponent.jsx');
const Polls = require('./components/Polls.jsx');

module.exports = <Route component={MainApp}>
	<Route path='/' component={Polls}/>
	</Route>