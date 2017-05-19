import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
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
      items: {},
      numberOfItems: 0,
      item1: 0,
      item2: 0,
      keepWinner: false,
      locked: false, // false, 1 or 2. denotes which item won't change when generating new pair.
      paused: false // the N second timer to prevent spammy voting.
    };
  },

  placeNewItem: function(isLeft, itemIndex) {
    if (itemIndex !== this.state.item1 && itemIndex !== this.state.item2) { // don't want duplicate items as pairs.
      isLeft ? this.setState({item1: itemIndex}, this.changeUrl(itemIndex, this.state.item2)) : this.setState({item2: itemIndex}, this.changeUrl(this.state.item1, itemIndex));
      // now focus on the other search box, which we know due to isLeft.
      document.getElementById(isLeft ? "search2" : "search1").focus();
    }
  },

  changeUrl: function(item1, item2) {
    var pair = [item1, item2].sort();
    var hash = sha1(pair[0].toString() + ',' + pair[1].toString()); // TODO: sort in increasing order so they're the same.
    hash = base.to36(hash.slice(0, 9))
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

  generateTwoRandoms: function(winner) {
    if (this.state.numberOfItems !== 0 && !_.isEmpty(this.state.items)) {
      var random1 = (this.state.locked === 1 || winner === this.state.item1) ? this.state.item1
        : Object.keys(this.state.items)[Math.floor(Math.random() * this.state.numberOfItems)];
      var random2 = (this.state.locked === 2 || winner === this.state.item2) ? this.state.item2
        : Object.keys(this.state.items)[Math.floor(Math.random() * this.state.numberOfItems)];
      var perc = Math.random();
      console.log(perc);
      if (random1 === random2 || random1 === ".key" || random2 === ".key") { // goddamn object .key prop.
        this.generateTwoRandoms(winner);
      }
      // with 95% chance, generate new pair if current pair has no mutual votes.
      else if (perc < 0.75 && (
        (this.state.items[random1].pairs === undefined || this.state.items[random1].pairs[random2] === undefined) &&
        (this.state.items[random2].pairs === undefined || this.state.items[random2].pairs[random1] === undefined) ) )
      {
        this.generateTwoRandoms(winner);
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

    var itemRef = firebase.database().ref().child('items/' + item);
    var otherItemRef = firebase.database().ref().child('items/' + otherItem);
    itemRef.transaction(function(fbitem) {
      if (fbitem) {
        if (fbitem.pairs && fbitem.pairs[otherItem]) {
          fbitem.pairs[otherItem]++;
        }
        else if (fbitem.pairs) {
          fbitem.pairs[otherItem] = 1;
        }
        else {
          fbitem.pairs = {};
          fbitem.pairs[otherItem] = 1;
        }
        if (fbitem.votesFor) {
          fbitem.votesFor++;
        }
        else {
          fbitem.votesFor = 1;
        }
      }
      return fbitem;
    })
    otherItemRef.transaction(function(fbotherItem) {
      if (fbotherItem) {
        if (fbotherItem.votesAgainst) {
          fbotherItem.votesAgainst++;
        }
        else {
          fbotherItem.votesAgainst = 1;
        }
      }
      return fbotherItem;
    })
    // Generate a new pair.
    this.state.keepWinner ? this.generateTwoRandoms(item) : this.generateTwoRandoms();
  },

  setItemsFromUrl: function(countRef) {
    // Get the current URL.
    countRef.off();
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
      }, location.search ? this.setItemsFromUrl(countRef) : null);
    });
    itemRef.on('value', snap => {
      this.setState({
        items: snap.val()
      }, this.generateTwoRandoms); // generateTwoRandoms is called as the callback to the setState, so it doesn't do it with null data.
    }); // no idea why this used to work with blank url and the itemCount callback, but it doesn't anymore.
    itemRef.off();
    //countRef.off(); // disable listeners otherwise we get way too many setItemsFromUrl or generateTwoRandoms calls as FB updates data.

    // Don't want to have to go through an object, so bind the items as an array. This also updates automatically (I think)
    this.bindAsObject(itemRef, "items");
  },

  addItem: function(item, isLeft) {
    if (!item) return;
    // increment the item count, and add the item. simple!
    // as a backup, check for item name in existing items.
    if (_.filter(this.state.items, ['name', item]).length) return;
    var countRef = firebase.database().ref().child('itemCount');
    countRef.transaction(function(count) {
      if (count) {
        count++;
      }
      return count;
    }).then((snap) => {console.log(snap); });

    var itemRef = firebase.database().ref().child('items').push({"name": item}).then((snap) => {
      console.log(snap.key);
      this.setState(isLeft ? {"item1": snap.key} : {"item2": snap.key});
    });
  },

  render: function() {
    var rightVotes = (this.state.items[this.state.item1] && this.state.items[this.state.item2]["pairs"]) ? this.state.items[this.state.item2]["pairs"][this.state.item1] : 0;
    var leftVotes = (this.state.items[this.state.item2] && this.state.items[this.state.item1]["pairs"]) ? this.state.items[this.state.item1]["pairs"][this.state.item2] : 0;
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
          <div className="searchHolder">
            <Searchbox items={this.state.items} left={true} selected={this.placeNewItem} addItem={this.addItem} />
            <Searchbox items={this.state.items} left={false} selected={this.placeNewItem} addItem={this.addItem} />
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
            <input type="checkbox"
              onChange={() => this.setState({keepWinner: !this.state.keepWinner})}
              checked={this.state.keepWinner} /><label onClick={() => this.setState({keepWinner: !this.state.keepWinner})}>Keep winner</label>
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
