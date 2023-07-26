/**
 * @module bootstrapgrid/utils/ui/widget
 */

import type { ViewDocumentFragment, ViewDocumentSelection, ViewElement, ViewNode } from 'ckeditor5/src/engine';

import { isWidget } from 'ckeditor5/src/widget';

/**
 * Returns a bootstrapgrid widget editing view element if one is selected.
 */
export function getSelectedBootstrapgridWidget( selection: ViewDocumentSelection ): ViewElement | null {
	const viewElement = selection.getSelectedElement();

	if ( viewElement && isBootstrapgridWidget( viewElement ) ) {
		return viewElement;
	}

	return null;
}

/**
 * Returns a bootstrapgrid widget editing view element if one is among the selection's ancestors.
 */
export function getBootstrapgridWidgetAncestor( selection: ViewDocumentSelection ): ViewElement | null {
	const selectionPosition = selection.getFirstPosition();

	if ( !selectionPosition ) {
		return null;
	}

	let parent: ViewNode | ViewDocumentFragment | null = selectionPosition.parent;

	while ( parent ) {
		if ( parent.is( 'element' ) && isBootstrapgridWidget( parent ) ) {
			return parent;
		}

		parent = parent.parent;
	}

	return null;
}

/**
 * Checks if a given view element is a bootstrapgrid widget.
 */
function isBootstrapgridWidget( viewElement: ViewElement ): boolean {
	return !!viewElement.getCustomProperty( 'bootstrapgrid' ) && isWidget( viewElement );
}
