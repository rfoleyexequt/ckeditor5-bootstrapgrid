/**
 * @module bootstrapgrid/bootstrapgridcolumnproperties/bootstrapgridcolumnpropertiesediting
 */

// ----------------------------- Core Classes -----------------------------
import { Plugin } from 'ckeditor5/src/core';
import { type Schema, type Conversion, type ViewElement } from 'ckeditor5/src/engine';

// ----------------------------- Converters -----------------------------

// ----------------------------- Definitions -----------------------------
import BootstrapgridEditing from './../bootstrapgridediting';

// ----------------------------- Commands -----------------------------

// ----------------------------- Types -----------------------------
import { getNormalizedDefaultProperties } from '../utils/bootstrapgrid-properties';
import { enableProperty } from '../utils/common';
// ----------------------------- Constants -----------------------------

const COLUMN_VALUES_REG_EXP = /^(0|1|2|3|4|5|6|7|8|9|10|11|12)$/;

/**
 * The Bootstrap Grid column properties editing feature.
 *
 * Introduces bootstrap grid column model attributes and their conversion:
 *
 * - col: 0-12
 * - col-sm: 0-12
 * - col-md: 0-12
 * - col-lg: 0-12
 * - col-xl: 0-12
 * - col-xxl: 0-12
 * - id: int
 *
 * It also registers commands used to manipulate the above attributes:
 *
 * - col: the `'bootstrapgridColumn'`, `'bootstrapgridColumnCol'` commands
 */

export default class BootstrapgridColumnPropertiesEditing extends Plugin {
    /**
     * @inheritDoc
     */
    public static get pluginName() {
        return 'BootstrapgridColumnPropertiesEditing' as const;
    }

    /**
     * @inheritDoc
     */
    public static get requires() {
        return [BootstrapgridEditing] as const;
    }

    /**
 * @inheritDoc
 */
    public init(): void {
        const editor = this.editor;
        const schema = editor.model.schema;
        const conversion = editor.conversion;

        editor.config.define('bootstrapgrid.bootstrapgridColumnProperties.defaultProperties', {});

        const defaultBootstrapgridColumnProperties = getNormalizedDefaultProperties(
            editor.config.get('bootstrapggrid.bootstrapgridColumnProperties.defaultProperties')!,
            {
                isRightToLeftContent: editor.locale.contentLanguageDirection === 'rtl'
            }
        );


    }
}