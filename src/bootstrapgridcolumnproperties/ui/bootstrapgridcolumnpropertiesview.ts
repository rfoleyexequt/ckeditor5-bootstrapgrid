/**
 * @module bootstrapgrid/bootstrapgridcolumnproperties/ui/bootstrapgcolumnpropertiesview
 */

// ----------------------------- Core Classes -----------------------------
import {
	addListToDropdown,
	ButtonView,
	createLabeledDropdown,
	createLabeledInputText,
	FocusCycler,
	FormHeaderView,
	LabeledFieldView,
	LabelView,
	submitHandler,
	ToolbarView,
	View,
	ViewCollection,
	type FocusableView
} from 'ckeditor5/src/ui';
import {
	KeystrokeHandler,
	FocusTracker,
	type Locale,
	type ObservableChangeEvent
} from 'ckeditor5/src/utils';
import { icons } from 'ckeditor5/src/core';

// ----------------------------- Properties -----------------------------
import type { BootstrapgridColumnPropertiesOptions } from '../../bootstrapgridconfig';

// ----------------------------- Theme Styles -----------------------------
import '../../../theme/form.css';
import '../../../theme/bootstrapgridform.css';
import '../../../theme/bootstrapgridcolumnproperties.css';

// ----------------------------- Constants -----------------------------


// ----------------------------- Interfaces -----------------------------
export interface BootstrapgirdColumnPropertiesViewOptions {
	defaultBootstrapgridColumnProperties: BootstrapgridColumnPropertiesOptions;
}

/**
 * The class representing a bootstrapgrid column properties form, allowing users to customize
 * certain class aspects of a bootstrapgrid column, for instance, col, sm, md, lg breakpoints.
 */
export default class BootstrapgridColumnPropertiesView extends View {
	/**
	 * The value of the cell border style.
	 *
	 * @observable
	 * @default ''
	 */
	public declare borderStyle: string;
}