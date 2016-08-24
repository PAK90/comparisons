import React from 'react';
import ReactDOM from 'react-dom';
require("./styles/customisations.scss");

var Thing = React.createClass({
	getInitialState: function() {
        return {
        };
    },

	render: function() {
		var overallPercent = "0%";
		if (this.props.thing) {
			// If the votes against are 0, it's 100% in favour.
			overallPercent = (this.props.thing["votesAgainst"] != 0) ? ((this.props.thing["votesFor"]*100)/(this.props.thing["votesFor"] + this.props.thing["votesAgainst"])).toFixed(2) + "%": "100%";

			// ...except if there's also 0 votes in favour.
			if (this.props.thing["votesFor"] == 0 && this.props.thing["votesAgainst"] == 0) {
				overallPercent = '0%';
			}			
		}
		return (
			<div className="thingContainer">
				<h2>{this.props.thing ? this.props.thing["name"] : "Loading..."}</h2>
				<p>{overallPercent}</p>
			</div>
		);
	}
})

export default Thing;