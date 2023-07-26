/**
 * @module bootstrapgrid/utils/ui/table-properties
 */

import {
	ButtonView,
	Model,
	type ColorOption,
	type LabeledFieldView,
	type ListDropdownItemDefinition,
	type NormalizedColorOption,
	type ToolbarView,
	type View
} from 'ckeditor5/src/ui';

export type BreakpointOption = string | {
    value: string;
    label?: string;
    hasBorder?: boolean;
};
export interface NormalizedBreakpointOption {
    model: string;
    label: string;
    hasBorder: boolean;
    view: {
        name: string;
        value: {
            value: string;
        };
    };
}

export const defaultBreakpoints: Array<BreakpointOption> = [
	{
		value: '0',
		label: '0'
	},
        {
		value: '1',
		label: '1'
	},
        {
		value: '2',
		label: '2'
	},
        {
		value: '3',
		label: '3'
	},
        {
		value: '4',
		label: '4'
	},
        {
		value: '5',
		label: '5'
	},
        {
		value: '6',
		label: '6'
	},
        {
		value: '7',
		label: '7'
	},
        {
		value: '8',
		label: '8'
	},
        {
		value: '9',
		label: '9'
        },
        {
		value: '10',
		label: '10'
	},
        {
		value: '11',
		label: '11'
	},
        {
		value: '12',
		label: '12'
	},
];

/**
 * A simple helper method to detect number strings.
 * I allows full number notation, so omitting 0 is not allowed:
 */
function isNumberString( value: string ) {
	const parsedValue = parseFloat( value );

	return !Number.isNaN( parsedValue ) && value === String( parsedValue );
}

