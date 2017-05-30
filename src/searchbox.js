'use strict';
import React from 'react';
import _ from 'lodash';
require("./styles/searchbox.scss");
import Autosuggest from 'react-autosuggest';
const PropTypes = require('prop-types');

const getSuggestionValue = suggestion => suggestion.name;

const renderSuggestion = (suggestion) => (
    <div>
      <span>
        {suggestion.name}
      </span>
    </div>
)

class Searchbox extends React.Component{
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      suggestions: []
    };
  }

  getSuggestions = (value) => {
    const inputValue = value.trim().toLowerCase();
    const inputLength = inputValue.length;

    return inputLength === 0 ? [] : _.values(this.props.items).filter(item =>
      item.name.toLowerCase().slice(0, inputLength) === inputValue
    );
  }

  onChange = (event, { newValue }) => {
   this.setState({
     value: newValue
   });
 };

  onSuggestionsFetchRequested = ({ value }) => {
    this.setState({
      suggestions: this.getSuggestions(value)
    });
  }

  // Autosuggest will call this function every time you need to clear suggestions.
  onSuggestionsClearRequested = () => {
    this.setState({
      suggestions: []
    });
  }

  onSuggestionSelected = (event, suggestion) => {
    console.log(suggestion);
    // find the key of the object with the selected suggestion's name.
    this.props.selected(this.props.left ? true : false, _.findKey(this.props.items, ['name', suggestion.suggestionValue]));
  }

  renderInputComponent = (inputProps) => {
    return (
      <div className="inputContainer">
        <img className="icon" src="http://www.freeiconspng.com/uploads/add-list-icon--icon-search-engine-26.png"
          style={{width: (!_.find(this.state.suggestions, ['name', this.state.value]) && _.trim(this.state.value).length !== 0) ? "25px" : "0px", cursor: "pointer"}}
          title="Add this item to the database!" onClick={() => this.props.addItem(_.trim(this.state.value), this.props.left)}/>
        <input maxLength={30} id={this.props.left ? "search1" : "search2"} {...inputProps}/>
      </div>
    )
  }

  render() {
    const { value, suggestions } = this.state;

    // Autosuggest will pass through all these props to the input element.
    const inputProps = {
      placeholder: 'Type a thing to add or find.',
      value,
      onChange: this.onChange.bind(this)
    };

    // Finally, render it!
    return (
      <Autosuggest
        suggestions={suggestions}
        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
        getSuggestionValue={getSuggestionValue}
        renderSuggestion={renderSuggestion}
        inputProps={inputProps}
        onSuggestionSelected={this.onSuggestionSelected}
        renderInputComponent={this.renderInputComponent}
      />
    );
  }
}

Searchbox.propTypes = {
  left: PropTypes.bool.isRequired,
  selected: PropTypes.func.isRequired,
  addItem: PropTypes.func.isRequired,
  items: PropTypes.object.isRequired
}

export default Searchbox;
