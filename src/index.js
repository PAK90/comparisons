import React from 'react';
import ReactDOM from 'react-dom';
import * as firebase from 'firebase';
//require("firebase/auth");
//require("firebase/database");
import ReactFireMixin from 'reactfire';
require("./styles/customisations.scss");
import Thing from './thing.js';

// Initialize Firebase
var config = {
apiKey: "AIzaSyDJ30_ONRYF61qsRl8l6BLDLTOh6gJV3u8",
authDomain: "whatiscooler-69221.firebaseapp.com",
databaseURL: "https://whatiscooler-69221.firebaseio.com",
storageBucket: "whatiscooler-69221.appspot.com",
};
firebase.initializeApp(config);

var App = React.createClass({
	mixins: [ReactFireMixin],

	getInitialState: function() {
	    return {
	      	items: [],
	      	numberOfItems: 0,
	      	item1: 0,
	      	item2: 0
	    };
	},

	generateTwoRandoms: function() {
		if (this.state.numberOfItems != 0) {
			var random1 = Math.floor(Math.random()*this.state.numberOfItems);
			var random2 = Math.floor(Math.random()*this.state.numberOfItems);
			if (random1 == random2) {
				return this.generateTwoRandoms();
			}
			else {
				return [random1, random2];
			}
		}
		else {
			return [0,0];
		}
	},

	componentWillMount: function() {
		// Get the base 'items' database reference.
		var fireRef = firebase.database().ref().child('items');
		//var waffleRef = fireRef.child('Waffle/category');
		// When anything in it changes, update the number of items.
		// TODO: change this to on children changing.
		fireRef.on('value', snap => {
			this.setState({
				numberOfItems: snap.numChildren()
			});
		});
		// Don't want to have to go through an object, so bind the items as an array. This also updates automatically (I think)
		this.bindAsArray(fireRef, "items");
	},

	render: function() {
		var indices = this.generateTwoRandoms();
		return (
			<div className="body">
				<div className="header">
					<h3>WhatIsCooler.com</h3>
				</div>
				<div className="content">
					<h1>Subtitle</h1>
					<p>This is a simple hero unit, a jumbotron-style component for calling extra attention to featured content or information.</p>
					<div className="thingHolder">
						<Thing thing={this.state.items[indices[0]]}/>
						<Thing thing={this.state.items[indices[1]]}/>
					</div>
					<p>This matchup: right has {this.state.items[0] ? this.state.items[indices[1]]["pairs"][this.state.items[indices[0]][".key"]] : "0"} votes</p>
				</div>					
			</div>
		);
	}
})

ReactDOM.render(<App/>, document.querySelector("#myApp"));
