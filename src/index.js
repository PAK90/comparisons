import React from 'react';
import ReactDOM from 'react-dom';
import * as firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import styles from "./styles/customisations.scss";
import Thing from './thing.js';
const ProgressBar = require('react-progressbar.js');
//const Line = require('rc-progress').Line;

// Initialize Firebase
const config = {
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
      item2: 0,
      locked: false // the N second timer to prevent spammy voting.
    };
  },

  generateTwoRandoms: function() {
    if (this.state.numberOfItems != 0) {
      var random1 = Math.floor(Math.random() * this.state.numberOfItems);
      var random2 = Math.floor(Math.random() * this.state.numberOfItems);
      if (random1 === random2) {
        this.generateTwoRandoms();
      }
      else {
        //return [random1, random2];
        this.setState({
          item1: random1,
          item2: random2
        })
      }
    }
    /*else {
      return [0,0];
    }*/
  },

  handleThingClick: function(item) {
    if (this.state.locked) return; // spam prevention!
    this.setState({locked: true});
    console.log(item)
    var otherItem = (item === this.state.item1) ? this.state.item2 : this.state.item1;
    setTimeout(function() {this.setState({locked: false});}.bind(this), 2000);
    // This gets the index of the item that was clicked.
    var clickUpdates = {};
    clickUpdates['items/' + this.state.items[item][".key"] + "/votesFor"] = this.state.items[item]["votesFor"] + 1;
    clickUpdates['items/' + this.state.items[item][".key"] + "/pairs/"+[this.state.items[otherItem][".key"]]] = this.state.items[item]["pairs"][this.state.items[otherItem][".key"]] + 1;
    clickUpdates['items/' + this.state.items[otherItem][".key"] + "/votesAgainst"] = this.state.items[otherItem]["votesAgainst"] + 1;
    var status = firebase.database().ref().update(clickUpdates); // should really check this status.
    // Generate a new pair.
    this.generateTwoRandoms();
  },

  componentWillMount: function() {
    // Get the base 'items' database reference.
    var countRef = firebase.database().ref().child('itemCount');
    var itemRef = firebase.database().ref().child('items');
    //var waffleRef = countRef.child('Waffle/category');
    // When anything in it changes, update the number of items.
    // TODO: change this to on children changing.
    countRef.on('value', snap => {
      this.setState({
        numberOfItems: snap.val()
      }, this.generateTwoRandoms); // generateTwoRandoms is called as the callback to the setState, so it doesn't do it with null data.
    });

    // Don't want to have to go through an object, so bind the items as an array. This also updates automatically (I think)
    this.bindAsArray(itemRef, "items");
  },

  render: function() {
    //var indices = this.generateTwoRandoms();
    // Here we access the item's "pairs" array, indexed on the key of the other item. (e.g. the Waffle pair entry of the Pancake item.)
    /*if (this.state.items[this.state.numberOfItems-1]) {
	    if (!this.state.items[this.state.item2]["pairs"] || !this.state.items[this.state.item2]["pairs"][this.state.item1]) {
	    	console.log("no pairs!");
	    	firebase.database().ref('items/' + this.state.items[this.state.item2] + '/pairs').set({
	    		"0": 0
	    	})
	    }
	}*/
    var rightVotes = this.state.items[this.state.numberOfItems-1] ? this.state.items[this.state.item2]["pairs"][this.state.item1] : 0;
    var leftVotes = this.state.items[this.state.numberOfItems-1] ? this.state.items[this.state.item1]["pairs"][this.state.item2] : 0;
    var votePercent = (rightVotes !== 0 && leftVotes !== 0) ? leftVotes / (rightVotes + leftVotes) * 100 : 100;
    console.log(votePercent);
    var Line = ProgressBar.Line;
    return (
      <div className="body">
        <div className="header">
          <h3>WhatIsCooler.com</h3>
        </div>
        <div className="content">
          <h1>Choose which is cooler!</h1>
          <p>Remember, there is no right answer.</p>
          <div className="thingHolder">
            <div onClick={() => this.handleThingClick(this.state.item1)}><Thing thing={this.state.items[this.state.item1]} colour={styles.leftColour}  /></div>
            <div onClick={() => this.handleThingClick(this.state.item2)}><Thing thing={this.state.items[this.state.item2]} colour={styles.rightColour}  /></div>
          </div>
          <div className="progressContainer">
            <Line progress={votePercent / 100} initialAnimate={true}
              options={{strokeWidth: 5, trailWidth: 5, color: styles.leftColour, trailColor: styles.rightColour, duration: 350, easing: 'easeInOut'}}
              />
          </div>
          <p>This matchup: left has {leftVotes} votes and right has {rightVotes}</p>
          <button className="randomButton" onClick={() => this.generateTwoRandoms()}>Random pair!</button>
        </div>
      </div>
    );
  }
})

ReactDOM.render(<App/>, document.querySelector("#myApp"));
