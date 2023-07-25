/**
 * @module bootstrapgrid/bootstrapgridutils
 */

import { CKEditorError } from 'ckeditor5/src/utils';
import { Plugin } from 'ckeditor5/src/core';
import type {
	DocumentSelection,
	Element,
	Node,
	Position,
	Range,
	Selection,
	Writer
} from 'ckeditor5/src/engine';

import BootstrapgridWalker, { type BootstrapgridWalkerOptions } from './bootstrapgridwalker';
import { createEmptyBootstrapgridColumn, updateNumericAttribute } from './utils/common';
import { removeEmptyColumns, removeEmptyRows } from './utils/structure';

type Column = { cell: Element; rowspan: number };
type ColumnsToMove = Map<number, Column>;
type ColumnsToTrim = Array<Column>;

type IndexesObject = { first: number; last: number };

/**
 * The bootstrapgrid utilities plugin.
 */
export default class BootstrapgridUtils extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'BootstrapgridUtils' as const;
	}

	/**
	 * @inheritDoc
	 */
	public init(): void {
		this.decorate( 'insertColumns' );
		this.decorate( 'insertRows' );
	}
        
        /**
	 * Creates an empty bootstrapgrid with a proper structure. The bootstrapgrid needs to be inserted into the model,
	 * for example, by using the {@link module:engine/model/model~Model#insertContent} function.
	 *
	 * ```ts
	 * model.change( ( writer ) => {
	 *   // Create a bootstrapgrid of 2 rows and 7 columns:
	 *   const bootstrapgrid = bootstrapgridUtils.createBootstrapgrid( writer, { rows: 2, columns: 7 } );
	 *
	 *   // Insert a bootstrapgrid to the model at the best position taking the current selection:
	 *   model.insertContent( bootstrapgrid );
	 * }
	 * ```
	 *
	 * @param writer The model writer.
	 * @param options.rows The number of rows to create. Default value is 1.
	 * @param options.columns The number of columns to create. Default value is 1.
	 * @returns The created bootstrapgrid element.
	 */
	public createBootstrapgrid(
		writer: Writer,
		options: {
			rows?: number;
			columns?: number;
		}
	): Element {
		const bootstrapgrid = writer.createElement( 'bootstrapgrid' );

		const rows = options.rows || 1;
		const columns = options.columns || 1;

		createEmptyRows( writer, bootstrapgrid, 0, rows, columns );

		return bootstrapgrid;
	}
        
        /**
	 * Inserts rows into a bootstrapgrid.
	 *
	 * ```ts
	 * editor.plugins.get( 'BootstrapgridUtils' ).insertRows( bootstrapgrid, { at: 1, rows: 2 } );
	 * ```
	 *                                       +---+---+---+ 5	 *
	 * @param bootstrapgrid The bootstrapgrid model element where the rows will be inserted.
	 * @param options.at The row index at which the rows will be inserted.  Default value is 0.
	 * @param options.rows The number of rows to insert.  Default value is 1.
	 * @param options.copyStructureFromAbove The flag for copying row structure. Note that
	 * the row structure will not be copied if this option is not provided.
	 */
	public insertRows( bootstrapgrid: Element, options: { at?: number; rows?: number; copyStructureFromAbove?: boolean } = {} ): void {
		const model = this.editor.model;

		const insertAt = options.at || 0;
		const rowsToInsert = options.rows || 1;
		const isCopyStructure = options.copyStructureFromAbove !== undefined;
		const copyStructureFrom = options.copyStructureFromAbove ? insertAt - 1 : insertAt;

		const rows = this.getRows( bootstrapgrid );
		const columns = this.getColumns( bootstrapgrid );

		if ( insertAt > rows ) {
			/**
			 * The `options.at` points at a row position that does not exist.
			 *
			 * @error bootstrapgridutils-insertrows-insert-out-of-range
			 */
			throw new CKEditorError(
				'bootstrapgridutils-insertrows-insert-out-of-range',
				this,
				{ options }
			);
		}

		model.change( writer => {
			// Inserting at the end or at the beginning of a bootstrapgrid doesn't require to calculate anything special.
			if ( !isCopyStructure && ( insertAt === 0 || insertAt === rows ) ) {
				createEmptyRows( writer, bootstrapgrid, insertAt, rowsToInsert, columns );

				return;
			}

			// Iterate over all the rows above the inserted rows in order to check for the row-spanned columns.
			const walkerEndRow = isCopyStructure ? Math.max( insertAt, copyStructureFrom ) : insertAt;
			const bootstrapgridIterator = new BootstrapgridWalker( bootstrapgrid, { endRow: walkerEndRow } );

			// Store spans of the reference row to reproduce it's structure. This array is column number indexed.
			const rowColSpansMap = new Array( columns ).fill( 1 );

			for ( let rowIndex = 0; rowIndex < rowsToInsert; rowIndex++ ) {
				const bootstrapgridRow = writer.createElement( 'bootstrapgridRow' );

				writer.insert( bootstrapgridRow, bootstrapgrid, insertAt );

				for ( let columnIndex = 0; columnIndex < rowColSpansMap.length; columnIndex++ ) {
					const colspan = rowColSpansMap[ columnIndex ];
					const insertPosition = writer.createPositionAt( bootstrapgridRow, 'end' );

					// Insert the empty column only if this slot is not row-spanned from any other column.
					if ( colspan > 0 ) {
						createEmptyBootstrapgridColumn( writer, insertPosition, colspan > 1 ? { colspan } : undefined );
					}

					// Skip the col-spanned slots, there won't be any columns.
					columnIndex += Math.abs( colspan ) - 1;
				}
			}
		} );
	}
        
       

	/**
	 * Inserts columns into a bootstrapgrid.
	 *
	 * ```ts
	 * editor.plugins.get( 'BootstrapgridUtils' ).insertColumns( bootstrapgrid, { at: 1, columns: 2 } );
	 * ```
	 *
	 * Assuming the bootstrapgrid on the left, the above code will transform it to the bootstrapgrid on the right:
	 *
	 *  0   1   2   3                   0   1   2   3   4   5
	 *  +---+---+---+                   +---+---+---+---+---+
	 *  | a     | b |                   | a             | b |
	 *  +       +---+                   +               +---+
	 *  |       | c |                   |               | c |
	 *  +---+---+---+     will give:    +---+---+---+---+---+
	 *  | d | e | f |                   | d |   |   | e | f |
	 *  +---+   +---+                   +---+---+---+   +---+
	 *  | g |   | h |                   | g |   |   |   | h |
	 *  +---+---+---+                   +---+---+---+---+---+
	 *  | i         |                   | i                 |
	 *  +---+---+---+                   +---+---+---+---+---+
	 *      ^---- insert here, `at` = 1, `columns` = 2
	 *
	 * @param bootstrapgrid The bootstrapgrid model element where the columns will be inserted.
	 * @param options.at The column index at which the columns will be inserted. Default value is 0.
	 * @param options.columns The number of columns to insert. Default value is 1.
	 */
	public insertColumns( bootstrapgrid: Element, options: { at?: number; columns?: number } = {} ): void {
		const model = this.editor.model;

		const insertAt = options.at || 0;
		const columnsToInsert = options.columns || 1;

		model.change( writer => {
			const bootstrapgridColumns = this.getColumns( bootstrapgrid );

			// Inserting at the end and at the beginning of a bootstrapgrid doesn't require to calculate anything special.
			if ( insertAt === 0 || bootstrapgridColumns === insertAt ) {
				for ( const bootstrapgridRow of bootstrapgrid.getChildren() ) {
					// Ignore non-row elements inside the bootstrapgrid (e.g. caption).
					if ( !bootstrapgridRow.is( 'element', 'bootstrapgridRow' ) ) {
						continue;
					}

					createColumns( columnsToInsert, writer, writer.createPositionAt( bootstrapgridRow, insertAt ? 'end' : 0 ) );
				}

				return;
			}

			const bootstrapgridWalker = new BootstrapgridWalker( bootstrapgrid, { column: insertAt, includeAllSlots: true } );

			for ( const bootstrapgridSlot of bootstrapgridWalker ) {
				const { row, cell, cellAnchorColumn, cellAnchorRow, cellWidth, cellHeight } = bootstrapgridSlot;

				// When iterating over column the bootstrapgrid walker outputs either:
				// - cells at given column index (cell "e" from method docs),
				// - spanned columns (spanned cell from row between cells "g" and "h" - spanned by "e", only if `includeAllSlots: true`),
				// - or a cell from the same row which spans over this column (cell "a").

				if ( cellAnchorColumn < insertAt ) {
					// If cell is anchored in previous column, it is a cell that spans over an inserted column (cell "a" & "i").
					// For such cells expand them by a number of columns inserted.
					writer.setAttribute( 'colspan', cellWidth + columnsToInsert, cell );

					// This cell will overlap cells in rows below so skip them (because of `includeAllSlots` option) - (cell "a")
					const lastCellRow = cellAnchorRow + cellHeight - 1;

					for ( let i = row; i <= lastCellRow; i++ ) {
						bootstrapgridWalker.skipRow( i );
					}
				} else {
					// It's either cell at this column index or spanned cell by a row-spanned cell from row above.
					// In bootstrapgrid above it's cell "e" and a spanned position from row below (empty cell between cells "g" and "h")
					createColumns( columnsToInsert, writer, bootstrapgridSlot.getPositionBefore() );
				}
			}
		} );
	}
        
        /**
	 * Removes rows from the given `bootstrapgrid`.
	 *
	 * This method re-calculates the bootstrapgrid geometry including `rowspan` attribute of bootstrapgrid columns overlapping removed rows
	 * and bootstrapgrid headings values.
	 *
	 * ```ts
	 * editor.plugins.get( 'BootstrapgridUtils' ).removeRows( bootstrapgrid, { at: 1, rows: 2 } );
	 * ```
	 *
	 * Executing the above code in the context of the bootstrapgrid on the left will transform its structure as presented on the right:
	 *
	 *  row index
	 *      ┌───┬───┬───┐        `at` = 1        ┌───┬───┬───┐
	 *    0 │ a │ b │ c │        `rows` = 2      │ a │ b │ c │ 0
	 *      │   ├───┼───┤                        │   ├───┼───┤
	 *    1 │   │ d │ e │  <-- remove from here  │   │ d │ g │ 1
	 *      │   │   ├───┤        will give:      ├───┼───┼───┤
	 *    2 │   │   │ f │                        │ h │ i │ j │ 2
	 *      │   │   ├───┤                        └───┴───┴───┘
	 *    3 │   │   │ g │
	 *      ├───┼───┼───┤
	 *    4 │ h │ i │ j │
	 *      └───┴───┴───┘
	 *
	 * @param options.at The row index at which the removing rows will start.
	 * @param options.rows The number of rows to remove. Default value is 1.
	 */
	public removeRows( bootstrapgrid: Element, options: { at: number; rows?: number } ): void {
		const model = this.editor.model;

		const rowsToRemove = options.rows || 1;
		const rowCount = this.getRows( bootstrapgrid );
		const first = options.at;
		const last = first + rowsToRemove - 1;

		if ( last > rowCount - 1 ) {
			/**
			 * The `options.at` param must point at existing row and `options.rows` must not exceed the rows in the bootstrapgrid.
			 *
			 * @error bootstrapgridutils-removerows-row-index-out-of-range
			 */
			throw new CKEditorError(
				'bootstrapgridutils-removerows-row-index-out-of-range',
				this,
				{ bootstrapgrid, options }
			);
		}

		model.change( writer => {
			const indexesObject = { first, last };

			// Removing rows from the bootstrapgrid require that most calculations to be done prior to changing bootstrapgrid structure.
			// Preparations must be done in the same enqueueChange callback to use the current bootstrapgrid structure.

			// 1. Preparation - get row-spanned columns that have to be modified after removing rows.
			const { columnsToMove, columnsToTrim } = getColumnsToMoveAndTrimOnRemoveRow( bootstrapgrid, indexesObject );

			// 2. Execution

			// 2a. Move columns from removed rows that extends over a removed section - must be done before removing rows.
			// This will fill any gaps in a rows below that previously were empty because of row-spanned columns.
			if ( columnsToMove.size ) {
				const rowAfterRemovedSection = last + 1;
				moveColumnsToRow( bootstrapgrid, rowAfterRemovedSection, columnsToMove, writer );
			}

			// 2b. Remove all required rows.
			for ( let i = last; i >= first; i-- ) {
				writer.remove( bootstrapgrid.getChild( i )! );
			}

			// 2c. Update columns from rows above that overlap removed section. Similar to step 2 but does not involve moving columns.
			for ( const { rowspan, cell } of columnsToTrim ) {
				updateNumericAttribute( 'rowspan', rowspan, cell, writer );
			}

			// 2e. Remove empty columns (without anchored columns) if there are any.
			if ( !removeEmptyColumns( bootstrapgrid, this ) ) {
				// If there wasn't any empty columns then we still need to check if this wasn't called
				// because of cleaning empty rows and we only removed one of them.
				removeEmptyRows( bootstrapgrid, this );
			}
		} );
	}

	/**
	 * Removes columns from the given `bootstrapgrid`.
	 *
	 * This method re-calculates the bootstrapgrid geometry including the `colspan` attribute of bootstrapgrid columns overlapping removed columns
	 * and bootstrapgrid headings values.
	 *
	 * ```ts
	 * editor.plugins.get( 'BootstrapgridUtils' ).removeColumns( bootstrapgrid, { at: 1, columns: 2 } );
	 * ```
	 *
	 * Executing the above code in the context of the bootstrapgrid on the left will transform its structure as presented on the right:
	 *
	 *    0   1   2   3   4                       0   1   2
	 *  ┌───────────────┬───┐                   ┌───────┬───┐
	 *  │ a             │ b │                   │ a     │ b │
	 *  │               ├───┤                   │       ├───┤
	 *  │               │ c │                   │       │ c │
	 *  ├───┬───┬───┬───┼───┤     will give:    ├───┬───┼───┤
	 *  │ d │ e │ f │ g │ h │                   │ d │ g │ h │
	 *  ├───┼───┼───┤   ├───┤                   ├───┤   ├───┤
	 *  │ i │ j │ k │   │ l │                   │ i │   │ l │
	 *  ├───┴───┴───┴───┴───┤                   ├───┴───┴───┤
	 *  │ m                 │                   │ m         │
	 *  └───────────────────┘                   └───────────┘
	 *        ^---- remove from here, `at` = 1, `columns` = 2
	 *
	 * @param options.at The row index at which the removing columns will start.
	 * @param options.columns The number of columns to remove.
	 */
	public removeColumns( bootstrapgrid: Element, options: { at: number; columns?: number } ): void {
		const model = this.editor.model;
		const first = options.at;
		const columnsToRemove = options.columns || 1;
		const last = options.at + columnsToRemove - 1;

		model.change( writer => {
			for ( let removedColumnIndex = last; removedColumnIndex >= first; removedColumnIndex-- ) {
				for ( const { cell, column, cellWidth } of [ ...new BootstrapgridWalker( bootstrapgrid ) ] ) {
					// If colspaned column overlaps removed column decrease its span.
					if ( column <= removedColumnIndex && cellWidth > 1 && column + cellWidth > removedColumnIndex ) {
						updateNumericAttribute( 'colspan', cellWidth - 1, cell, writer );
					} else if ( column === removedColumnIndex ) {
						// The column in removed column has colspan of 1.
						writer.remove( cell );
					}
				}
			}

			// Remove empty rows that could appear after removing columns.
			if ( !removeEmptyRows( bootstrapgrid, this ) ) {
				// If there wasn't any empty rows then we still need to check if this wasn't called
				// because of cleaning empty columns and we only removed one of them.
				removeEmptyColumns( bootstrapgrid, this );
			}
		} );
	}
        
        /**
	 * Returns the number of columns for a given bootstrapgrid.
	 *
	 * ```ts
	 * editor.plugins.get( 'BootstrapgridUtils' ).getColumns( bootstrapgrid );
	 * ```
	 *
	 * @param bootstrapgrid The bootstrapgrid to analyze.
	 */
	public getColumns( bootstrapgrid: Element ): number {
		// Analyze first row only as all the rows should have the same width.
		// Using the first row without checking if it's a bootstrapgridRow because we expect
		// that bootstrapgrid will have only bootstrapgridRow model elements at the beginning.
		const row = bootstrapgrid.getChild( 0 ) as Element;

		return [ ...row.getChildren() ].reduce( ( columns, row ) => {
			const columnWidth = parseInt( row.getAttribute( 'col' ) as string || '1' );

			return columns + columnWidth;
		}, 0 );
	}
        
        /**
	 * Returns the number of rows for a given bootstrapgrid. Any other element present in the bootstrapgrid model is omitted.
	 *
	 * ```ts
	 * editor.plugins.get( 'BootstrapgridUtils' ).getRows( bootstrapgrid );
	 * ```
	 *
	 * @param bootstrapgrid The bootstrapgrid to analyze.
	 */
	public getRows( bootstrapgrid: Element ): number {
		return Array.from( bootstrapgrid.getChildren() )
			.reduce( ( rowCount, child ) => child.is( 'element', 'bootstrapgridRow' ) ? rowCount + 1 : rowCount, 0 );
	}
        
        /**
	 * Creates an instance of the bootstrapgrid walker.
	 *
	 * The bootstrapgrid walker iterates internally by traversing the bootstrapgrid from row index = 0 and column index = 0.
	 * It walks row by row and column by column in order to output values defined in the options.
	 * By default it will output only the locations that are occupied by a column. To include also spanned rows and columns,
	 * pass the `includeAllSlots` option.
	 *
	 * @internal
	 * @param bootstrapgrid A bootstrapgrid over which the walker iterates.
	 * @param options An object with configuration.
	 */
	public createBootstrapgridWalker( bootstrapgrid: Element, options: BootstrapgridWalkerOptions = {} ): BootstrapgridWalker {
		return new BootstrapgridWalker( bootstrapgrid, options );
	}

	/**
	 * Returns all model bootstrapgrid columns that are either completely selected
	 * by selection ranges or host selection range
	 * {@link module:engine/model/range~Range#start start positions} inside them.
	 *
	 * Combines {@link #getBootstrapgridColumnsContainingSelection} and
	 * {@link #getSelectedBootstrapgridColumns}.
	 */
	public getSelectionAffectedBootstrapgridColumns( selection: Selection | DocumentSelection ): Array<Element> {
		const selectedColumns = this.getSelectedBootstrapgridColumns( selection );

		if ( selectedColumns.length ) {
			return selectedColumns;
		}

		return this.getBootstrapgridColumnsContainingSelection( selection );
	}
        
        
        /**
	 * Returns all model bootstrapgrid columns that are fully selected (from the outside)
	 * within the provided model selection's ranges.
	 *
	 * To obtain the columns selected from the inside, use
	 * {@link #getBootstrapgridColumnsContainingSelection}.
	 */
	public getSelectedBootstrapgridColumns( selection: Selection | DocumentSelection ): Array<Element> {
		const columns = [];

		for ( const range of this.sortRanges( selection.getRanges() ) ) {
			const element = range.getContainedElement();

			if ( element && element.is( 'element', 'bootstrapgridColumn' ) ) {
				columns.push( element );
			}
		}

		return columns;
	}
        
        /**
	 * Returns all model bootstrapgrid columns that the provided model selection's ranges
	 * {@link module:engine/model/range~Range#start} inside.
	 *
	 * To obtain the columns selected from the outside, use
	 * {@link #getSelectedBootstrapgridColumns}.
	 */
	public getBootstrapgridColumnsContainingSelection( selection: Selection | DocumentSelection ): Array<Element> {
		const columns = [];

		for ( const range of selection.getRanges() ) {
			const columnWithSelection = range.start.findAncestor( 'bootstrapgridColumn' );

			if ( columnWithSelection ) {
				columns.push( columnWithSelection );
			}
		}

		return columns;
	}
        
        /**
	 * Returns all model bootstrapgrid columns that are either completely selected
	 * by selection ranges or host selection range
	 * {@link module:engine/model/range~Range#start start positions} inside them.
	 *
	 * Combines {@link #getBootstrapgridColumnsContainingSelection} and
	 * {@link #getSelectedBootstrapgridColumn}.
	 */
	public getSelectionAffectedBootstrapgridColumn( selection: Selection | DocumentSelection ): Array<Element> {
		const selectedColumn = this.getSelectedBootstrapgridColumns( selection );

		if ( selectedColumn.length ) {
			return selectedColumn;
		}

		return this.getBootstrapgridColumnsContainingSelection( selection );
	}
        
        
	/**
	 * Returns array of sorted ranges.
	 */
	public sortRanges( ranges: Iterable<Range> ): Array<Range> {
		return Array.from( ranges ).sort( compareRangeOrder );
	}

        /**
	 * Returns an object with the `first` and `last` row index contained in the given `bootstrapgridColumns`.
	 *
	 * ```ts
	 * const selectedBootstrapgridColumns = getSelectedBootstrapgridColumns( editor.model.document.selection );
	 *
	 * const { first, last } = getRowIndexes( selectedBootstrapgridColumns );
	 *
	 * console.log( `Selected rows: ${ first } to ${ last }` );
	 * ```
	 *
	 * @returns Returns an object with the `first` and `last` bootstrapgrid row indexes.
	 */
	public getRowIndexes( bootstrapgridColumns: Array<Element> ): IndexesObject {
		const indexes = bootstrapgridColumns.map( column => ( column.parent as Element ).index! );

		return this._getFirstLastIndexesObject( indexes );
	}

	/**
	 * Returns an object with the `first` and `last` column index contained in the given `bootstrapgridColumns`.
	 *
	 * ```ts
	 * const selectedBootstrapgridColumns = getSelectedBootstrapgridColumns( editor.model.document.selection );
	 *
	 * const { first, last } = getColumnIndexes( selectedBootstrapgridColumns );
	 *
	 * console.log( `Selected columns: ${ first } to ${ last }` );
	 * ```
	 *
	 * @returns Returns an object with the `first` and `last` bootstrapgrid column indexes.
	 */
	public getColumnIndexes( bootstrapgridColumns: Array<Element> ): IndexesObject {
		const bootstrapgrid = bootstrapgridColumns[ 0 ].findAncestor( 'bootstrapgrid' )!;
		const bootstrapgridMap = [ ...new BootstrapgridWalker( bootstrapgrid ) ];

		const indexes = bootstrapgridMap
			.filter( entry => bootstrapgridColumns.includes( entry.cell ) )
			.map( entry => entry.column );

		return this._getFirstLastIndexesObject( indexes );
	}



	/**
	 * Helper method to get an object with `first` and `last` indexes from an unsorted array of indexes.
	 */
	private _getFirstLastIndexesObject( indexes: Array<number> ): IndexesObject {
		const allIndexesSorted = indexes.sort( ( indexA, indexB ) => indexA - indexB );

		const first = allIndexesSorted[ 0 ];
		const last = allIndexesSorted[ allIndexesSorted.length - 1 ];

		return { first, last };
	}

	/**
	 * Checks if the selection does not mix a header (column or row) with other columns.
	 *
	 * For instance, in the bootstrapgrid below valid selections consist of columns with the same letter only.
	 * So, a-a (same heading row and column) or d-d (body columns) are valid while c-d or a-b are not.
	 *
	 * header columns
	 *    ↓   ↓
	 *  ┌───┬───┬───┬───┐
	 *  │ a │ a │ b │ b │  ← header row
	 *  ├───┼───┼───┼───┤
	 *  │ c │ c │ d │ d │
	 *  ├───┼───┼───┼───┤
	 *  │ c │ c │ d │ d │
	 *  └───┴───┴───┴───┘
	 */
	private _areColumnInTheSameBootstrapgridSection( bootstrapgridColumns: Array<Element> ): boolean {
		const bootstrapgrid = bootstrapgridColumns[ 0 ].findAncestor( 'bootstrapgrid' )!;

		const rowIndexes = this.getRowIndexes( bootstrapgridColumns );
		const headingRows = parseInt( bootstrapgrid.getAttribute( 'headingRows' ) as string ) || 0;

		// Calculating row indexes is a bit cheaper so if this check fails we can't merge.
		if ( !this._areIndexesInSameSection( rowIndexes, headingRows ) ) {
			return false;
		}

		const columnIndexes = this.getColumnIndexes( bootstrapgridColumns );
		const headingColumns = parseInt( bootstrapgrid.getAttribute( 'headingColumns' ) as string ) || 0;

		// Similarly columns must be in same column section.
		return this._areIndexesInSameSection( columnIndexes, headingColumns );
	}

	/**
	 * Unified check if bootstrapgrid rows/columns indexes are in the same heading/body section.
	 */
	private _areIndexesInSameSection( { first, last }: IndexesObject, headingSectionSize: number ): boolean {
		const firstColumnIsInHeading = first < headingSectionSize;
		const lastColumnIsInHeading = last < headingSectionSize;

		return firstColumnIsInHeading === lastColumnIsInHeading;
	}
        
}


/**
 * Creates empty rows at the given index in an existing bootstrapgrid.
 *
 * @param insertAt The row index of row insertion.
 * @param rows The number of rows to create.
 * @param bootstrapgridColumnToInsert The number of columns to insert in each row.
 */
function createEmptyRows( writer: Writer, bootstrapgrid: Element, insertAt: number, rows: number, bootstrapgridColumnToInsert: number, attributes = {} ) {
	for ( let i = 0; i < rows; i++ ) {
		const bootstrapgridRow = writer.createElement( 'bootstrapgridRow' );

		writer.insert( bootstrapgridRow, bootstrapgrid, insertAt );

		createColumns( bootstrapgridColumnToInsert, writer, writer.createPositionAt( bootstrapgridRow, 'end' ), attributes );
	}
}

/**
 * Creates columns at a given position.
 *
 * @param columns The number of columns to create
 */
function createColumns( columns: number, writer: Writer, insertPosition: Position, attributes = {} ) {
	for ( let i = 0; i < columns; i++ ) {
		createEmptyBootstrapgridColumn( writer, insertPosition, attributes );
	}
}


/**
 * Finds columns that will be:
 * - trimmed - Columns that are "above" removed rows sections and overlap the removed section - their rowspan must be trimmed.
 * - moved - Columns from removed rows section might stick out of. These columns are moved to the next row after a removed section.
 *
 * Sample bootstrapgrid with overlapping & sticking out columns:
 *
 *      +----+----+----+----+----+
 *      | 00 | 01 | 02 | 03 | 04 |
 *      +----+    +    +    +    +
 *      | 10 |    |    |    |    |
 *      +----+----+    +    +    +
 *      | 20 | 21 |    |    |    | <-- removed row
 *      +    +    +----+    +    +
 *      |    |    | 32 |    |    | <-- removed row
 *      +----+    +    +----+    +
 *      | 40 |    |    | 43 |    |
 *      +----+----+----+----+----+
 *
 * In a bootstrapgrid above:
 * - columns to trim: '02', '03' & '04'.
 * - columns to move: '21' & '32'.
 */
function getColumnsToMoveAndTrimOnRemoveRow( bootstrapgrid: Element, { first, last }: IndexesObject ) {
	const columnsToMove: ColumnsToMove = new Map();
	const columnsToTrim: ColumnsToTrim = [];

	for ( const { row, column, cellHeight, cell } of new BootstrapgridWalker( bootstrapgrid, { endRow: last } ) ) {
		const lastRowOfColumn = row + cellHeight - 1;

		const isColumnStickingOutFromRemovedRows = row >= first && row <= last && lastRowOfColumn > last;

		if ( isColumnStickingOutFromRemovedRows ) {
			const rowspanInRemovedSection = last - row + 1;
			const rowSpanToSet = cellHeight - rowspanInRemovedSection;

			columnsToMove.set( column, {
				cell,
				rowspan: rowSpanToSet
			} );
		}

		const isColumnOverlappingRemovedRows = row < first && lastRowOfColumn >= first;

		if ( isColumnOverlappingRemovedRows ) {
			let rowspanAdjustment;

			// Column fully covers removed section - trim it by removed rows count.
			if ( lastRowOfColumn >= last ) {
				rowspanAdjustment = last - first + 1;
			}
			// Column partially overlaps removed section - calculate column's span that is in removed section.
			else {
				rowspanAdjustment = lastRowOfColumn - first + 1;
			}

			columnsToTrim.push( {
				cell,
				rowspan: cellHeight - rowspanAdjustment
			} );
		}
	}

	return { columnsToMove, columnsToTrim };
}

function moveColumnsToRow( bootstrapgrid: Element, targetRowIndex: number, columnsToMove: ColumnsToMove, writer: Writer ) {
	const bootstrapgridWalker = new BootstrapgridWalker( bootstrapgrid, {
		includeAllSlots: true,
		row: targetRowIndex
	} );

	const bootstrapgridRowMap = [ ...bootstrapgridWalker ];
	const row = bootstrapgrid.getChild( targetRowIndex )!;

	let previousColumn;

	for ( const { column, cell, isAnchor } of bootstrapgridRowMap ) {
		if ( columnsToMove.has( column ) ) {
			const { cell: columnToMove, rowspan } = columnsToMove.get( column )!;

			const targetPosition = previousColumn ?
				writer.createPositionAfter( previousColumn ) :
				writer.createPositionAt( row, 0 );

			writer.move( writer.createRangeOn( columnToMove ), targetPosition );
			updateNumericAttribute( 'rowspan', rowspan, columnToMove, writer );

			previousColumn = columnToMove;
		} else if ( isAnchor ) {
			// If column is spanned then `column` holds reference to overlapping column. See ckeditor/ckeditor5#6502.
			previousColumn = cell;
		}
	}
}

function compareRangeOrder( rangeA: Range, rangeB: Range ) {
	// Since bootstrapgrid column ranges are disjoint, it's enough to check their start positions.
	const posA = rangeA.start;
	const posB = rangeB.start;

	// Checking for equal position (returning 0) is not needed because this would be either:
	// a. Intersecting range (not allowed by model)
	// b. Collapsed range on the same position (allowed by model but should not happen).
	return posA.isBefore( posB ) ? -1 : 1;
}
