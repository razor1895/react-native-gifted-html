import React, { Component, PropTypes } from 'react';
import { Linking, View, ViewPropTypes } from 'react-native';
import htmlRender from './htmlRender';

export default class HTMLView extends Component {
  constructor(props) {
    super(props);
    this.state = {
      element: props.value,
    };
  }

  componentDidMount() {
    this.startHtmlRender(this.props.value);
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.value !== nextProps.value) {
      this.startHtmlRender(nextProps.value);
    }
  }

  startHtmlRender(value) {
    if (!value) {
      this.setState({ element: null });
    }

    const opts = {
      linkHandler: this.props.onLinkPress,
      styles: this.props.styles,
      customRenderer: this.props.renderNode,
      allowNodeStyleAttrib: this.props.allowNodeStyleAttrib
    };

    htmlRender(value, opts, (err, element) => {
      if (err) {
        return this.props.onError(err);
      }

      this.setState({ element });
    });
  }

  render() {
    if (this.state.element) {
      return (
        <View style={[{ flex: 1 }, this.props.style]}>
          {this.state.element}
        </View>
      );
    }

    return <View style={[{ flex: 1 }, this.props.style]} />;
  }
}

HTMLView.propTypes = {
  addLineBreaks: PropTypes.bool,
  allowNodeStyleAttrib: PropTypes.bool,
  value: PropTypes.string.isRequired,
  styles: PropTypes.object,
  style: ViewPropTypes.style,
  onLinkPress: PropTypes.func,
  onError: PropTypes.func,
  renderNode: PropTypes.func,
};

HTMLView.defaultProps = {
  addLineBreaks: true,
  allowNodeStyleAttrib: true,
  onLinkPress: url => Linking.openURL(url),
  onError: console.error.bind(console),
};
