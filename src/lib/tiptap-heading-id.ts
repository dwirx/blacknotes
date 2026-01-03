import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export interface HeadingIdOptions {
  types: string[];
}

export const HeadingId = Extension.create<HeadingIdOptions>({
  name: 'headingId',

  addOptions() {
    return {
      types: ['heading'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          id: {
            default: null,
            parseHTML: element => element.getAttribute('id'),
            renderHTML: attributes => {
              if (!attributes.id) {
                return {};
              }

              return {
                id: attributes.id,
              };
            },
          },
        },
      },
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('headingId'),
        appendTransaction: (_transactions, _oldState, newState) => {
          const tr = newState.tr;
          let modified = false;

          newState.doc.descendants((node, pos) => {
            if (node.type.name === 'heading' && !node.attrs.id) {
              const id = `heading-${Math.random().toString(36).substr(2, 9)}`;
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                id,
              });
              modified = true;
            }
          });

          return modified ? tr : null;
        },
      }),
    ];
  },
});
