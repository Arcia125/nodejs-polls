"use strict";
const React = require('react');

class MainComponent extends React.Component {
	componentDidMount() {
		let component = this;
		try {
			fetch('/api/polls', { method: 'GET' }).then((res) => {
				return res.json();
			}).then((json) => {
				console.log(json);
				component.setState({
					polls: json
				});
			});
		}
		catch(err) {
			console.log(`Error in fetching ${err}`);
		}
	}
    render() {
        return (
            <div className='app'>
	            <a href='/auth/twitter'>Sign in with Twitter</a>
				<a href='/polls'>polls</a>
				world
				{this.state ? JSON.stringify(this.state.polls) : 'no polls found'}
	            {this.props.children}
            </div>
            );
    }
}

module.exports = MainComponent;