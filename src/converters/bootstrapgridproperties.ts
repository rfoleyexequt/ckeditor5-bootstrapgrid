/**
 * @module bootstrapgrid/converters/bootstrapgridproperties
 */

import type { Conversion, ViewElement } from 'ckeditor5/src/engine';

/**
 * Conversion helper for upcasting attributes using normalized CSS Classes.
 *
 * @param options.modelAttribute The attribute to set.
 * @param options.cssName The css name to convert.
 * @param options.viewElement The view element name that should be converted.
 * @param options.defaultValue The default value for the specified `modelAttribute`.
 * @param options.shouldUpcast The function which returns `true` if style should be upcasted from this element.
 */
export function upcastStyleToAttribute(
	conversion: Conversion,
	options: {
		modelAttribute: string;
		styleName: string;
		viewElement: string | RegExp;
		defaultValue: string;
		reduceBoxSides?: boolean;
		shouldUpcast?: ( viewElement: ViewElement ) => boolean;
	}
): void {
	const {
		modelAttribute,
		styleName,
		viewElement,
		defaultValue,
		reduceBoxSides = false,
		shouldUpcast = () => true
	} = options;

	conversion.for( 'upcast' ).attributeToAttribute( {
		view: {
			name: viewElement,
			styles: {
				[ styleName ]: /[\s\S]+/
			}
		},
		model: {
			key: modelAttribute,
			value: ( viewElement: ViewElement ) => {
				if ( !shouldUpcast( viewElement ) ) {
					return;
				}

				const normalized = viewElement.getNormalizedStyle( styleName ) as Record<Side, string>;
				const value = reduceBoxSides ? reduceBoxSidesValue( normalized ) : normalized;

				if ( defaultValue !== value ) {
					return value;
				}
			}
		}
	} );
}

export interface StyleValues {
	color: string;
	style: string;
	width: string;
}

/**
 * Conversion helper for upcasting attributes using normalized CSS Classes.
 *
 * @param options.modelAttribute The attribute to set.
 * @param options.cssName The css name to convert.
 * @param options.viewElement The view element name that should be converted.
 * @param options.defaultValue The default value for the specified `modelAttribute`.
 * @param options.shouldUpcast The function which returns `true` if style should be upcasted from this element.
*/
export function upcastCSSClassToAttribute(
	conversion: Conversion,
	options: {
		modelAttribute: string;
		styleName: string;
		viewElement: string | RegExp;
		defaultValue: string;
		reduceBoxSides?: boolean;
		shouldUpcast?: ( viewElement: ViewElement ) => boolean;
	}
): void {
	const {
		modelAttribute,
		styleName,
		viewElement,
		defaultValue,
		reduceBoxSides = false,
		shouldUpcast = () => true
	} = options;

	conversion.for( 'upcast' ).attributeToAttribute( 
        {
            view: {
                    name: viewElement,
                    styles: {
			[ styleName ]: /[\s\S]+/
                    }
            },
            model: {
                    key: modelAttribute,
                    value: ( viewElement: ViewElement ) => {
                            if ( !shouldUpcast( viewElement ) ) {
                                    return;
                            }

                            const normalized = viewElement.getNormalizedStyle( styleName ) as Record<Side, string>;
                            const value = reduceBoxSides ? reduceBoxSidesValue( normalized ) : normalized;

                            if ( defaultValue !== value ) {
                                    return value;
                            }
                    }
            }
	} );
}

/**
 * Conversion helper for downcasting an attribute to a style.
 */
export function downcastAttributeToCSSClass(
	conversion: Conversion,
	options: {
		modelElement: string;
		modelAttribute: string;
		styleName: string;
	}
): void {
	const { modelElement, modelAttribute, styleName } = options;

	conversion.for( 'downcast' ).attributeToAttribute( {
		model: {
			name: modelElement,
			key: modelAttribute
		},
		view: modelAttributeValue => ( {
			key: 'style',
			value: {
				[ styleName ]: modelAttributeValue
			}
		} )
	} );
}

/**
 * Conversion helper for downcasting attributes from the model bootstrapgrid to a view bootstrapgrid (not to `<figure>`).
 */
export function downcastBootstrapgridAttribute(
	conversion: Conversion,
	options: {
		modelAttribute: string;
		styleName: string;
	}
): void {
	const { modelAttribute, styleName } = options;

	conversion.for( 'downcast' ).add( dispatcher => dispatcher.on( `attribute:${ modelAttribute }:bootstrapgrid`, ( evt, data, conversionApi ) => {
		const { item, attributeNewValue } = data;
		const { mapper, writer } = conversionApi;

		if ( !conversionApi.consumable.consume( data.item, evt.name ) ) {
			return;
		}

		const bootstrapgrid = [ ...mapper.toViewElement( item ).getChildren() ].find( child => child.is( 'element', 'bootstrapgrid' ) );

		if ( attributeNewValue ) {
			writer.setStyle( styleName, attributeNewValue, bootstrapgrid );
		} else {
			writer.removeStyle( styleName, bootstrapgrid );
		}
	} ) );
}

type Side = 'top' | 'right' | 'bottom' | 'left';
type Style = Record<Side, string>;

/**
 * Reduces the full top, right, bottom, left object to a single string if all sides are equal.
 * Returns original style otherwise.
 */
function reduceBoxSidesValue( style?: Style ): undefined | string | Style {
	if ( !style ) {
		return;
	}
	const sides: Array<Side> = [ 'top', 'right', 'bottom', 'left' ];
	const allSidesDefined = sides.every( side => style[ side ] );

	if ( !allSidesDefined ) {
		return style;
	}

	const topSideStyle = style.top;
	const allSidesEqual = sides.every( side => style[ side ] === topSideStyle );

	if ( !allSidesEqual ) {
		return style;
	}

	return topSideStyle;
}

/**
 * Searches a class array for a matching classname
 */
function classNameExists(classNames: Array<string>, className: string): boolean {
    
    for ( const classItem of classNames ) {
        const status = classItem.indexOf(className);
        const result = (status !== -1) ? true : false;
        if (result == true) {
            return result;
            break;
        }
    }
    
    return false;
}

function getClassFragmentFullName(classNames: Array<string>, classFragment: string): string | boolean {
    
    for ( const classItem of classNames ) {
        const status = classItem.indexOf(classFragment);
        const result = (status !== -1) ? true : false;
        if (result == true) {
            return classItem;
            break;
        }
    }
    
    return false;
}