import React from 'react';
import {
  Text,
} from 'react-native';
import entities from 'entities';
import transform from 'css-to-react-native';

import AutoSizedImage from './AutoSizedImage';
import htmlParser from './htmlParser';

const BULLET = '\u2022 ';
const LINE_BREAK = '\n';

const TITLE_MARGIN = 16;
const FONT_SIZE = 16;

const DEFAULT_STYLES = {
  a: {
    fontWeight: '500',
    color: '#007AFF',
  },
  b: {
    fontWeight: 'bold'
  },
  blockquote: {
    paddingLeft: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#cccccc',
    marginBottom: 12
  },
  em: {
    fontStyle: 'italic'
  },
  h1: {
    fontWeight: 'bold',
    fontSize: 36,
    marginVertical: TITLE_MARGIN,
  },
  h2: {
    fontWeight: 'bold',
    fontSize: 30,
    marginVertical: TITLE_MARGIN - 2,
  },
  h3: {
    fontWeight: 'bold',
    fontSize: 24,
    marginVertical: TITLE_MARGIN - 4,
  },
  h4: {
    fontWeight: 'bold',
    fontSize: 18,
    marginVertical: TITLE_MARGIN - 6,
  },
  h5: {
    fontWeight: 'bold',
    fontSize: 14,
    marginVertical: TITLE_MARGIN - 8,
  },
  h6: {
    fontWeight: 'bold',
    fontSize: 12,
    marginVertical: TITLE_MARGIN - 10,
  },
  i: {
    fontStyle: 'italic'
  },
  p: {
    fontSize: FONT_SIZE,
    paddingTop: 5,
    paddingBottom: 5,
    color: 'rgba(0,0,0,0.8)'
  },
  strong: {
    fontWeight: 'bold'
  }
};

const styleForNode = (node, styles, allowNodeStyleAttrib) => {
  if (styles) {
    let style = DEFAULT_STYLES[node.name] || {};
    const provideStyle = styles[node.name] || {};

    style = { ...style, ...provideStyle };

    if (node.attribs && node.attribs.class) {
      const nodeClass = node.attribs.class.split(' ');
      nodeClass.forEach((v) => {
        style = { ...style, ...styles[v] };
      });
    }

    if (node.attribs && node.attribs.style && allowNodeStyleAttrib) {
      const nodeStyle = transform(node.attribs.style.split(';').map(v => v.split(':')));
      style = { ...style, ...nodeStyle };
    }

    return style;
  }

  if (node.attribs && node.attribs.style && allowNodeStyleAttrib) {
    const nodeStyle = transform(node.attribs.style.split(';').filter(v => !!v).map(v => v.split(':').filter(x => !!x)));

    return { ...DEFAULT_STYLES[node.name], ...nodeStyle };
  }

  return DEFAULT_STYLES[node.name];
};

const Img = (props) => {
  const width = Number(props.attribs.width) || Number(props.attribs['data-width']) || 0;
  const height = Number(props.attribs.height) || Number(props.attribs['data-height']) || 0;
  let styles = {};

  if (props.styles) {
    styles = props.styles;
    styles.img = { ...style.img, width, height };
  } else {
    styles.img = { width, height };
  }

  const source = {
    uri: props.attribs['data-original-src'] || props.attribs.src,
    width,
    height,
  };

  return (
    <AutoSizedImage
      source={source}
      style={styleForNode({ attribs: props.attribs, name: 'img' }, styles, props.allowNodeStyle)}
    />
  );
};

export default function htmlRender(rawHtml, opts, done) {
  const styles = opts.styles;
  const allowNodeStyle = opts.allowNodeStyleAttrib;

  function domToElement(dom, parent, type) {
    if (!dom) return null;

    return dom.map((node, index, list) => {
      if (opts.customRenderer) {
        const rendered = opts.customRenderer(node, index, parent, type);
        if (rendered || rendered === null) return rendered;
      }

      const name = node.name;

      if (name === 'img') {
        return (
          <Img key={index} attribs={node.attribs} styles={styles} allowNodeStyle={allowNodeStyle} />
        );
      }

      if (name === 'text' && type === 'inline') {
        // ignore carriage return
        if (node.text.charCodeAt() === 13) return;
        return entities.decodeHTML(node.text);
      }

      if (node.type === 'inline') {
        if (name === 'a') {
          const uri = node.attribs.href;
          let linkPressHandler = null;

          if (uri) {
            linkPressHandler = () => opts.linkHandler(entities.decodeHTML(node.attribs.href));
          }

          return (
            <Text
              onPress={linkPressHandler}
              key={index}
              style={styleForNode(node, styles, allowNodeStyle)}
            >
              {domToElement(node.children, node, 'inline')}
            </Text>
          );
        }

        return (
          <Text key={index} style={styleForNode(node, styles, allowNodeStyle)}>
            {domToElement(node.children, node, 'inline') }
            {node.name === 'br' ? LINE_BREAK : null}
          </Text>
        );
      }

      if (node.type === 'block') {
        let listItemPrefix = null;
        if (node.name === 'li') {
          if (node.parent.name === 'ol') {
            listItemPrefix = `${index + 1}. `;
          } else if (node.parent.name === 'ul') {
            listItemPrefix = BULLET;
          }
        }

        return (
          <Text key={index} style={styleForNode(node, styles, allowNodeStyle)}>
            {listItemPrefix}
            {domToElement(node.children, node, 'inline') }
          </Text>
        );
      }
    });
  }

  htmlParser(rawHtml, (dom) => {
    done(null, domToElement(dom, null, 'block'));
  });
}
