/**
 * @module bootstrapgrid/utils/ui/contextualballoon
 */

import { Rect, type PositionOptions } from 'ckeditor5/src/utils';
import { BalloonPanelView, type ContextualBalloon } from 'ckeditor5/src/ui';

import { getBootstrapgridWidgetAncestor } from './widget';
import type { Editor } from 'ckeditor5/src/core';
import type { Element, Position, Range } from 'ckeditor5/src/engine';

const DEFAULT_BALLOON_POSITIONS = BalloonPanelView.defaultPositions;

const BALLOON_POSITIONS = [
	DEFAULT_BALLOON_POSITIONS.northArrowSouth,
	DEFAULT_BALLOON_POSITIONS.northArrowSouthWest,
	DEFAULT_BALLOON_POSITIONS.northArrowSouthEast,
	DEFAULT_BALLOON_POSITIONS.southArrowNorth,
	DEFAULT_BALLOON_POSITIONS.southArrowNorthWest,
	DEFAULT_BALLOON_POSITIONS.southArrowNorthEast,
	DEFAULT_BALLOON_POSITIONS.viewportStickyNorth
];

/**
 * A helper utility that positions the
 * {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon contextual balloon} instance
 * with respect to the bootstrapgrid in the editor content, if one is selected.
 *
 * @param editor The editor instance.
 * @param target Either "cell" or "bootstrapgrid". Determines the target the balloon will be attached to.
 */
export function repositionContextualBalloon( editor: Editor, target: string ): void {
	const balloon: ContextualBalloon = editor.plugins.get( 'ContextualBalloon' );

	if ( getBootstrapgridWidgetAncestor( editor.editing.view.document.selection ) ) {
		let position;

		if ( target === 'column' ) {
			position = getBalloonColumnPositionData( editor );
		} else {
			position = getBalloonBootstrapgridPositionData( editor );
		}

		balloon.updatePosition( position );
	}
}

/**
 * Returns the positioning options that control the geometry of the
 * {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon contextual balloon} with respect
 * to the selected bootstrapgrid in the editor content.
 *
 * @param editor The editor instance.
 */
export function getBalloonBootstrapgridPositionData( editor: Editor ): Partial<PositionOptions> {
	const firstPosition = editor.model.document.selection.getFirstPosition()!;
	const modelBootstrapgrid = firstPosition.findAncestor( 'bootstrapgrid' )!;
	const viewBootstrapgrid = editor.editing.mapper.toViewElement( modelBootstrapgrid )!;

	return {
		target: editor.editing.view.domConverter.mapViewToDom( viewBootstrapgrid )!,
		positions: BALLOON_POSITIONS
	};
}

/**
 * Returns the positioning options that control the geometry of the
 * {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon contextual balloon} with respect
 * to the selected bootstrapgrid cell in the editor content.
 *
 * @param editor The editor instance.
 */
export function getBalloonColumnPositionData( editor: Editor ): Partial<PositionOptions> {
	const mapper = editor.editing.mapper;
	const domConverter = editor.editing.view.domConverter;
	const selection = editor.model.document.selection;

	if ( selection.rangeCount > 1 ) {
		return {
			target: () => createBoundingRect( selection.getRanges(), editor ),
			positions: BALLOON_POSITIONS
		};
	}

	const modelBootstrapgridColumn = getBootstrapgridColumnAtPosition( selection.getFirstPosition()! );
	const viewBootstrapgridColumn = mapper.toViewElement( modelBootstrapgridColumn )!;

	return {
		target: domConverter.mapViewToDom( viewBootstrapgridColumn ),
		positions: BALLOON_POSITIONS
	};
}

/**
 * Returns the first selected bootstrapgrid cell from a multi-cell or in-cell selection.
 *
 * @param position Document position.
 */
function getBootstrapgridColumnAtPosition( position: Position ): Element {
	const isBootstrapgridColumnSelected = position.nodeAfter && position.nodeAfter.is( 'element', 'bootstrapgridColumn' );

	return isBootstrapgridColumnSelected ? position.nodeAfter : position.findAncestor( 'bootstrapgridColumn' )!;
}

/**
 * Returns bounding rectangle for given model ranges.
 *
 * @param ranges Model ranges that the bounding rect should be returned for.
 * @param editor The editor instance.
 */
function createBoundingRect( ranges: Iterable<Range>, editor: Editor ): Rect {
	const mapper = editor.editing.mapper;
	const domConverter = editor.editing.view.domConverter;
	const rects = Array.from( ranges ).map( range => {
		const modelBootstrapgridColumn = getBootstrapgridColumnAtPosition( range.start );
		const viewBootstrapgridColumn = mapper.toViewElement( modelBootstrapgridColumn )!;
		return new Rect( domConverter.mapViewToDom( viewBootstrapgridColumn )! );
	} );

	return Rect.getBoundingRect( rects )!;
}
