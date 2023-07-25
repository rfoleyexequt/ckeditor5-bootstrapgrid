/**
 * @module bootstrapgrid/bootstrapgridui
 */
// ----------------------------- Core Classes -----------------------------
import { Plugin, type Command, type Editor } from 'ckeditor5/src/core';
import {
    addListToDropdown,
    createDropdown,
    Model,
    SplitButtonView,
    SwitchButtonView,
    type DropdownView,
    type ListDropdownItemDefinition
} from 'ckeditor5/src/ui';
import { Collection, type Locale } from 'ckeditor5/src/utils';

// ----------------------------- Views -----------------------------

// ----------------------------- Icons -----------------------------

// ----------------------------- Commands -----------------------------

/**
 * The bootstrapgrid UI plugin. It introduces:
 *
 * * The `'insertBootstrapgrid'` dropdown,
 * * The `'bootstrapgridColumn'` dropdown,
 * * The `'bootstrapgridRow'` dropdown,
 *
 * The `'bootstrapgridColumn'`, `'bootstrapgridRow'` dropdowns work best with {@link module:bootstrapgrid/bootstrapgridtoolbar~BootstrapgridToolbar}.
 */
export default class BootstrapgridUI extends Plugin {
	/**
	 * @inheritDoc
	 */
	public static get pluginName() {
		return 'BootstrapgridUI' as const;
	}
}