import htmlparser from 'htmlparser2-without-node-native';

const BLOCK_ELEMENTS = ['div', 'p', 'img', 'address',
  'blockquote', 'dir', 'dl', 'iframe',
  'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'menu', 'ol', 'pre', 'ul', 'li', 'hr'];
const INLINE_ELEMENTS = ['a', 'abbr', 'b', 'big',
  'br', 'cite', 'code', 'em', 'label', 'span', 'strong', 'sub', 'sup', 'i', 'br', 'q'];

export default function (html, done) {
  const rootStack = [{
    name: 'div',
    type: 'block'
  }];
  const tagStack = [rootStack[0]];

  const opts = {
    recognizeSelfClosing: true,
    lowerCaseAttributeNames: true,
    lowerCaseTags: true,
  };

  const parser = new htmlparser.Parser({
    onopentag(name, attribs) {
      if (['head', 'meta', 'link', 'script', 'title'].includes(name)) {
        return;
      }

      const parent = tagStack[tagStack.length - 1];

      if (!parent.children) {
        parent.children = [];
      }

      if (BLOCK_ELEMENTS.indexOf(name) !== -1) {
        parent.children.push({
          name,
          attribs,
          type: 'block',
          parent
        });
        tagStack.push(parent.children[parent.children.length - 1]);
      } else {
        let type = 'inline';

        if (parent.name === 'pre') {
          type = 'block';
        }

        parent.children.push({
          name,
          attribs,
          type,
          parent
        });
        tagStack.push(parent.children[parent.children.length - 1]);
      }
    },
    ontext(text) {
      if (text.charCodeAt() === 10 || text.charCodeAt() === 13 || !text.trim()) return;

      const parent = tagStack[tagStack.length - 1];
      if (text[0] === '面') { console.log(parent); }
      if (['head', 'meta', 'link', 'script', 'title'].includes(parent.name)) return;
      if (!parent.children) parent.children = [];

      parent.children.push({
        name: 'text',
        text,
        parent,
        type: 'inline'
      });
    },
    onclosetag(name) {
      if (['head', 'meta', 'link', 'script', 'title'].includes(name)) return;
      tagStack.pop();
    },
    onend() {
      done(rootStack[0].children);
    }
  }, opts);

  parser.write(html);
  parser.end();
}
