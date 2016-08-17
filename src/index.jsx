//require("../node_modules/bootstrap/dist/css/bootstrap.min.css");
import React from 'react';
import ReactDOM from 'react-dom';
require("./styles/customisations.scss");

export class App extends React.Component {
	render() {
		return (
				<div className="body">

					<div className="header">
						<h3>WhatIsCooler.com</h3>
					</div>
					<div>
						<h1>Jumbotron</h1>
						<p>This is a simple hero unit, a jumbotron-style component for calling extra attention to featured content or information.</p>
						<p><a className="btn btn-primary btn-lg">Learn more</a></p>
					</div>					
				</div>
		);
	}
}

ReactDOM.render(<App/>, document.querySelector("#myApp"));
