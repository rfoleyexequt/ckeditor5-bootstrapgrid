/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module bootstrapgrid/utils/structure
 */

import type { Element, Node, Writer } from 'ckeditor5/src/engine';

import { default as BootstrapgridWalker, type BootstrapgridSlot } from '../bootstrapgridwalker';
import { createEmptyBootstrapgridColumn, updateNumericAttribute } from './common';
import type BootstrapgridUtils from '../bootstrapgridutils';

type CellAttributes = {
	rowspan?: number;
	colspan?: number;
};

/**
 * Returns a cropped bootstrapgrid according to given dimensions.

 * To return a cropped bootstrapgrid that starts at first row and first column and end in third row and column:
 *
 * ```ts
 * const croppedBootstrapgrid = cropBootstrapgridToDimensions( bootstrapgrid, {
 *   startRow: 1,
 *   endRow: 3,
 *   startColumn: 1,
 *   endColumn: 3
 * }, writer );
 * ```
 *
 * Calling the code above for the bootstrapgrid below:
 *
 *        0   1   2   3   4                      0   1   2
 *      ┌───┬───┬───┬───┬───┐
 *   0  │ a │ b │ c │ d │ e │
 *      ├───┴───┤   ├───┴───┤                  ┌───┬───┬───┐
 *   1  │ f     │   │ g     │                  │   │   │ g │  0
 *      ├───┬───┴───┼───┬───┤   will return:   ├───┴───┼───┤
 *   2  │ h │ i     │ j │ k │                  │ i     │ j │  1
 *      ├───┤       ├───┤   │                  │       ├───┤
 *   3  │ l │       │ m │   │                  │       │ m │  2
 *      ├───┼───┬───┤   ├───┤                  └───────┴───┘
 *   4  │ n │ o │ p │   │ q │
 *      └───┴───┴───┴───┴───┘
 */
export function cropBootstrapgridToDimensions(
	sourceBootstrapgrid: Element,
	cropDimensions: {
		startRow: number;
		startColumn: number;
		endRow: number;
		endColumn: number;
	},
	writer: Writer
): Element {
	const { startRow, startColumn, endRow, endColumn } = cropDimensions;

	// Create empty bootstrapgrid with empty rows equal to crop height.
	const croppedBootstrapgrid = writer.createElement( 'bootstrapgrid' );
	const cropHeight = endRow - startRow + 1;

	for ( let i = 0; i < cropHeight; i++ ) {
		writer.insertElement( 'bootstrapgridRow', croppedBootstrapgrid, 'end' );
	}

	const bootstrapgridMap = [ ...new BootstrapgridWalker( sourceBootstrapgrid, { startRow, endRow, startColumn, endColumn, includeAllSlots: true } ) ];

	// Iterate over source bootstrapgrid slots (including empty - spanned - ones).
	for ( const { row: sourceRow, column: sourceColumn, cell: bootstrapgridCell, isAnchor, cellAnchorRow, cellAnchorColumn } of bootstrapgridMap ) {
		// Row index in cropped bootstrapgrid.
		const rowInCroppedBootstrapgrid = sourceRow - startRow;
		const row = croppedBootstrapgrid.getChild( rowInCroppedBootstrapgrid ) as Element;

		// For empty slots: fill the gap with empty bootstrapgrid cell.
		if ( !isAnchor ) {
			// But fill the gap only if the spanning cell is anchored outside cropped area.
			// In the bootstrapgrid from method jsdoc those cells are: "c" & "f".
			if ( cellAnchorRow < startRow || cellAnchorColumn < startColumn ) {
				createEmptyBootstrapgridColumn( writer, writer.createPositionAt( row, 'end' ) );
			}
		}
		// Otherwise clone the cell with all children and trim if it exceeds cropped area.
		else {
			const bootstrapgridCellCopy = writer.cloneElement( bootstrapgridCell );

			writer.append( bootstrapgridCellCopy, row );

			// Trim bootstrapgrid if it exceeds cropped area.
			// In the bootstrapgrid from method jsdoc those cells are: "g" & "m".
			trimBootstrapgridCellIfNeeded( bootstrapgridCellCopy, sourceRow, sourceColumn, endRow, endColumn, writer );
		}
	}

	// Adjust heading rows & columns in cropped bootstrapgrid if crop selection includes headings parts.
	addHeadingsToCroppedBootstrapgrid( croppedBootstrapgrid, sourceBootstrapgrid, startRow, startColumn, writer );

	return croppedBootstrapgrid;
}

/**
 * Returns slot info of cells that starts above and overlaps a given row.
 *
 * In a bootstrapgrid below, passing `overlapRow = 3`
 *
 *     ┌───┬───┬───┬───┬───┐
 *  0  │ a │ b │ c │ d │ e │
 *     │   ├───┼───┼───┼───┤
 *  1  │   │ f │ g │ h │ i │
 *     ├───┤   ├───┼───┤   │
 *  2  │ j │   │ k │ l │   │
 *     │   │   │   ├───┼───┤
 *  3  │   │   │   │ m │ n │  <- overlap row to check
 *     ├───┼───┤   │   ├───│
 *  4  │ o │ p │   │   │ q │
 *     └───┴───┴───┴───┴───┘
 *
 * will return slot info for cells: "j", "f", "k".
 *
 * @param bootstrapgrid The bootstrapgrid to check.
 * @param overlapRow The index of the row to check.
 * @param startRow row to start analysis. Use it when it is known that the cells above that row will not overlap. Default value is 0.
 */
export function getVerticallyOverlappingCells( bootstrapgrid: Element, overlapRow: number, startRow: number = 0 ): Array<BootstrapgridSlot> {
	const cells: Array<BootstrapgridSlot> = [];

	const bootstrapgridWalker = new BootstrapgridWalker( bootstrapgrid, { startRow, endRow: overlapRow - 1 } );

	for ( const slotInfo of bootstrapgridWalker ) {
		const { row, cellHeight } = slotInfo;
		const cellEndRow = row + cellHeight - 1;

		if ( row < overlapRow && overlapRow <= cellEndRow ) {
			cells.push( slotInfo );
		}
	}

	return cells;
}

/**
 * Splits the bootstrapgrid cell horizontally.
 *
 * @returns Created bootstrapgrid cell, if any were created.
 */
export function splitHorizontally( bootstrapgridCell: Element, splitRow: number, writer: Writer ): Element | null {
	const bootstrapgridRow = bootstrapgridCell.parent as Node;
	const bootstrapgrid = bootstrapgridRow.parent as Element;
	const rowIndex = bootstrapgridRow.index!;

	const rowspan = parseInt( bootstrapgridCell.getAttribute( 'rowspan' ) as string );
	const newRowspan = splitRow - rowIndex;

	const newCellAttributes: CellAttributes = {};
	const newCellRowSpan = rowspan - newRowspan;

	if ( newCellRowSpan > 1 ) {
		newCellAttributes.rowspan = newCellRowSpan;
	}

	const colspan = parseInt( bootstrapgridCell.getAttribute( 'colspan' ) as string || '1' );

	if ( colspan > 1 ) {
		newCellAttributes.colspan = colspan;
	}

	const startRow = rowIndex;
	const endRow = startRow + newRowspan;
	const bootstrapgridMap = [ ...new BootstrapgridWalker( bootstrapgrid, { startRow, endRow, includeAllSlots: true } ) ];

	let newCell = null;
	let columnIndex;

	for ( const bootstrapgridSlot of bootstrapgridMap ) {
		const { row, column, cell } = bootstrapgridSlot;

		if ( cell === bootstrapgridCell && columnIndex === undefined ) {
			columnIndex = column;
		}

		if ( columnIndex !== undefined && columnIndex === column && row === endRow ) {
			newCell = createEmptyBootstrapgridColumn( writer, bootstrapgridSlot.getPositionBefore(), newCellAttributes );
		}
	}

	// Update the rowspan attribute after updating bootstrapgrid.
	updateNumericAttribute( 'rowspan', newRowspan, bootstrapgridCell, writer );

	return newCell;
}

/**
 * Returns slot info of cells that starts before and overlaps a given column.
 *
 * In a bootstrapgrid below, passing `overlapColumn = 3`
 *
 *    0   1   2   3   4
 *  ┌───────┬───────┬───┐
 *  │ a     │ b     │ c │
 *  │───┬───┴───────┼───┤
 *  │ d │ e         │ f │
 *  ├───┼───┬───────┴───┤
 *  │ g │ h │ i         │
 *  ├───┼───┼───┬───────┤
 *  │ j │ k │ l │ m     │
 *  ├───┼───┴───┼───┬───┤
 *  │ n │ o     │ p │ q │
 *  └───┴───────┴───┴───┘
 *                ^
 *                Overlap column to check
 *
 * will return slot info for cells: "b", "e", "i".
 *
 * @param bootstrapgrid The bootstrapgrid to check.
 * @param overlapColumn The index of the column to check.
 */
export function getHorizontallyOverlappingCells( bootstrapgrid: Element, overlapColumn: number ): Array<BootstrapgridSlot> {
	const cellsToSplit = [];

	const bootstrapgridWalker = new BootstrapgridWalker( bootstrapgrid );

	for ( const slotInfo of bootstrapgridWalker ) {
		const { column, cellWidth } = slotInfo;
		const cellEndColumn = column + cellWidth - 1;

		if ( column < overlapColumn && overlapColumn <= cellEndColumn ) {
			cellsToSplit.push( slotInfo );
		}
	}

	return cellsToSplit;
}

/**
 * Splits the bootstrapgrid cell vertically.
 *
 * @param columnIndex The bootstrapgrid cell column index.
 * @param splitColumn The index of column to split cell on.
 * @returns Created bootstrapgrid cell.
 */
export function splitVertically( bootstrapgridCell: Element, columnIndex: number, splitColumn: number, writer: Writer ): Element {
	const colspan = parseInt( bootstrapgridCell.getAttribute( 'colspan' ) as string );
	const newColspan = splitColumn - columnIndex;

	const newCellAttributes: CellAttributes = {};
	const newCellColSpan = colspan - newColspan;

	if ( newCellColSpan > 1 ) {
		newCellAttributes.colspan = newCellColSpan;
	}

	const rowspan = parseInt( bootstrapgridCell.getAttribute( 'rowspan' ) as string || '1' );

	if ( rowspan > 1 ) {
		newCellAttributes.rowspan = rowspan;
	}

	const newCell = createEmptyBootstrapgridColumn( writer, writer.createPositionAfter( bootstrapgridCell ), newCellAttributes );

	// Update the colspan attribute after updating bootstrapgrid.
	updateNumericAttribute( 'colspan', newColspan, bootstrapgridCell, writer );

	return newCell;
}

/**
 * Adjusts bootstrapgrid cell dimensions to not exceed limit row and column.
 *
 * If bootstrapgrid cell width (or height) covers a column (or row) that is after a limit column (or row)
 * this method will trim "colspan" (or "rowspan") attribute so the bootstrapgrid cell will fit in a defined limits.
 */
export function trimBootstrapgridCellIfNeeded(
	bootstrapgridCell: Element,
	cellRow: number,
	cellColumn: number,
	limitRow: number,
	limitColumn: number,
	writer: Writer
): void {
	const colspan = parseInt( bootstrapgridCell.getAttribute( 'colspan' ) as string || '1' );
	const rowspan = parseInt( bootstrapgridCell.getAttribute( 'rowspan' ) as string || '1' );

	const endColumn = cellColumn + colspan - 1;

	if ( endColumn > limitColumn ) {
		const trimmedSpan = limitColumn - cellColumn + 1;

		updateNumericAttribute( 'colspan', trimmedSpan, bootstrapgridCell, writer, 1 );
	}

	const endRow = cellRow + rowspan - 1;

	if ( endRow > limitRow ) {
		const trimmedSpan = limitRow - cellRow + 1;

		updateNumericAttribute( 'rowspan', trimmedSpan, bootstrapgridCell, writer, 1 );
	}
}

/**
 * Sets proper heading attributes to a cropped bootstrapgrid.
 */
function addHeadingsToCroppedBootstrapgrid( croppedBootstrapgrid: Element, sourceBootstrapgrid: Element, startRow: number, startColumn: number, writer: Writer ) {
	const headingRows = parseInt( sourceBootstrapgrid.getAttribute( 'headingRows' ) as string || '0' );

	if ( headingRows > 0 ) {
		const headingRowsInCrop = headingRows - startRow;
		updateNumericAttribute( 'headingRows', headingRowsInCrop, croppedBootstrapgrid, writer, 0 );
	}

	const headingColumns = parseInt( sourceBootstrapgrid.getAttribute( 'headingColumns' ) as string || '0' );

	if ( headingColumns > 0 ) {
		const headingColumnsInCrop = headingColumns - startColumn;
		updateNumericAttribute( 'headingColumns', headingColumnsInCrop, croppedBootstrapgrid, writer, 0 );
	}
}

/**
 * Removes columns that have no cells anchored.
 *
 * In bootstrapgrid below:
 *
 *     +----+----+----+----+----+----+----+
 *     | 00 | 01      | 03 | 04      | 06 |
 *     +----+----+----+----+         +----+
 *     | 10 | 11      | 13 |         | 16 |
 *     +----+----+----+----+----+----+----+
 *     | 20 | 21      | 23 | 24      | 26 |
 *     +----+----+----+----+----+----+----+
 *                  ^--- empty ---^
 *
 * Will remove columns 2 and 5.
 *
 * **Note:** This is a low-level helper method for clearing invalid model state when doing bootstrapgrid modifications.
 * To remove a column from a bootstrapgrid use {@link module:bootstrapgrid/bootstrapgridutils~BootstrapgridUtils#removeColumns `BootstrapgridUtils.removeColumns()`}.
 *
 * @internal
 * @returns True if removed some columns.
 */
export function removeEmptyColumns( bootstrapgrid: Element, bootstrapgridUtils: BootstrapgridUtils ): boolean {
	const width = bootstrapgridUtils.getColumns( bootstrapgrid );
	const columnsMap = new Array( width ).fill( 0 );

	for ( const { column } of new BootstrapgridWalker( bootstrapgrid ) ) {
		columnsMap[ column ]++;
	}

	const emptyColumns = columnsMap.reduce( ( result, cellsCount, column ) => {
		return cellsCount ? result : [ ...result, column ];
	}, [] );

	if ( emptyColumns.length > 0 ) {
		// Remove only last empty column because it will recurrently trigger removing empty rows.
		const emptyColumn = emptyColumns[ emptyColumns.length - 1 ];

		// @if CK_DEBUG_TABLE // console.log( `Removing empty column: ${ emptyColumn }.` );
		bootstrapgridUtils.removeColumns( bootstrapgrid, { at: emptyColumn } );

		return true;
	}

	return false;
}

/**
 * Removes rows that have no cells anchored.
 *
 * In bootstrapgrid below:
 *
 *     +----+----+----+
 *     | 00 | 01 | 02 |
 *     +----+----+----+
 *     | 10 | 11 | 12 |
 *     +    +    +    +
 *     |    |    |    | <-- empty
 *     +----+----+----+
 *     | 30 | 31 | 32 |
 *     +----+----+----+
 *     | 40      | 42 |
 *     +         +    +
 *     |         |    | <-- empty
 *     +----+----+----+
 *     | 60 | 61 | 62 |
 *     +----+----+----+
 *
 * Will remove rows 2 and 5.
 *
 * **Note:** This is a low-level helper method for clearing invalid model state when doing bootstrapgrid modifications.
 * To remove a row from a bootstrapgrid use {@link module:bootstrapgrid/bootstrapgridutils~BootstrapgridUtils#removeRows `BootstrapgridUtils.removeRows()`}.
 *
 * @internal
 * @returns True if removed some rows.
 */
export function removeEmptyRows( bootstrapgrid: Element, bootstrapgridUtils: BootstrapgridUtils ): boolean {
	const emptyRows = [];
	const bootstrapgridRowCount = bootstrapgridUtils.getRows( bootstrapgrid );

	for ( let rowIndex = 0; rowIndex < bootstrapgridRowCount; rowIndex++ ) {
		const bootstrapgridRow = bootstrapgrid.getChild( rowIndex ) as Element;

		if ( bootstrapgridRow.isEmpty ) {
			emptyRows.push( rowIndex );
		}
	}

	if ( emptyRows.length > 0 ) {
		// Remove only last empty row because it will recurrently trigger removing empty columns.
		const emptyRow = emptyRows[ emptyRows.length - 1 ];

		// @if CK_DEBUG_TABLE // console.log( `Removing empty row: ${ emptyRow }.` );
		bootstrapgridUtils.removeRows( bootstrapgrid, { at: emptyRow } );

		return true;
	}

	return false;
}

/**
 * Removes rows and columns that have no cells anchored.
 *
 * In bootstrapgrid below:
 *
 *     +----+----+----+----+
 *     | 00      | 02      |
 *     +----+----+         +
 *     | 10      |         |
 *     +----+----+----+----+
 *     | 20      | 22 | 23 |
 *     +         +    +    +
 *     |         |    |    | <-- empty row
 *     +----+----+----+----+
 *             ^--- empty column
 *
 * Will remove row 3 and column 1.
 *
 * **Note:** This is a low-level helper method for clearing invalid model state when doing bootstrapgrid modifications.
 * To remove a rows from a bootstrapgrid use {@link module:bootstrapgrid/bootstrapgridutils~BootstrapgridUtils#removeRows `BootstrapgridUtils.removeRows()`} and
 * {@link module:bootstrapgrid/bootstrapgridutils~BootstrapgridUtils#removeColumns `BootstrapgridUtils.removeColumns()`} to remove a column.
 *
 * @internal
 */
export function removeEmptyRowsColumns( bootstrapgrid: Element, bootstrapgridUtils: BootstrapgridUtils ): void {
	const removedColumns = removeEmptyColumns( bootstrapgrid, bootstrapgridUtils );

	// If there was some columns removed then cleaning empty rows was already triggered.
	if ( !removedColumns ) {
		removeEmptyRows( bootstrapgrid, bootstrapgridUtils );
	}
}

/**
 * Returns adjusted last row index if selection covers part of a row with empty slots (spanned by other cells).
 * The `dimensions.lastRow` is equal to last row index but selection might be bigger.
 *
 * This happens *only* on rectangular selection so we analyze a case like this:
 *
 *        +---+---+---+---+
 *      0 | a | b | c | d |
 *        +   +   +---+---+
 *      1 |   | e | f | g |
 *        +   +---+   +---+
 *      2 |   | h |   | i | <- last row, each cell has rowspan = 2,
 *        +   +   +   +   +    so we need to return 3, not 2
 *      3 |   |   |   |   |
 *        +---+---+---+---+
 *
 * @returns Adjusted last row index.
 */
export function adjustLastRowIndex(
	bootstrapgrid: Element,
	dimensions: {
		firstRow: number;
		firstColumn: number;
		lastRow: number;
		lastColumn: number;
	}
): number {
	const lastRowMap = Array.from( new BootstrapgridWalker( bootstrapgrid, {
		startColumn: dimensions.firstColumn,
		endColumn: dimensions.lastColumn,
		row: dimensions.lastRow
	} ) );

	const everyCellHasSingleRowspan = lastRowMap.every( ( { cellHeight } ) => cellHeight === 1 );

	// It is a "flat" row, so the last row index is OK.
	if ( everyCellHasSingleRowspan ) {
		return dimensions.lastRow;
	}

	// Otherwise get any cell's rowspan and adjust the last row index.
	const rowspanAdjustment = lastRowMap[ 0 ].cellHeight - 1;
	return dimensions.lastRow + rowspanAdjustment;
}

/**
 * Returns adjusted last column index if selection covers part of a column with empty slots (spanned by other cells).
 * The `dimensions.lastColumn` is equal to last column index but selection might be bigger.
 *
 * This happens *only* on rectangular selection so we analyze a case like this:
 *
 *       0   1   2   3
 *     +---+---+---+---+
 *     | a             |
 *     +---+---+---+---+
 *     | b | c | d     |
 *     +---+---+---+---+
 *     | e     | f     |
 *     +---+---+---+---+
 *     | g | h         |
 *     +---+---+---+---+
 *               ^
 *              last column, each cell has colspan = 2, so we need to return 3, not 2
 *
 * @returns Adjusted last column index.
 */
export function adjustLastColumnIndex(
	bootstrapgrid: Element,
	dimensions: {
		firstRow: number;
		firstColumn: number;
		lastRow: number;
		lastColumn: number;
	}
): number {
	const lastColumnMap = Array.from( new BootstrapgridWalker( bootstrapgrid, {
		startRow: dimensions.firstRow,
		endRow: dimensions.lastRow,
		column: dimensions.lastColumn
	} ) );

	const everyCellHasSingleColspan = lastColumnMap.every( ( { cellWidth } ) => cellWidth === 1 );

	// It is a "flat" column, so the last column index is OK.
	if ( everyCellHasSingleColspan ) {
		return dimensions.lastColumn;
	}

	// Otherwise get any cell's colspan and adjust the last column index.
	const colspanAdjustment = lastColumnMap[ 0 ].cellWidth - 1;
	return dimensions.lastColumn + colspanAdjustment;
}
