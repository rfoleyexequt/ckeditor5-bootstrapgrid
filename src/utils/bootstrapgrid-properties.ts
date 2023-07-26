/**
 * @module bootstrapgrid/utils/bootstrapgrid-properties
 */

import type { BoxSides } from 'ckeditor5/src/engine';
import { isObject } from 'lodash-es';

/**
 * Adds a unit to a value if the value is a number or a string representing a number.
 *
 * **Note**: It does nothing to non-numeric values.
 *
 * ```ts
 * getSingleValue( 25, 'px' ); // '25px'
 * getSingleValue( 25, 'em' ); // '25em'
 * getSingleValue( '25em', 'px' ); // '25em'
 * getSingleValue( 'foo', 'px' ); // 'foo'
 * ```
 *
 * @param defaultUnit A default unit added to a numeric value.
 */
export function addDefaultUnitToNumericValue( value: string | number | undefined, defaultUnit: string ): string | number | undefined {
	const numericValue = parseFloat( value as any );

	if ( Number.isNaN( numericValue ) ) {
		return value;
	}

	if ( String( numericValue ) !== String( value ) ) {
		return value;
	}

	return `${ numericValue }${ defaultUnit }`;
}

export interface NormalizedDefaultProperties {
	col: string;
	colSM: string;
	colMD: string;
	colLG: string;
	colXL: string;
	colXXL: string;
}

/**
 * Returns the normalized configuration.
 *
 * @param options.includeColProperty Where the "column base" property should be added.
 * @param options.includeColSMProperty Where the "column small" property should be added.
 * @param options.includeColMDProperty where the "column medium" property should be added.
 * @param options.includeColLGProperty where the "column large" property should be added.
 * @param options.includeColXLProperty where the "column extra large" property should be added.
 * @param options.includeColXXLProperty where the "column extra extra large" property should be added.
 * @param options.isRightToLeftContent Whether the content is right-to-left.
 */
export function getNormalizedDefaultProperties(
	config: Partial<NormalizedDefaultProperties> | undefined,
	options: {
		includeColProperty?: boolean;
		includeColSMProperty?: boolean;
		includeColMDProperty?: boolean;
		includeColLGProperty?: boolean;
                includeColXLProperty?: boolean;
                includeColXXLProperty?: boolean;
		isRightToLeftContent?: boolean;
	} = {}
): NormalizedDefaultProperties {
	const normalizedConfig: NormalizedDefaultProperties = {
                col: '0',
                colSM: '0',
                colMD: '0',
                colLG: '0',
                colXL: '0',
                colXXL: '0',
		...config
	};

	if ( options.includeColProperty && !normalizedConfig.col ) {
		normalizedConfig.col = '0';
	}

        if ( options.includeColSMProperty && !normalizedConfig.colSM ) {
		normalizedConfig.colSM = '0';
	}
        
        if ( options.includeColMDProperty && !normalizedConfig.colMD ) {
		normalizedConfig.colMD = '0';
	}
	
        if ( options.includeColLGProperty && !normalizedConfig.colLG ) {
		normalizedConfig.colLG = '0';
	}
        
        if ( options.includeColXLProperty && !normalizedConfig.colXL ) {
		normalizedConfig.colXL = '0';
	}
        
        if ( options.includeColXXLProperty && !normalizedConfig.colXXL ) {
		normalizedConfig.colXXL = '0';
	}

	return normalizedConfig;
}