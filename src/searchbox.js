import React from 'react';
import _ from 'lodash'
import styles from "./styles/customisations.scss";
require("./styles/searchbox.scss");
import Autosuggest from 'react-autosuggest';

const getSuggestionValue = suggestion => suggestion.name;

var Searchbox = React.createClass({
  getInitialState: function() {
    return {
      value: '',
      suggestions: []
    };
  },

  getSuggestions: function(value) {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : Object.values(this.props.items).slice(0, -1).filter(item =>
      item.name.toLowerCase().slice(0, inputLength) === inputValue
    );
  },

  renderSuggestion: function(suggestion) {
    // on click, it returns the key of the object it finds with the name prop of the suggestion. Icky, but better than nothing.
    return (
      <div>
        <span style={{float: 'left',  border: '3px solid' + styles.leftColour}}
          onClick={function() {this.props.selected(true, _.findKey(this.props.items, ['name', this.state.suggestions[0].name])); }.bind(this)}>Add</span>
        <span>
          {suggestion.name}
        </span>
        <span style={{float: 'right', border: '3px solid' + styles.rightColour}}
          onClick={function() {this.props.selected(false, _.findKey(this.props.items, ['name', this.state.suggestions[0].name])); }.bind(this)}>Add</span>
      </div>
    )
  },

  onChange: function(event, { newValue })  {
    this.setState({
      value: newValue
    });
  },

  onSuggestionsFetchRequested: function({ value }) {
    this.setState({
      suggestions: this.getSuggestions(value)
    });
  },

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested: function() {
    this.setState({
      suggestions: []
    });
  },

  renderInputComponent: function(inputProps) {
    return (
      <div className="inputContainer">
        <img className="icon" src="http://www.freeiconspng.com/uploads/add-list-icon--icon-search-engine-26.png"
          style={{width: (!_.find(this.state.suggestions, ['name', this.state.value]) && this.state.value !== "") ? "25px" : "0px", cursor: "pointer"}}
          title="Add this item to the database!" onClick={() => this.props.addItem(this.state.value)}/>
        <input {...inputProps}/>
      </div>
    )
  },

  render() {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input element.
    const inputProps = {
      placeholder: 'Type a thing to add or find.',
      value,
      onChange: this.onChange
    };

    // Finally, render it!
    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={this.renderSuggestion}
        inputProps={inputProps}
        renderInputComponent={this.renderInputComponent}
      />
    );
  }

})

export default Searchbox;
