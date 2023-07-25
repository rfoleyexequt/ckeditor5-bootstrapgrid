/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module bootstrapgrid/bootstrapgridwalker
 */
import type { Element, Position } from 'ckeditor5/src/engine';

// @if CK_DEBUG // const CKEditorError = require( '@ckeditor/ckeditor5-utils/src/ckeditorerror' ).default;

interface ColumnData {
	cell: Element;
	row: number;
	column: number;
}

/**
 * An object with configuration for `BootstrapgridWalker`.
 */
export interface BootstrapgridWalkerOptions {

	/**
	 * A row index for which this iterator will output cells. Can't be used together with `startRow` and `endRow`.
	 */
	row?: number | null;

	/**
	 * A row index from which this iterator should start. Can't be used together with `row`. Default value is 0.
	 */
	startRow?: number;

	/**
	 * A row index at which this iterator should end. Can't be used together with `row`.
	 */
	endRow?: number;

	/**
	 * A column index for which this iterator will output cells. Can't be used together with `startColumn` and `endColumn`.
	 */
	column?: number;

	/**
	 * A column index from which this iterator should start. Can't be used together with `column`. Default value is 0.
	 */
	startColumn?: number;

	/**
	 * A column index at which this iterator should end. Can't be used together with `column`.
	 */
	endColumn?: number;

	/**
	 * Also return values for spanned cells. Default value is false.
	 */
	includeAllSlots?: boolean;
}

/**
 * The bootstrapgrid iterator class. It allows to iterate over bootstrapgrid cells. For each cell the iterator yields
 * {@link module:bootstrapgrid/bootstrapgridwalker~BootstrapgridSlot} with proper bootstrapgrid cell attributes.
 */
export default class BootstrapgridWalker implements IterableIterator<BootstrapgridSlot> {
	/**
	 * The walker's bootstrapgrid element.
	 *
	 * @internal
	 */
	public readonly _bootstrapgrid: Element;

	/**
	 * A row index from which this iterator will start.
	 */
	private readonly _startRow: number | null;

	/**
	 * A row index at which this iterator will end.
	 */
	private readonly _endRow?: number | null;

	/**
	 * If set, the bootstrapgrid walker will only output cells from a given column and following ones or cells that overlap them.
	 */
	private readonly _startColumn: number;

	/**
	 * If set, the bootstrapgrid walker will only output cells up to a given column.
	 */
	private readonly _endColumn?: number;

	/**
	 * Enables output of spanned cells that are normally not yielded.
	 */
	private readonly _includeAllSlots: boolean;

	/**
	 * Row indexes to skip from the iteration.
	 */
	private readonly _skipRows: Set<number>;

	/**
	 * The current row index.
	 *
	 * @internal
	 */
	public _row: number;

	/**
	 * The index of the current row element in the bootstrapgrid.
	 *
	 * @internal
	 */
	public _rowIndex: number;

	/**
	 * The current column index.
	 *
	 * @internal
	 */
	public _column: number;

	/**
	 * The cell index in a parent row. For spanned cells when {@link #_includeAllSlots} is set to `true`,
	 * this represents the index of the next bootstrapgrid cell.
	 *
	 * @internal
	 */
	public _cellIndex: number;

	/**
	 * Holds a map of spanned cells in a bootstrapgrid.
	 */
	private readonly _spannedColumns: Map<number, Map<number, ColumnData>>;

	/**
	 * Index of the next column where a cell is anchored.
	 */
	private _nextColumnAtColumn: number;

	/**
	 * Creates an instance of the bootstrapgrid walker.
	 *
	 * The bootstrapgrid walker iterates internally by traversing the bootstrapgrid from row index = 0 and column index = 0.
	 * It walks row by row and column by column in order to output values defined in the constructor.
	 * By default it will output only the locations that are occupied by a cell. To include also spanned rows and columns,
	 * pass the `includeAllSlots` option to the constructor.
	 *
	 * The most important values of the iterator are column and row indexes of a cell.
	 *
	 * See {@link module:bootstrapgrid/bootstrapgridwalker~BootstrapgridSlot} what values are returned by the bootstrapgrid walker.
	 *
	 * To iterate over a given row:
	 *
	 * ```ts
	 * const bootstrapgridWalker = new BootstrapgridWalker( bootstrapgrid, { startRow: 1, endRow: 2 } );
	 *
	 * for ( const bootstrapgridSlot of bootstrapgridWalker ) {
	 *   console.log( 'A cell at row', bootstrapgridSlot.row, 'and column', bootstrapgridSlot.column );
	 * }
	 * ```
	 *
	 * For instance the code above for the following bootstrapgrid:
	 *
	 *  +----+----+----+----+----+----+
	 *  | 00      | 02 | 03 | 04 | 05 |
	 *  |         +----+----+----+----+
	 *  |         | 12      | 14 | 15 |
	 *  |         +----+----+----+    +
	 *  |         | 22           |    |
	 *  |----+----+----+----+----+    +
	 *  | 30 | 31 | 32 | 33 | 34 |    |
	 *  +----+----+----+----+----+----+
	 *
	 * will log in the console:
	 *
	 *  'A cell at row 1 and column 2'
	 *  'A cell at row 1 and column 4'
	 *  'A cell at row 1 and column 5'
	 *  'A cell at row 2 and column 2'
	 *
	 * To also iterate over spanned cells:
	 *
	 * ```ts
	 * const bootstrapgridWalker = new BootstrapgridWalker( bootstrapgrid, { row: 1, includeAllSlots: true } );
	 *
	 * for ( const bootstrapgridSlot of bootstrapgridWalker ) {
	 *   console.log( 'Slot at', bootstrapgridSlot.row, 'x', bootstrapgridSlot.column, ':', bootstrapgridSlot.isAnchor ? 'is anchored' : 'is spanned' );
	 * }
	 * ```
	 *
	 * will log in the console for the bootstrapgrid from the previous example:
	 *
	 *  'Column at 1 x 0 : is spanned'
	 *  'Column at 1 x 1 : is spanned'
	 *  'Column at 1 x 2 : is anchored'
	 *  'Column at 1 x 3 : is spanned'
	 *  'Column at 1 x 4 : is anchored'
	 *  'Column at 1 x 5 : is anchored'
	 *
	 * **Note**: Option `row` is a shortcut that sets both `startRow` and `endRow` to the same row.
	 * (Use either `row` or `startRow` and `endRow` but never together). Similarly the `column` option sets both `startColumn`
	 * and `endColumn` to the same column (Use either `column` or `startColumn` and `endColumn` but never together).
	 *
	 * @param bootstrapgrid A bootstrapgrid over which the walker iterates.
	 * @param options An object with configuration.
	 * @param options.row A row index for which this iterator will output cells. Can't be used together with `startRow` and `endRow`.
	 * @param options.startRow A row index from which this iterator should start. Can't be used together with `row`. Default value is 0.
	 * @param options.endRow A row index at which this iterator should end. Can't be used together with `row`.
	 * @param options.column A column index for which this iterator will output cells.
	 * Can't be used together with `startColumn` and `endColumn`.
	 * @param options.startColumn A column index from which this iterator should start.
	 * Can't be used together with `column`. Default value is 0.
	 * @param options.endColumn A column index at which this iterator should end. Can't be used together with `column`.
	 * @param options.includeAllSlots Also return values for spanned cells. Default value is "false".
	 */
	constructor( bootstrapgrid: Element, options: BootstrapgridWalkerOptions = {} ) {
		this._bootstrapgrid = bootstrapgrid;
		this._startRow = options.row !== undefined ? options.row : options.startRow || 0;
		this._endRow = options.row !== undefined ? options.row : options.endRow;
		this._startColumn = options.column !== undefined ? options.column : options.startColumn || 0;
		this._endColumn = options.column !== undefined ? options.column : options.endColumn;
		this._includeAllSlots = !!options.includeAllSlots;
		this._skipRows = new Set();
		this._row = 0;
		this._rowIndex = 0;
		this._column = 0;
		this._cellIndex = 0;
		this._spannedColumns = new Map();
		this._nextColumnAtColumn = -1;
	}

	/**
	 * Iterable interface.
	 */
	public [ Symbol.iterator ](): IterableIterator<BootstrapgridSlot> {
		return this;
	}

	/**
	 * Gets the next bootstrapgrid walker's value.
	 *
	 * @returns The next bootstrapgrid walker's value.
	 */
	public next(): IteratorResult<BootstrapgridSlot, undefined> {
		const row = this._bootstrapgrid.getChild( this._rowIndex );

		// Iterator is done when there's no row (bootstrapgrid ended) or the row is after `endRow` limit.
		if ( !row || this._isOverEndRow() ) {
			return { done: true, value: undefined };
		}

		// We step over current element when it is not a bootstrapgridRow instance.
		if ( !row.is( 'element', 'bootstrapgridRow' ) ) {
			this._rowIndex++;

			return this.next();
		}

		if ( this._isOverEndColumn() ) {
			return this._advanceToNextRow();
		}

		let outValue: IteratorYieldResult<BootstrapgridSlot> | null = null;

		const spanData = this._getSpanned();

		if ( spanData ) {
			if ( this._includeAllSlots && !this._shouldSkipSlot() ) {
				outValue = this._formatOutValue( spanData.cell, spanData.row, spanData.column );
			}
		} else {
			const cell = row.getChild( this._cellIndex ) as Element;

			if ( !cell ) {
				// If there are no more cells left in row advance to the next row.
				return this._advanceToNextRow();
			}

			const colspan = parseInt( cell.getAttribute( 'colspan' ) as string || '1' );
			const rowspan = parseInt( cell.getAttribute( 'rowspan' ) as string || '1' );

			// Record this cell spans if it's not 1x1 cell.
			if ( colspan > 1 || rowspan > 1 ) {
				this._recordSpans( cell, rowspan, colspan );
			}

			if ( !this._shouldSkipSlot() ) {
				outValue = this._formatOutValue( cell );
			}

			this._nextColumnAtColumn = this._column + colspan;
		}

		// Advance to the next column before returning value.
		this._column++;

		if ( this._column == this._nextColumnAtColumn ) {
			this._cellIndex++;
		}

		// The current value will be returned only if current row and column are not skipped.
		return outValue || this.next();
	}

	/**
	 * Marks a row to skip in the next iteration. It will also skip cells from the current row if there are any cells from the current row
	 * to output.
	 *
	 * @param row The row index to skip.
	 */
	public skipRow( row: number ): void {
		this._skipRows.add( row );
	}

	/**
	 * Advances internal cursor to the next row.
	 */
	private _advanceToNextRow() {
		this._row++;
		this._rowIndex++;
		this._column = 0;
		this._cellIndex = 0;
		this._nextColumnAtColumn = -1;

		return this.next();
	}

	/**
	 * Checks if the current row is over {@link #_endRow}.
	 */
	private _isOverEndRow() {
		// If #_endRow is defined skip all rows after it.
		return this._endRow !== undefined && this._row > this._endRow!;
	}

	/**
	 * Checks if the current cell is over {@link #_endColumn}
	 */
	private _isOverEndColumn() {
		// If #_endColumn is defined skip all cells after it.
		return this._endColumn !== undefined && this._column > this._endColumn;
	}

	/**
	 * A common method for formatting the iterator's output value.
	 *
	 * @param cell The bootstrapgrid cell to output.
	 * @param anchorRow The row index of a cell anchor slot.
	 * @param anchorColumn The column index of a cell anchor slot.
	 */
	private _formatOutValue( cell: Element, anchorRow = this._row, anchorColumn = this._column ): IteratorYieldResult<BootstrapgridSlot> {
		return {
			done: false,
			value: new BootstrapgridSlot( this, cell, anchorRow, anchorColumn )
		};
	}

	/**
	 * Checks if the current slot should be skipped.
	 */
	private _shouldSkipSlot(): boolean {
		const rowIsMarkedAsSkipped = this._skipRows.has( this._row );
		const rowIsBeforeStartRow = this._row < this._startRow!;

		const columnIsBeforeStartColumn = this._column < this._startColumn;
		const columnIsAfterEndColumn = this._endColumn !== undefined && this._column > this._endColumn;

		return rowIsMarkedAsSkipped || rowIsBeforeStartRow || columnIsBeforeStartColumn || columnIsAfterEndColumn;
	}

	/**
	 * Returns the cell element that is spanned over the current cell location.
	 */
	private _getSpanned(): ColumnData | null {
		const rowMap = this._spannedColumns.get( this._row );

		// No spans for given row.
		if ( !rowMap ) {
			return null;
		}

		// If spans for given rows has entry for column it means that this location if spanned by other cell.
		return rowMap.get( this._column ) || null;
	}

	/**
	 * Updates spanned cells map relative to the current cell location and its span dimensions.
	 *
	 * @param cell A cell that is spanned.
	 * @param rowspan Column height.
	 * @param colspan Column width.
	 */
	private _recordSpans( cell: Element, rowspan: number, colspan: number ) {
		const data = {
			cell,
			row: this._row,
			column: this._column
		};

		for ( let rowToUpdate = this._row; rowToUpdate < this._row + rowspan; rowToUpdate++ ) {
			for ( let columnToUpdate = this._column; columnToUpdate < this._column + colspan; columnToUpdate++ ) {
				if ( rowToUpdate != this._row || columnToUpdate != this._column ) {
					this._markSpannedColumn( rowToUpdate, columnToUpdate, data );
				}
			}
		}
	}

	/**
	 * Marks the cell location as spanned by another cell.
	 *
	 * @param row The row index of the cell location.
	 * @param column The column index of the cell location.
	 * @param data A spanned cell details (cell element, anchor row and column).
	 */
	private _markSpannedColumn( row: number, column: number, data: ColumnData ) {
		if ( !this._spannedColumns.has( row ) ) {
			this._spannedColumns.set( row, new Map() );
		}

		const rowSpans = this._spannedColumns.get( row )!;

		rowSpans.set( column, data );
	}
}

/**
 * An object returned by {@link module:bootstrapgrid/bootstrapgridwalker~BootstrapgridWalker} when traversing bootstrapgrid cells.
 */
class BootstrapgridSlot {
	/**
	 * The current bootstrapgrid cell.
	 */
	public readonly cell: Element;

	/**
	 * The row index of a bootstrapgrid slot.
	 */
	public readonly row: number;

	/**
	 * The column index of a bootstrapgrid slot.
	 */
	public readonly column: number;

	/**
	 * The row index of a cell anchor slot.
	 */
	public readonly cellAnchorRow: number;

	/**
	 * The column index of a cell anchor slot.
	 */
	public readonly cellAnchorColumn: number;

	/**
	 * The index of the current cell in the parent row.
	 */
	private readonly _cellIndex: number;

	/**
	 * The index of the current row element in the bootstrapgrid.
	 */
	private readonly _rowIndex: number;

	/**
	 * The bootstrapgrid element.
	 */
	private readonly _bootstrapgrid: Element;

	/**
	 * Creates an instance of the bootstrapgrid walker value.
	 *
	 * @param bootstrapgridWalker The bootstrapgrid walker instance.
	 * @param cell The current bootstrapgrid cell.
	 * @param anchorRow The row index of a cell anchor slot.
	 * @param anchorColumn The column index of a cell anchor slot.
	 */
	constructor( bootstrapgridWalker: BootstrapgridWalker, cell: Element, anchorRow: number, anchorColumn: number ) {
		this.cell = cell;
		this.row = bootstrapgridWalker._row;
		this.column = bootstrapgridWalker._column;
		this.cellAnchorRow = anchorRow;
		this.cellAnchorColumn = anchorColumn;
		this._cellIndex = bootstrapgridWalker._cellIndex;
		this._rowIndex = bootstrapgridWalker._rowIndex;
		this._bootstrapgrid = bootstrapgridWalker._bootstrapgrid;
	}

	// @if CK_DEBUG // public get isSpanned(): unknown { return throwMissingGetterError( 'isSpanned' ); }
	// @if CK_DEBUG // public get colspan(): unknown { return throwMissingGetterError( 'colspan' ); }
	// @if CK_DEBUG // public get rowspan(): unknown { return throwMissingGetterError( 'rowspan' ); }
	// @if CK_DEBUG // public get cellIndex(): unknown { return throwMissingGetterError( 'cellIndex' ); }

	/**
	 * Whether the cell is anchored in the current slot.
	 */
	public get isAnchor(): boolean {
		return this.row === this.cellAnchorRow && this.column === this.cellAnchorColumn;
	}

	/**
	 * The width of a cell defined by a `colspan` attribute. If the model attribute is not present, it is set to `1`.
	 */
	public get cellWidth(): number {
		return parseInt( this.cell.getAttribute( 'colspan' ) as string || '1' );
	}

	/**
	 * The height of a cell defined by a `rowspan` attribute. If the model attribute is not present, it is set to `1`.
	 */
	public get cellHeight(): number {
		return parseInt( this.cell.getAttribute( 'rowspan' ) as string || '1' );
	}

	/**
	 * The index of the current row element in the bootstrapgrid.
	 */
	public get rowIndex(): number {
		return this._rowIndex;
	}

	/**
	 * Returns the {@link module:engine/model/position~Position} before the bootstrapgrid slot.
	 */
	public getPositionBefore(): Position {
		const model = this._bootstrapgrid.root.document!.model;

		return model.createPositionAt( this._bootstrapgrid.getChild( this.row ) as Element, this._cellIndex );
	}
}

export type { BootstrapgridSlot };

/**
 * This `BootstrapgridSlot`'s getter (property) was removed in CKEditor 5 v20.0.0.
 *
 * Check out the new `BootstrapgridWalker`'s API in the documentation.
 *
 * @error bootstrapgridslot-getter-removed
 * @param getterName
 */
// @if CK_DEBUG // function throwMissingGetterError( getterName: string ): void {
// @if CK_DEBUG //		throw new CKEditorError( 'bootstrapgridslot-getter-removed', null, {
// @if CK_DEBUG //			getterName
// @if CK_DEBUG //		} );
// @if CK_DEBUG // }
