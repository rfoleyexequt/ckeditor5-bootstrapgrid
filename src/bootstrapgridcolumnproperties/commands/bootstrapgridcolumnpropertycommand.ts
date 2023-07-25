/**
 * @license Copyright (c) 2003-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * @module bootstrapgrid/bootstrapgridcolumnproperties/commands/bootstrapgridcolumnpropertycommand
 */

import { Command, type Editor } from 'ckeditor5/src/core';
import type { Element, Batch } from 'ckeditor5/src/engine';
import type BootstrapgridUtils from '../../bootstrapgridutils';

/**
 * The bootstrapgrid column attribute command.
 *
 * The command is a base command for other bootstrapgrid column property commands.
 */
export default class BootstrapgridColumnPropertyCommand extends Command {
	/**
	 * The attribute that will be set by the command.
	 */
	public readonly attributeName: string;

	/**
	 * The default value for the attribute.
	 */
	protected readonly _defaultValue: string;

	/**
	 * Creates a new `BootstrapgridColumnPropertyCommand` instance.
	 *
	 * @param editor An editor in which this command will be used.
	 * @param attributeName Bootstrapgrid column attribute name.
	 * @param defaultValue The default value of the attribute.
	 */
	constructor( editor: Editor, attributeName: string, defaultValue: string ) {
		super( editor );

		this.attributeName = attributeName;
		this._defaultValue = defaultValue;
	}

	/**
	 * @inheritDoc
	 */
	public override refresh(): void {
		const editor = this.editor;
		const bootstrapgridUtils: BootstrapgridUtils = this.editor.plugins.get( 'BootstrapgridUtils' );
		const selectedBootstrapgridColumns = bootstrapgridUtils.getSelectionAffectedBootstrapgridColumns( editor.model.document.selection );

		this.isEnabled = !!selectedBootstrapgridColumns.length;
		this.value = this._getSingleValue( selectedBootstrapgridColumns );
	}

	/**
	 * Executes the command.
	 *
	 * @fires execute
	 * @param options.value If set, the command will set the attribute on selected bootstrapgrid columns.
	 * If it is not set, the command will remove the attribute from the selected bootstrapgrid columns.
	 * @param options.batch Pass the model batch instance to the command to aggregate changes,
	 * for example to allow a single undo step for multiple executions.
	 */
	public override execute( options: { value?: string | number; batch?: Batch } = {} ): void {
		const { value, batch } = options;
		const model = this.editor.model;
		const bootstrapgridUtils: BootstrapgridUtils = this.editor.plugins.get( 'BootstrapgridUtils' );
		const bootstrapgridColumns = bootstrapgridUtils.getSelectionAffectedBootstrapgridColumns( model.document.selection );
		const valueToSet = this._getValueToSet( value );

		model.enqueueChange( batch, writer => {
			if ( valueToSet ) {
				bootstrapgridColumns.forEach( bootstrapgridColumn => writer.setAttribute( this.attributeName, valueToSet, bootstrapgridColumn ) );
			} else {
				bootstrapgridColumns.forEach( bootstrapgridColumn => writer.removeAttribute( this.attributeName, bootstrapgridColumn ) );
			}
		} );
	}

	/**
	 * Returns the attribute value for a bootstrapgrid column.
	 */
	protected _getAttribute( bootstrapgridColumn: Element | undefined ): unknown {
		if ( !bootstrapgridColumn ) {
			return;
		}

		const value = bootstrapgridColumn.getAttribute( this.attributeName );

		if ( value === this._defaultValue ) {
			return;
		}

		return value;
	}

	/**
	 * Returns the proper model value. It can be used to add a default unit to numeric values.
	 */
	protected _getValueToSet( value: string | number | undefined ): unknown {
		if ( value === this._defaultValue ) {
			return;
		}

		return value;
	}

	/**
	 * Returns a single value for all selected bootstrapgrid columns. If the value is the same for all columns,
	 * it will be returned (`undefined` otherwise).
	 */
	private _getSingleValue( bootstrapgridColumns: Array<Element> ) {
		const firstColumnValue = this._getAttribute( bootstrapgridColumns[ 0 ] );

		const everyColumnHasAttribute = bootstrapgridColumns.every( bootstrapgridColumns => this._getAttribute( bootstrapgridColumns ) === firstColumnValue );

		return everyColumnHasAttribute ? firstColumnValue : undefined;
	}
}
