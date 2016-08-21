import React from 'react';
import ReactDOM from 'react-dom';
require("./styles/customisations.scss");

var Thing = React.createClass({
	getInitialState: function() {
        return {
        };
    },

	render: function() {
		return (
			<div className="thingContainer">
				<h2>{this.props.thing ? this.props.thing[".key"] : "Loading..."}</h2>
				<p>{this.props.thing ? ((this.props.thing["votesFor"]*100)/(this.props.thing["votesFor"] + this.props.thing["votesAgainst"])).toFixed(2) + "% overall" : "0%"}</p>
			</div>
		);
	}
})

export default Thing;