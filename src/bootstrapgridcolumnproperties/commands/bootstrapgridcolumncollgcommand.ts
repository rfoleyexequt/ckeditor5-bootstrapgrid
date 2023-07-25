/**
 * @module bootstrapgrid/bootstrapgridcolumnproperties/commands/bootstrapgridcolumnbackgroundcolorcommand
 */

import type { Editor } from 'ckeditor5/src/core';

import BootstrapgridColumnPropertyCommand from './bootstrapgridcolumnpropertycommand';

/**
 * The bootstrapgrid column background color command.
 *
 * The command is registered by the {@link module:bootstrapgrid/bootstrapgridcolumnproperties/bootstrapgridcolumnpropertiesediting~BootstrapgridColumnPropertiesEditing} as
 * the `'bootstrapgridColumnColLG'` editor command.
 *
 * To change the background color of selected columns, execute the command:
 *
 * ```ts
 * editor.execute( 'bootstrapgridColumnColLG', {
 *   value: '0'
 * } );
 * ```
 */
export default class BootstrapgridColumnColLGCommand extends BootstrapgridColumnPropertyCommand {
	/**
	 * Creates a new `BootstrapgridColumnColLGCommand` instance.
	 *
	 * @param editor An editor in which this command will be used.
	 * @param defaultValue The default value of the attribute.
	 */
	constructor( editor: Editor, defaultValue: string ) {
		super( editor, 'bootstrapgridColumnColLG', defaultValue );
	}
}
