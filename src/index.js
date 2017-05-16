import React from 'react';
import ReactDOM from 'react-dom';
import * as firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import styles from "./styles/customisations.scss";
import Thing from './thing.js';
import Searchbox from './searchbox.js';
const ProgressBar = require('react-progressbar.js');
import sha1 from 'sha1';
const base = require('1636');
const queryString = require('query-string');
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
      locked: false, // false, 1 or 2. denotes which item won't change when generating new pair.
      paused: false // the N second timer to prevent spammy voting.
    };
  },

  placeNewItem: function(isLeft, itemIndex) {
    if (itemIndex !== this.state.item1 && itemIndex !== this.state.item2) { // don't want duplicate items as pairs.
      isLeft ? this.setState({item1: itemIndex}, this.changeUrl(itemIndex, this.state.item2)) : this.setState({item2: itemIndex}, this.changeUrl(this.state.item1, itemIndex));
    }
  },

  changeUrl: function(item1, item2) {
    var pair = [item1, item2].sort();
    var hash = sha1(pair[0].toString() + ',' + pair[1].toString()); // TODO: sort in increasing order so they're the same.
    hash = base.to36(hash.slice(0, 7))
    // now update the url silently, without reloading the page.
    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?p=' + hash;
    window.history.pushState({path: newurl}, '', newurl);
    console.log(hash);
    // also update firebase with the new pair.
    var pairUpdates = {};
    pairUpdates['pairs/' + hash + '/' + item1] = true;
    pairUpdates['pairs/' + hash + '/' + item2] = true;
    var status = firebase.database().ref().update(pairUpdates); // should really check this status.
  },

  generateTwoRandoms: function() {
    if (this.state.numberOfItems !== 0) {
      var random1 = this.state.locked === 1 ? this.state.item1 : Math.floor(Math.random() * this.state.numberOfItems);
      var random2 = this.state.locked === 2 ? this.state.item2 : Math.floor(Math.random() * this.state.numberOfItems);
      if (random1 === random2) {
        this.generateTwoRandoms();
      }
      else {
        this.changeUrl(random1, random2);
        this.setState({
          item1: random1,
          item2: random2
        });
      }
    }
  },

  handleThingClick: function(item) {
    if (this.state.paused) return; // spam prevention!
    this.setState({paused: true}); // if we got in, prevent clicking.
    console.log(item)
    var otherItem = (item === this.state.item1) ? this.state.item2 : this.state.item1;
    setTimeout(function() {this.setState({paused: false});}.bind(this), 2000); // after 2 seconds, allow clicking.
    // This gets the index of the item that was clicked.
    var clickUpdates = {};
    clickUpdates['items/' + this.state.items[item][".key"] + "/votesFor"] = this.state.items[item]["votesFor"] ? this.state.items[item]["votesFor"] + 1 : 1;
    // to deal with new items: IF pairs AND pairs.key exist, write value else write 1.
    clickUpdates['items/' + this.state.items[item][".key"] + "/pairs/" + [this.state.items[otherItem][".key"]]] = (this.state.items[item]["pairs"] && this.state.items[item]["pairs"][this.state.items[otherItem][".key"]]) ? this.state.items[item]["pairs"][this.state.items[otherItem][".key"]] + 1 : 1;
    clickUpdates['items/' + this.state.items[otherItem][".key"] + "/votesAgainst"] = this.state.items[otherItem]["votesAgainst"] ? this.state.items[otherItem]["votesAgainst"] + 1 : 1;
    var status = firebase.database().ref().update(clickUpdates); // should really check this status.
    // Generate a new pair.
    this.generateTwoRandoms();
  },

  setItemsFromUrl: function() {
    // Get the current URL.
    console.log(location.search);
    if (location.search) { // if we already have a url.
      const parsedHash = queryString.parse(location.search);
      this.setState({pair: parsedHash.p});
      firebase.database().ref().child("pairs/" + parsedHash.p).on('value', snap => {
          console.log(snap.val());
          if (snap.val()) { // wrong hashes will result in null.
            this.setState({
              item1: Object.keys(snap.val())[0],
              item2: Object.keys(snap.val())[1]
            });
          }
          else this.generateTwoRandoms();
      })
    }
  },

  componentWillMount: function() {
    // Get the base 'items' database reference.
    var countRef = firebase.database().ref().child('itemCount');
    var itemRef = firebase.database().ref().child('items');
    // When anything in it changes, update the number of items.
    // TODO: change this to on children changing.
    countRef.on('value', snap => {
      this.setState({
        numberOfItems: snap.val()
      }, location.search ? this.setItemsFromUrl : this.generateTwoRandoms); // generateTwoRandoms is called as the callback to the setState, so it doesn't do it with null data.
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
    var rightVotes = (this.state.items[this.state.numberOfItems - 1] && this.state.items[this.state.item2]["pairs"]) ? this.state.items[this.state.item2]["pairs"][this.state.item1] : 0;
    var leftVotes = (this.state.items[this.state.numberOfItems - 1] && this.state.items[this.state.item1]["pairs"]) ? this.state.items[this.state.item1]["pairs"][this.state.item2] : 0;
    var votePercent = (rightVotes && leftVotes) ? leftVotes / (rightVotes + leftVotes) * 100 : leftVotes ? 100 : 0;
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
          <div>
            <Searchbox items={this.state.items} selected={this.placeNewItem} />
          </div>
          <div className="thingHolder">
            <div onClick={() => this.handleThingClick(this.state.item1)}>
              <Thing thing={this.state.items[this.state.item1]} colour={styles.leftColour}  />
            </div>
            <div onClick={() => this.handleThingClick(this.state.item2)}>
              <Thing thing={this.state.items[this.state.item2]} colour={styles.rightColour}  />
            </div>
          </div>
          <div className="progressContainer">
            <Line progress={votePercent / 100} initialAnimate={true}
              options={{strokeWidth: 5, trailWidth: 5, color: styles.leftColour, trailColor: styles.rightColour, duration: 350, easing: 'easeInOut'}}
              />
          </div>
          <div className="lockContainer">
            <button className="lockButton" onClick={() =>
              !this.state.locked ? this.setState({locked: 1}) : this.state.locked === 1 ? this.setState({locked: false}) : this.setState({locked: 1})}>
              {this.state.locked === 1 ? "Unlock 1" : "Lock 1"}</button>
            <button className="lockButton" onClick={() =>
              !this.state.locked ? this.setState({locked: 2}) : this.state.locked === 2 ? this.setState({locked: false}) : this.setState({locked: 2})}>
              {this.state.locked === 2 ? "Unlock 2" : "Lock 2"}</button>
          </div>
          <p>This matchup: left has {leftVotes ? leftVotes : 0} votes and right has {rightVotes ? rightVotes : 0}</p>
          <button className="randomButton" onClick={() => this.generateTwoRandoms()}>Random pair!</button>
        </div>
      </div>
    );
  }
})

ReactDOM.render(<App/>, document.querySelector("#myApp"));
