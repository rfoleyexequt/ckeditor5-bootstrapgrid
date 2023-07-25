/**
 * @module bootstrapgrid/bootstrapgridediting
 */

import { Plugin, type Editor } from 'ckeditor5/src/core';
import { Widget, toWidget, toWidgetEditable } from '@ckeditor/ckeditor5-widget';
import type { PositionOffset, ViewElement, SlotFilter } from 'ckeditor5/src/engine';

import '../theme/editor-styles.css';

/**
 * The table editing feature.
 */
export default class BootstrapgridEditing extends Plugin {
    /**
 * @inheritDoc
 */
    public static get pluginName() {
        return 'BootstrapgridEditing' as const;
    }
    
    static get requires() {
        return [Widget];
    }

    public init(): void {
        const editor = this.editor;
        const model = editor.model;
        const schema = model.schema;
        const conversion = editor.conversion;

        // ----------------------------- Schema ----------------------------- 
        schema.register('BoostrapGridContainer', {
            inheritAllFrom: '$blockObject',
            isLimit: true,
            isObject: true,
        });

        schema.register('BootstrapGridRow', {
            allowIn: 'BoostrapGridContainer',
            allowChildren: 'BootstrapGridColumn',
            isLimit: true,
            isBlock: true,
        });

        schema.register('BootstrapGridColumn', {
            // Behaves like a self-contained block object (e.g. a block image)
            // allowed in places where other blocks are allowed (e.g. directly in the root).
            inheritAllFrom: '$blockObject',
            isLimit: true,
            isObject: true,
            allowIn: 'BootstrapGridRow',
            allowChildren: 'BootstrapGridColumnContent',

            // Each column has an ID. A unique ID tells the application which
            // column represents and makes it possible to render it inside a widget.
            allowAttributes: ['id', 'col', 'colSM', 'colMD', 'colLG', 'colXL', 'colXXL'],
        });

        schema.register('BootstrapGridColumnContent', {
            // Cannot be split or left by the caret.
            isLimit: true,
            allowIn: 'BootstrapGridColumn',
            // Allow content which is allowed in the root (e.g. paragraphs).
            allowContentOf: '$root',
            allowChildren: ['$text', 'blockQuote', 'caption', 'codeBlock', 'heading1', 'heading2', 'heading3', 'horizontalLine', 'imageBlock', 'imageInline', 'listItem', 'media', 'pageBreak', 'paragraph', 'softBreak', 'hardBreak', 'table'],
        });

        schema.addChildCheck((context, childDefinition) => {
            if (context.endsWith('BootstrapGridColumnContent') && childDefinition.name == 'BootstrapGridColumn') {
                return false;
            }
        });
        
        // ----------------------------- Converters ----------------------------- 
        
        // Container
        conversion.for('dataDowncast').elementToElement({
            model: 'BoostrapGridContainer',
            view: {
                name: 'div',
                classes: 'container'
            }
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'BoostrapGridContainer',
            view: (modelElement, { writer: viewWriter }) => {
                const section = viewWriter.createContainerElement('div', {class: 'container'});
                return toWidget(section, viewWriter, {label: 'Boostrap Grid widget'});
            }
        });

        conversion.for('upcast').elementToElement({
            model: 'BoostrapGridContainer',
            view: {
                name: 'div',
                classes: 'container',
            }
        });
        
        // Row
        conversion.for('dataDowncast').elementToElement({
            model: 'BootstrapGridRow',
            view: {
                name: 'div',
                classes: ['row']
            }
        });

        conversion.for('editingDowncast').elementToElement({
            model: 'BootstrapGridRow',
            view: (modelElement, { writer: viewWriter }) => {
                const section = viewWriter.createContainerElement('div', {class: ['row']});
                return toWidget(section, viewWriter, {label: 'Boostrap Grid Row widget'});
            }
        });

        conversion.for('upcast').elementToElement({
            model: 'BootstrapGridRow',
            view: {
                name: 'div',
                classes: ['row']
            }
        });
        
        // Column
        conversion.for('upcast').elementToElement({
            model: 'BootstrapGridColumn',
            view: {
                name: 'div',
                classes: [ 'col' ]
            }
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'BootstrapGridColumn',
            view: {
                name: 'div',
                classes: [ 'col' ]
            }
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'BootstrapGridColumn',
            view: (modelElement, { writer: viewWriter }) => {
                const section = viewWriter.createContainerElement('div', {class: 'col'});
                return toWidget(section, viewWriter, {label: 'Bootstrap Grid Col widget'});
            }
        });

        
        // Content
        conversion.for('upcast').elementToElement({
            model: 'BootstrapGridColumnContent',
            view: {
                name: 'div',
                classes: ['content']
            }
        });
        conversion.for('dataDowncast').elementToElement({
            model: 'BootstrapGridColumnContent',
            view: {
                name: 'div',
                classes: ['content']
            }
        });
        conversion.for('editingDowncast').elementToElement({
            model: 'BootstrapGridColumnContent',
            view: (modelElement, { writer: viewWriter }) => {
                // Note: You use a more specialized createEditableElement() method here.
                const div = viewWriter.createEditableElement('div', {class: 'content'});
                return toWidgetEditable(div, viewWriter);
            }
        });
        
        // ----------------------------- Commands ----------------------------- 
        
        
    }

}