/**
 * @module bootstrapgrid/utils/common
 */

import type {
	Conversion,
	Element,
	Item,
	Position,
	Schema,
	Writer
} from 'ckeditor5/src/engine';

//import { downcastAttributeToStyle, upcastStyleToAttribute } from './../converters/bootstrapgridproperties';
import type BootstrapgridUtils from '../bootstrapgridutils';

/**
 * A common method to update the numeric value. If a value is the default one, it will be unset.
 *
 * @param key An attribute key.
 * @param value The new attribute value.
 * @param item A model item on which the attribute will be set.
 * @param defaultValue The default attribute value. If a value is lower or equal, it will be unset.
 */
export function updateNumericAttribute( key: string, value: unknown, item: Item, writer: Writer, defaultValue: unknown = 1 ): void {
	if ( value !== undefined && value !== null && defaultValue !== undefined && defaultValue !== null && value > defaultValue ) {
		writer.setAttribute( key, value, item );
	} else {
		writer.removeAttribute( key, item );
	}
}

/**
 * A common method to create an empty bootstrapgrid column. It creates a proper model structure as a bootstrapgrid column must have at least one block inside.
 *
 * @param writer The model writer.
 * @param insertPosition The position at which the bootstrapgrid column should be inserted.
 * @param attributes The element attributes.
 * @returns Created bootstrapgrid column.
 */
export function createEmptyBootstrapgridColumn( writer: Writer, insertPosition: Position, attributes: Record<string, unknown> = {} ): Element {
	const bootstrapgridColumn = writer.createElement( 'bootstrapgridColumn', attributes );
        const bootstrapgridColumnContent = writer.createElement('BootstrapgridColumnContent');
        const paragraph = writer.createElement('paragraph');
        const textContent = writer.createText('Content goes here.');
    
        writer.appendText('Content goes here.', paragraph);
        writer.append(paragraph, bootstrapgridColumnContent);
        writer.append(bootstrapgridColumnContent, bootstrapgridColumn);
	writer.insert( bootstrapgridColumn, insertPosition );

	return bootstrapgridColumn;
}

/**
 * Enables conversion for an attribute for simple view-model mappings.
 *
 * @param options.defaultValue The default value for the specified `modelAttribute`.
 */
export function enableProperty(
	schema: Schema,
	conversion: Conversion,
	options: {
		modelAttribute: string;
		styleName: string;
		defaultValue: string;
		reduceBoxSides?: boolean;
	}
): void {
	const { modelAttribute } = options;

	schema.extend( 'bootstrapgridColumn', {
		allowAttributes: [ modelAttribute ]
	} );

	//upcastStyleToAttribute( conversion, { viewElement: /^(td|th)$/, ...options } );
	//downcastAttributeToCSSClass( conversion, { modelElement: 'bootstrapgridColumn', ...options } );
}
