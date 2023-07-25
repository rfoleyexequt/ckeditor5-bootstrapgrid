/**
 * @module utils/columnoptions
 */

import type { Locale } from '@ckeditor/ckeditor5-utils';

export type ColumnOption = string | {
	breakpoint: string;
	label?: string;
	hasBorder?: boolean;
};


export interface NormalizedColumnOption {
	model: string;
	label: string;
	hasBorder: boolean;
	view: {
		name: string;
		className: string;
            };
	};