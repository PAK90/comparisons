import React from 'react';
import axios from 'axios';
require("./styles/customisations.scss");

var Thing = React.createClass({
	getInitialState: function() {
      return {
				gif: null
      };
  },

	componentWillReceiveProps: function(nextProps) {
		// first if required to not blank on .key key.
		if (this.props.thing && (this.props.thing[".key"] !== nextProps.thing[".key"])) {
			this.setState({gif: null});
			axios.get('https://api.giphy.com/v1/gifs/search?q=' + nextProps.thing.name + '&api_key=dc6zaTOxFJmzC&limit=25')
				.then(function(response) {
					console.log(response);
					this.setState({gif: response.data.data[Math.floor(Math.random() * 25)].images.fixed_height.url})
				}.bind(this))
			}
	},

	render: function() {
		var overallPercent = "0%";
		if (this.props.thing) {
			// If the votes against are 0/falsey, it's 100% in favour.
			overallPercent = (this.props.thing["votesAgainst"]) ? ((this.props.thing["votesFor"] * 100) / (this.props.thing["votesFor"] + this.props.thing["votesAgainst"])).toFixed(2) + "%"
				: "100%";

			// ...except if there's also 0 votes in favour.
			if ((!this.props.thing["votesFor"] && !this.props.thing["votesAgainst"]) || (!this.props.thing["votesFor"])) {
				overallPercent = '0%';
			}
		}
		var borderStyle = {border: '3px solid ' + this.props.colour}
		return (
			<div style={borderStyle} className="thingContainer">
				<h2>{this.props.thing ? this.props.thing["name"] : "Loading..!"}</h2>
				<img src={this.state.gif} style={{maxHeight: '200px', maxWidth: '400px'}}/>
				<p>{"Win rate: " + overallPercent}</p>
			</div>
		);
	}
})

export default Thing;
