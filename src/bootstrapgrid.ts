/**
 * @module bootstrapgrid/bootstrapgrid
 */

import { Plugin } from 'ckeditor5/src/core';
import { Widget } from 'ckeditor5/src/widget';
import { ButtonView } from 'ckeditor5/src/ui';

import ckeditor5Icon from '../theme/icons/ckeditor.svg';
import bootstrapgridicon from '../theme/icons/bootstrapgrid.svg';

import BootstrapGridEditing from './bootstrapgridediting';

import '../theme/style.css';

export default class Bootstrapgrid extends Plugin {
    /**
 * @inheritDoc
 */
    public static get pluginName() {
        return 'Bootstrapgrid' as const;
    }

    static get requires() {
        return [
            BootstrapGridEditing
        ];
    }

    public init(): void {
        const editor = this.editor;
        const t = editor.t;
        const model = editor.model;

        // Add the "bootstrapgridButton" to feature components.
        editor.ui.componentFactory.add('bootstrapgridButton', locale => {
            const view = new ButtonView(locale);

            view.set({
                label: t('Insert Bootstrap Grid'),
                icon: bootstrapgridicon,
                tooltip: true
            });

            // Insert a text into the editor after clicking the button.
            this.listenTo(view, 'execute', () => {
                model.change(writer => {
                    const textNode = writer.createText('Hello CKEditor 5!');

                    model.insertContent(textNode);
                });

                editor.editing.view.focus();
            });

            return view;
        });
    }
}
